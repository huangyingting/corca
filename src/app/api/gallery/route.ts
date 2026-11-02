import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/account-admission';
import { DEFAULT_GALLERY_WORKS } from '@/lib/data/phrasebank';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const category = sp.get('category') || 'All work';
  const topic = sp.get('topic') || 'All topics';
  const sort = sp.get('sort') || 'recent';

  const dbItems = await prisma.galleryPublication.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const combined = [
    ...dbItems.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      authorName: item.authorName,
      category: item.category as 'Papers' | 'Notes' | 'Slides' | 'Templates',
      format: item.format as 'latex' | 'typst' | 'markdown' | 'slides',
      tags: (() => {
        try {
          return JSON.parse(item.tagsJson);
        } catch {
          return [];
        }
      })(),
      updatedLabel: item.createdAt.toISOString().slice(0, 10),
      mainFileName:
        item.format === 'typst'
          ? 'main.typ'
          : item.format === 'slides'
            ? 'slides.md'
            : item.format === 'markdown'
              ? 'memo.md'
              : 'main.tex',
      content: item.contentPreview,
    })),
    ...DEFAULT_GALLERY_WORKS,
  ];

  const filtered = combined.filter((w) => {
    if (category !== 'All work' && w.category !== category) return false;
    if (topic !== 'All topics' && !w.tags.includes(topic)) return false;
    return true;
  });

  if (sort === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  return NextResponse.json({ works: filtered });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (user.role === 'Viewer') {
    return NextResponse.json(
      { error: 'forbidden_role', message: 'Viewer role cannot publish to Gallery.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const category = ['Papers', 'Notes', 'Slides', 'Templates'].includes(body.category)
    ? body.category
    : 'Papers';
  const format = ['latex', 'typst', 'markdown', 'slides'].includes(body.format)
    ? body.format
    : 'latex';
  const contentPreview =
    typeof body.contentPreview === 'string' ? body.contentPreview : '';
  const tags: string[] = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : ['computer science'];

  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  const created = await prisma.galleryPublication.create({
    data: {
      projectId: typeof body.projectId === 'string' ? body.projectId : null,
      authorId: user.id,
      authorName: user.name || user.email.split('@')[0],
      title,
      summary: summary || `Shared from CorTeX Workspace by ${user.name}`,
      category,
      format,
      tagsJson: JSON.stringify(tags),
      contentPreview,
      snapshotJson: JSON.stringify({ title, contentPreview }),
    },
  });

  return NextResponse.json({ ok: true, publication: created }, { status: 201 });
}
