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
  const ref = await prisma.libraryReference.findFirst({
    where: { id, userId: user.id },
    include: { annotations: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ref) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    reference: {
      ...ref,
      authors: JSON.parse(ref.authorsJson || '[]'),
      tags: JSON.parse(ref.tagsJson || '[]'),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.libraryReference.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.citeKey === 'string' && body.citeKey.trim()) {
    data.citeKey = body.citeKey.trim().replace(/\s+/g, '_');
  }
  if (Array.isArray(body.authors)) {
    data.authorsJson = JSON.stringify(
      body.authors.map((a: unknown) => String(a).trim()).filter(Boolean)
    );
  }
  if (typeof body.year === 'number' || body.year === null) {
    data.year = body.year;
  }
  if (typeof body.venue === 'string') {
    data.venue = body.venue.trim() || null;
  }
  if (typeof body.doi === 'string') {
    data.doi = body.doi.trim() || null;
  }
  if (typeof body.arxivId === 'string') {
    data.arxivId = body.arxivId.trim() || null;
  }
  if (typeof body.url === 'string') {
    data.url = body.url.trim() || null;
  }
  if (typeof body.abstract === 'string') {
    data.abstract = body.abstract;
  }
  if (typeof body.note === 'string') {
    data.note = body.note;
  }
  if (Array.isArray(body.tags)) {
    data.tagsJson = JSON.stringify(
      body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    );
  }
  if (typeof body.bibtex === 'string' && body.bibtex.trim()) {
    data.bibtex = body.bibtex.trim();
  }
  if (typeof body.inTrash === 'boolean') {
    data.inTrash = body.inTrash;
  }
  if (typeof body.pdfFileName === 'string') {
    data.pdfFileName = body.pdfFileName;
  }
  if (typeof body.pdfTextContent === 'string') {
    data.pdfTextContent = body.pdfTextContent;
  }

  const updated = await prisma.libraryReference.update({
    where: { id },
    data,
    include: { annotations: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({
    ok: true,
    reference: {
      ...updated,
      authors: JSON.parse(updated.authorsJson || '[]'),
      tags: JSON.parse(updated.tagsJson || '[]'),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.libraryReference.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
