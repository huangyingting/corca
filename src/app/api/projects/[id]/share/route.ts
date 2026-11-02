import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createOpaqueToken,
  hashOpaqueToken,
  isValidAccountEmail,
  normalizeAccountEmail,
  recordAuditLog,
} from '@/lib/account-admission';
import { resolveProjectAccess } from '../route';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission } = await resolveProjectAccess(id);
  if (!project || !permission) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    owner: project.owner,
    collaborators: project.collaborators,
    shareLinks: project.shareLinks.map((l) => ({
      id: l.id,
      permission: l.permission,
      scopeType: l.scopeType,
      scopePath: l.scopePath,
      rawToken: l.rawToken,
      shareUrl: `/app/projects/${id}?share=${l.rawToken}`,
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
    })),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission, user } = await resolveProjectAccess(id);
  if (!project || (permission !== 'OWNER' && permission !== 'EDITOR')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const scopeType = ['PROJECT', 'FOLDER', 'FILE'].includes(body.scopeType)
    ? body.scopeType
    : 'PROJECT';
  const scopePath =
    typeof body.scopePath === 'string' && body.scopePath.trim()
      ? body.scopePath.trim()
      : '/';
  const rolePermission = ['VIEWER', 'COMMENTER', 'EDITOR'].includes(body.permission)
    ? body.permission
    : 'VIEWER';

  // 1. Create a shareable access link
  if (body.kind === 'link') {
    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const link = await prisma.projectShareLink.create({
      data: {
        projectId: id,
        tokenHash,
        rawToken,
        permission: rolePermission,
        scopeType,
        scopePath,
        createdById: user?.id || null,
      },
    });

    await prisma.project.update({
      where: { id },
      data: { visibility: 'shared' },
    });

    if (user) {
      await recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'project.share.link_create',
        targetType: 'project',
        targetId: id,
        targetLabel: project.name,
        metadata: { scopeType, scopePath, permission: rolePermission },
      });
    }

    const shareUrl = `/app/projects/${id}?share=${rawToken}`;
    const linkPayload = {
      ...link,
      token: rawToken,
      shareUrl,
    };

    return NextResponse.json(
      {
        ok: true,
        shareUrl,
        link: linkPayload,
        shareLink: linkPayload,
      },
      { status: 201 }
    );
  }

  // 2. Invite a collaborator by email
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  if (!isValidAccountEmail(rawEmail)) {
    return NextResponse.json(
      { error: 'invalid_email', message: 'Enter a valid email address.' },
      { status: 400 }
    );
  }
  const email = normalizeAccountEmail(rawEmail);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  const collaborator = await prisma.projectCollaborator.upsert({
    where: {
      projectId_email_scopeType_scopePath: {
        projectId: id,
        email,
        scopeType,
        scopePath,
      },
    },
    create: {
      projectId: id,
      userId: existingUser?.id || null,
      email,
      permission: rolePermission,
      scopeType,
      scopePath,
      status: 'ACTIVE',
      invitedById: user?.id || null,
    },
    update: {
      permission: rolePermission,
      userId: existingUser?.id || null,
      status: 'ACTIVE',
    },
  });

  await prisma.project.update({
    where: { id },
    data: { visibility: 'shared' },
  });

  if (user) {
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'project.share.invite',
      targetType: 'project',
      targetId: id,
      targetLabel: `${project.name} -> ${email}`,
      metadata: { email, scopeType, scopePath, permission: rolePermission },
    });
  }

  return NextResponse.json({ ok: true, collaborator }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission, user } = await resolveProjectAccess(id);
  if (!project || (permission !== 'OWNER' && permission !== 'EDITOR')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const collaboratorId = request.nextUrl.searchParams.get('collaboratorId');
  const linkId = request.nextUrl.searchParams.get('linkId');

  if (collaboratorId) {
    await prisma.projectCollaborator.updateMany({
      where: { id: collaboratorId, projectId: id },
      data: { status: 'REVOKED' },
    });
  }

  if (linkId) {
    await prisma.projectShareLink.updateMany({
      where: { id: linkId, projectId: id },
      data: { revokedAt: new Date() },
    });
  }

  if (user) {
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'project.share.revoke',
      targetType: 'project',
      targetId: id,
      targetLabel: project.name,
      metadata: { collaboratorId, linkId },
    });
  }

  return NextResponse.json({ ok: true });
}
