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

  return NextResponse.json({ comments: project.comments });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission, user } = await resolveProjectAccess(id);
  if (!project || !permission || permission === 'VIEWER') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return NextResponse.json(
      { error: 'missing_content', message: 'Comment text is required.' },
      { status: 400 }
    );
  }

  const comment = await prisma.projectComment.create({
    data: {
      projectId: id,
      filePath: typeof body.filePath === 'string' ? body.filePath : project.mainFilePath,
      lineNumber: typeof body.lineNumber === 'number' ? body.lineNumber : null,
      anchorText: typeof body.anchorText === 'string' ? body.anchorText.slice(0, 200) : null,
      content: content.slice(0, 2000),
      parentId: typeof body.parentId === 'string' ? body.parentId : null,
      authorId: user?.id || null,
      authorName: user?.name || user?.email || 'Collaborator',
      status: 'open',
    },
  });

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission } = await resolveProjectAccess(id);
  if (!project || !permission || permission === 'VIEWER') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const commentId = typeof body.commentId === 'string' ? body.commentId : '';
  const status = body.status === 'resolved' ? 'resolved' : 'open';

  const updated = await prisma.projectComment.update({
    where: { id: commentId },
    data: { status },
  });

  return NextResponse.json({ ok: true, comment: updated });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission } = await resolveProjectAccess(id);
  if (!project || (permission !== 'OWNER' && permission !== 'EDITOR')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const commentId = request.nextUrl.searchParams.get('commentId') || '';
  if (!commentId) {
    return NextResponse.json({ error: 'missing_comment_id' }, { status: 400 });
  }

  await prisma.projectComment.deleteMany({
    where: { id: commentId, projectId: id },
  });

  return NextResponse.json({ ok: true });
}
