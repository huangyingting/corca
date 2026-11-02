import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/account-admission';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const annotations = await prisma.libraryAnnotation.findMany({
    where: { referenceId: id, userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ annotations });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const kind = body.kind === 'sticky' ? 'sticky' : 'highlight';
  const pageNumber = Math.max(1, Number(body.pageNumber) || 1);
  const selectedText =
    typeof body.selectedText === 'string' ? body.selectedText.slice(0, 1000) : null;
  const comment =
    typeof body.comment === 'string' ? body.comment.slice(0, 2000) : null;
  const color = ['yellow', 'green', 'blue', 'pink'].includes(body.color)
    ? body.color
    : 'yellow';

  const annotation = await prisma.libraryAnnotation.create({
    data: {
      referenceId: id,
      userId: user.id,
      kind,
      pageNumber,
      selectedText,
      comment,
      color,
    },
  });

  return NextResponse.json({ ok: true, annotation }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const annotationId = request.nextUrl.searchParams.get('annotationId') || '';

  await prisma.libraryAnnotation.deleteMany({
    where: { id: annotationId, referenceId: id, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
