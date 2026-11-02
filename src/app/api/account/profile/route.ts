import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  clearDatabaseSessionCookie,
  getCurrentUser,
  hashPassword,
  recordAuditLog,
  revokeUserSessions,
  verifyPassword,
} from '@/lib/account-admission';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { provider: true, createdAt: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      planTier: user.operatorGrantPlan || user.planTier,
      operatorGrantPlan: user.operatorGrantPlan,
      uiLanguage: user.uiLanguage,
      dailyTokensUsed: user.dailyTokensUsed,
      monthlyTokensUsed: user.monthlyTokensUsed,
      storageBytesUsed: user.storageBytesUsed,
      byokConfigured: Boolean(user.byokOpenAiKeyEncrypted),
      byokKeyHint: user.byokOpenAiKeyHint,
      labs: (() => {
        try {
          return JSON.parse(user.labsConfigJson);
        } catch {
          return {};
        }
      })(),
      connectedProviders: accounts.map((a) => a.provider),
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  // Handle feedback submission from account menu
  if (body.action === 'submit_feedback') {
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const category = typeof body.category === 'string' ? body.category : 'feedback';
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }
    const entry = await prisma.userFeedback.create({
      data: {
        userId: user.id,
        category,
        message: message.slice(0, 4000),
        pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl : null,
      },
    });
    return NextResponse.json({ ok: true, feedback: entry });
  }

  // Handle password update
  if (body.action === 'change_password') {
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const cred = await prisma.passwordCredential.findUnique({
      where: { userId: user.id },
    });
    if (cred) {
      const ok = await verifyPassword(currentPassword, cred.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: 'Current password is incorrect.' },
          { status: 403 }
        );
      }
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.passwordCredential.upsert({
      where: { userId: user.id },
      create: { userId: user.id, passwordHash },
      update: { passwordHash, passwordChangedAt: new Date() },
    });

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'account.password.change',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
    });

    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) {
    updates.name = body.name.trim().slice(0, 120);
  }
  if (typeof body.uiLanguage === 'string' && body.uiLanguage.trim()) {
    updates.uiLanguage = body.uiLanguage.trim();
  }
  if (body.labs && typeof body.labs === 'object') {
    updates.labsConfigJson = JSON.stringify(body.labs);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      uiLanguage: updated.uiLanguage,
      labs: (() => {
        try {
          return JSON.parse(updated.labsConfigJson);
        } catch {
          return {};
        }
      })(),
    },
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'account.self_delete',
    targetType: 'user',
    targetId: user.id,
    targetLabel: user.email,
  });

  await revokeUserSessions(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'deleting' },
  });

  const response = NextResponse.json({ ok: true });
  clearDatabaseSessionCookie(response);
  return response;
}
