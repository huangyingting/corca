import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, recordAuditLog } from '@/lib/account-admission';
import {
  generateStarterFilesForTemplate,
  getVenueTemplateById,
} from '@/lib/data/venue-templates';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const filter = (request.nextUrl.searchParams.get('filter') || 'all').toLowerCase();
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          collaborators: {
            some: {
              status: 'ACTIVE',
              OR: [{ userId: user.id }, { email: user.email }],
            },
          },
        },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      files: { select: { id: true, path: true, name: true, kind: true, isMain: true, sizeBytes: true } },
      collaborators: { where: { status: 'ACTIVE' } },
      shareLinks: { where: { revokedAt: null } },
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  });

  const filtered = projects.filter((p) => {
    const isOwner = p.ownerId === user.id;
    const isShared = p.collaborators.length > 0 || p.shareLinks.length > 0 || !isOwner;
    if (filter === 'mine' && !isOwner) return false;
    if (filter === 'shared' && !isShared) return false;
    if (filter === 'pinned' && !p.isPinned) return false;
    if (q) {
      const hay = `${p.name} ${p.description} ${p.templateId} ${p.files.map((f) => f.name).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({
    projects: filtered.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      format: p.format,
      templateId: p.templateId,
      texliveVersion: p.texliveVersion,
      latexEngine: p.latexEngine,
      mainFilePath: p.mainFilePath,
      isPinned: p.isPinned,
      visibility:
        p.collaborators.length > 0 || p.shareLinks.length > 0 ? 'shared' : p.visibility,
      owner: p.owner,
      isOwner: p.ownerId === user.id,
      fileCount: p.files.length,
      fileNames: p.files.map((f) => f.name),
      collaboratorCount: p.collaborators.length,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (user.role === 'Viewer') {
    return NextResponse.json(
      {
        error: 'forbidden_role',
        message: 'Viewer role is read-only and cannot create new projects.',
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';
  const importMode = typeof body.importMode === 'string' ? body.importMode : null;

  if (!name) {
    return NextResponse.json(
      { error: 'missing_name', message: 'Enter a project name.' },
      { status: 400 }
    );
  }

  if (!templateId && !importMode && !Array.isArray(body.customFiles)) {
    return NextResponse.json(
      { error: 'missing_template', message: 'Select a template to create a project.' },
      { status: 400 }
    );
  }

  const resolvedTemplate = getVenueTemplateById(templateId || 'blank-article');
  const texliveVersion =
    typeof body.texliveVersion === 'string' && body.texliveVersion.trim()
      ? body.texliveVersion.trim()
      : 'tl2026-20260826-b6584b4';

  const starterFiles = Array.isArray(body.customFiles) && body.customFiles.length > 0
    ? body.customFiles.map((f: Record<string, unknown>, idx: number) => ({
        path: String(f.path || f.name || `file-${idx + 1}.tex`),
        name: String(f.name || f.path || `file-${idx + 1}.tex`),
        folderPath: String(f.folderPath || ''),
        kind: String(f.kind || 'tex'),
        content: String(f.content || ''),
        isMain: Boolean(f.isMain ?? idx === 0),
      }))
    : generateStarterFilesForTemplate(
        resolvedTemplate.id,
        name,
        user.name || user.email.split('@')[0]
      );

  const mainFile = starterFiles.find((f: { isMain: boolean }) => f.isMain) || starterFiles[0];
  const totalBytes = starterFiles.reduce(
    (sum: number, f: { content: string }) => sum + Buffer.byteLength(f.content, 'utf8'),
    0
  );

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name: name.slice(0, 160),
        description:
          typeof body.description === 'string'
            ? body.description.slice(0, 500)
            : `${resolvedTemplate.name} (${resolvedTemplate.badge})`,
        format:
          typeof body.format === 'string'
            ? body.format
            : resolvedTemplate.format,
        templateId: resolvedTemplate.id,
        texliveVersion,
        mainFilePath: mainFile.path,
        ownerId: user.id,
        gitRepoUrl:
          typeof body.gitRepoUrl === 'string' ? body.gitRepoUrl.trim() : null,
        gitBranch:
          typeof body.gitBranch === 'string' && body.gitBranch.trim()
            ? body.gitBranch.trim()
            : 'main',
        files: {
          create: starterFiles.map(
            (f: {
              path: string;
              name: string;
              folderPath: string;
              kind: string;
              content: string;
              isMain: boolean;
            }) => ({
              path: f.path,
              name: f.name,
              folderPath: f.folderPath,
              kind: f.kind,
              content: f.content,
              sizeBytes: Buffer.byteLength(f.content, 'utf8'),
              isMain: f.isMain,
            })
          ),
        },
        versions: {
          create: {
            label: 'Initial project creation',
            summary: `Created from ${resolvedTemplate.name}`,
            snapshotJson: JSON.stringify(starterFiles),
            createdById: user.id,
          },
        },
      },
      include: { files: true },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { storageBytesUsed: { increment: totalBytes } },
    });

    return created;
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'project.create',
    targetType: 'project',
    targetId: project.id,
    targetLabel: project.name,
    metadata: {
      templateId: project.templateId,
      format: project.format,
      importMode,
    },
  });

  return NextResponse.json({ ok: true, project }, { status: 201 });
}
