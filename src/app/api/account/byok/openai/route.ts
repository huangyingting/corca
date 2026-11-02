import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, recordAuditLog } from '@/lib/account-admission';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    configured: Boolean(user.byokOpenAiKeyEncrypted),
    keyHint: user.byokOpenAiKeyHint || null,
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  if (!apiKey.startsWith('sk-') || apiKey.length < 16) {
    return NextResponse.json(
      { error: 'invalid_key', message: 'Enter a valid OpenAI API key starting with sk-.' },
      { status: 400 }
    );
  }

  const keyHint = `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      byokOpenAiKeyEncrypted: apiKey,
      byokOpenAiKeyHint: keyHint,
    },
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'account.byok.update',
    targetType: 'user',
    targetId: user.id,
    targetLabel: user.email,
    metadata: { keyHint },
  });

  return NextResponse.json({
    ok: true,
    configured: true,
    keyHint,
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      byokOpenAiKeyEncrypted: null,
      byokOpenAiKeyHint: null,
    },
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'account.byok.remove',
    targetType: 'user',
    targetId: user.id,
    targetLabel: user.email,
  });

  return NextResponse.json({ ok: true, configured: false, keyHint: null });
}
