import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

  return NextResponse.json({ versions: project.versions });
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

  // Restore an existing version snapshot
  if (body.action === 'restore' && typeof body.versionId === 'string') {
    const version = await prisma.projectVersion.findFirst({
      where: { id: body.versionId, projectId: id },
    });
    if (!version) {
      return NextResponse.json({ error: 'version_not_found' }, { status: 404 });
    }

    let snapshotFiles: Array<{
      path: string;
      name: string;
      folderPath?: string;
      kind?: string;
      content: string;
      isMain?: boolean;
    }> = [];
    try {
      snapshotFiles = JSON.parse(version.snapshotJson);
    } catch {
      return NextResponse.json({ error: 'corrupt_snapshot' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const sf of snapshotFiles) {
        await tx.projectFile.upsert({
          where: { projectId_path: { projectId: id, path: sf.path } },
          create: {
            projectId: id,
            path: sf.path,
            name: sf.name || sf.path.split('/').pop() || 'main.tex',
            folderPath: sf.folderPath || '',
            kind: sf.kind || 'tex',
            content: sf.content || '',
            sizeBytes: Buffer.byteLength(sf.content || '', 'utf8'),
            isMain: Boolean(sf.isMain),
          },
          update: {
            content: sf.content || '',
            sizeBytes: Buffer.byteLength(sf.content || '', 'utf8'),
          },
        });
      }
      await tx.projectVersion.create({
        data: {
          projectId: id,
          label: `Restored: ${version.label}`,
          summary: `Restored from snapshot ${version.id.slice(0, 8)}`,
          snapshotJson: version.snapshotJson,
          createdById: user?.id || null,
        },
      });
    });

    const files = await prisma.projectFile.findMany({
      where: { projectId: id },
      orderBy: [{ isMain: 'desc' }, { path: 'asc' }],
    });
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ ok: true, files, versions });
  }

  // Save a new version snapshot
  const label =
    typeof body.label === 'string' && body.label.trim()
      ? body.label.trim().slice(0, 120)
      : `Snapshot ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
  const summary =
    typeof body.summary === 'string' ? body.summary.trim().slice(0, 300) : '';

  const currentFiles = await prisma.projectFile.findMany({
    where: { projectId: id },
  });

  const version = await prisma.projectVersion.create({
    data: {
      projectId: id,
      label,
      summary,
      snapshotJson: JSON.stringify(currentFiles),
      createdById: user?.id || null,
    },
  });

  return NextResponse.json({ ok: true, version }, { status: 201 });
}
