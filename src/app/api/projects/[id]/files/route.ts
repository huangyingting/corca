import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveProjectAccess } from '../route';

function inferFileKind(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || 'tex';
  if (path.endsWith('slides.md')) return 'slides';
  if (['tex', 'typ', 'md', 'bib', 'cls', 'sty', 'docx'].includes(ext)) return ext;
  return 'tex';
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission } = await resolveProjectAccess(id);

  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (permission !== 'OWNER' && permission !== 'EDITOR') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rawPath = typeof body.path === 'string' ? body.path.trim().replace(/^\/+/, '') : '';
  if (!rawPath) {
    return NextResponse.json(
      { error: 'missing_path', message: 'Enter a file name or path.' },
      { status: 400 }
    );
  }

  const parts = rawPath.split('/');
  const name = parts[parts.length - 1];
  const folderPath = parts.slice(0, -1).join('/');
  const content = typeof body.content === 'string' ? body.content : '';
  const kind = typeof body.kind === 'string' ? body.kind : inferFileKind(rawPath);

  const existing = await prisma.projectFile.findUnique({
    where: { projectId_path: { projectId: id, path: rawPath } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'file_exists', message: 'A file with this path already exists.' },
      { status: 409 }
    );
  }

  const file = await prisma.projectFile.create({
    data: {
      projectId: id,
      path: rawPath,
      name,
      folderPath,
      kind,
      content,
      sizeBytes: Buffer.byteLength(content, 'utf8'),
      isMain: false,
    },
  });

  await prisma.project.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, file }, { status: 201 });
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
  if (permission !== 'OWNER' && permission !== 'EDITOR') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const fileId = typeof body.fileId === 'string' ? body.fileId : '';
  const filePath = typeof body.path === 'string' ? body.path : '';

  const target = fileId
    ? await prisma.projectFile.findFirst({ where: { id: fileId, projectId: id } })
    : await prisma.projectFile.findFirst({ where: { path: filePath, projectId: id } });

  if (!target) {
    return NextResponse.json({ error: 'file_not_found' }, { status: 404 });
  }

  // Handle "Move to new project..." action from file context menu
  if (body.action === 'move_to_new_project' && user) {
    const newProjectName =
      typeof body.newProjectName === 'string' && body.newProjectName.trim()
        ? body.newProjectName.trim()
        : `${target.name.replace(/\.[^.]+$/, '')} Project`;
    const newProject = await prisma.project.create({
      data: {
        name: newProjectName,
        description: `Moved from ${project.name}`,
        format: project.format,
        templateId: project.templateId,
        mainFilePath: target.path,
        ownerId: user.id,
        files: {
          create: {
            path: target.path,
            name: target.name,
            folderPath: target.folderPath,
            kind: target.kind,
            content: target.content,
            sizeBytes: target.sizeBytes,
            isMain: true,
          },
        },
      },
    });
    return NextResponse.json({ ok: true, newProject });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.content === 'string') {
    data.content = body.content;
    data.sizeBytes = Buffer.byteLength(body.content, 'utf8');
  }
  if (typeof body.newPath === 'string' && body.newPath.trim()) {
    const cleaned = body.newPath.trim().replace(/^\/+/, '');
    const parts = cleaned.split('/');
    data.path = cleaned;
    data.name = parts[parts.length - 1];
    data.folderPath = parts.slice(0, -1).join('/');
    data.kind = inferFileKind(cleaned);
  }
  if (typeof body.isMain === 'boolean' && body.isMain) {
    await prisma.projectFile.updateMany({
      where: { projectId: id },
      data: { isMain: false },
    });
    data.isMain = true;
    await prisma.project.update({
      where: { id },
      data: { mainFilePath: (data.path as string) || target.path },
    });
  }

  const updated = await prisma.projectFile.update({
    where: { id: target.id },
    data,
  });

  await prisma.project.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, file: updated });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission } = await resolveProjectAccess(id);

  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (permission !== 'OWNER' && permission !== 'EDITOR') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const fileId = request.nextUrl.searchParams.get('fileId') || '';
  if (!fileId) {
    return NextResponse.json({ error: 'missing_file_id' }, { status: 400 });
  }

  if (project.files.length <= 1) {
    return NextResponse.json(
      { error: 'last_file', message: 'A project must keep at least one file.' },
      { status: 400 }
    );
  }

  await prisma.projectFile.deleteMany({
    where: { id: fileId, projectId: id },
  });

  return NextResponse.json({ ok: true });
}
