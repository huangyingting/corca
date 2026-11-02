import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashOpaqueToken, recordAuditLog } from '@/lib/account-admission';
import { compileProjectWorkspace } from '@/lib/compiler/compile-engine';

export async function resolveProjectAccess(
  projectId: string,
  shareToken?: string | null
) {
  const user = await getCurrentUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      files: { orderBy: [{ isMain: 'desc' }, { path: 'asc' }] },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { createdBy: { select: { name: true, email: true } } },
      },
      comments: { orderBy: { createdAt: 'asc' } },
      collaborators: { where: { status: 'ACTIVE' } },
      shareLinks: { where: { revokedAt: null } },
    },
  });

  if (!project) return { project: null, permission: null, user };

  if (user && (project.ownerId === user.id || user.role === 'Admin')) {
    return { project, permission: 'OWNER' as const, user };
  }

  if (user) {
    const collab = project.collaborators.find(
      (c) => c.userId === user.id || c.email.toLowerCase() === user.email.toLowerCase()
    );
    if (collab) {
      return {
        project,
        permission: collab.permission as 'VIEWER' | 'COMMENTER' | 'EDITOR',
        user,
      };
    }
  }

  if (shareToken) {
    const tokenHash = hashOpaqueToken(shareToken);
    const link = project.shareLinks.find(
      (l) =>
        l.tokenHash === tokenHash &&
        !l.revokedAt &&
        (!l.expiresAt || l.expiresAt > new Date())
    );
    if (link) {
      return {
        project,
        permission: link.permission as 'VIEWER' | 'COMMENTER' | 'EDITOR',
        user,
      };
    }
  }

  return { project, permission: null, user };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const shareToken = request.nextUrl.searchParams.get('share');
  const { project, permission } = await resolveProjectAccess(id, shareToken);

  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!permission) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const mainFile =
    project.files.find((f) => f.path === project.mainFilePath) ||
    project.files.find((f) => f.isMain) ||
    project.files[0];
  const bibFile = project.files.find((f) => f.path.endsWith('.bib'));

  const compiled = compileProjectWorkspace({
    mainFilePath: mainFile?.path || 'main.tex',
    mainContent: mainFile?.content || '',
    bibContent: bibFile?.content || '',
    templateId: project.templateId,
    texliveVersion: project.texliveVersion,
  });

  return NextResponse.json({
    project,
    permission,
    compiled,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission, user } = await resolveProjectAccess(id);

  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!permission || (permission !== 'OWNER' && permission !== 'EDITOR')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim().slice(0, 160);
  }
  if (typeof body.description === 'string') {
    data.description = body.description.slice(0, 500);
  }
  if (typeof body.isPinned === 'boolean') {
    data.isPinned = body.isPinned;
  }
  if (typeof body.texliveVersion === 'string' && body.texliveVersion.trim()) {
    data.texliveVersion = body.texliveVersion.trim();
  }
  if (typeof body.latexEngine === 'string' && body.latexEngine.trim()) {
    data.latexEngine = body.latexEngine.trim();
  }
  if (typeof body.mainFilePath === 'string' && body.mainFilePath.trim()) {
    data.mainFilePath = body.mainFilePath.trim();
    await prisma.projectFile.updateMany({
      where: { projectId: id },
      data: { isMain: false },
    });
    await prisma.projectFile.updateMany({
      where: { projectId: id, path: data.mainFilePath as string },
      data: { isMain: true },
    });
  }
  if (typeof body.gitRepoUrl === 'string') {
    data.gitRepoUrl = body.gitRepoUrl.trim() || null;
  }
  if (typeof body.gitBranch === 'string' && body.gitBranch.trim()) {
    data.gitBranch = body.gitBranch.trim();
  }
  if (body.gitSync === true) {
    data.gitLastSyncAt = new Date();
    const currentFiles = await prisma.projectFile.findMany({
      where: { projectId: id },
    });
    await prisma.projectVersion.create({
      data: {
        projectId: id,
        label:
          typeof body.commitMessage === 'string' && body.commitMessage.trim()
            ? `Git sync: ${body.commitMessage.trim()}`
            : 'GitHub branch sync',
        summary: `Synced with ${project.gitRepoUrl || 'remote repository'} (${project.gitBranch})`,
        snapshotJson: JSON.stringify(currentFiles),
        createdById: user?.id || null,
      },
    });
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, project: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission, user } = await resolveProjectAccess(id);

  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (permission !== 'OWNER') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });

  if (user) {
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'project.delete',
      targetType: 'project',
      targetId: id,
      targetLabel: project.name,
    });
  }

  return NextResponse.json({ ok: true });
}
