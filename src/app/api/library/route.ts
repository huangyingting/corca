import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/account-admission';

function generateBibtexFromFields(input: {
  citeKey: string;
  title: string;
  authors: string[];
  year?: number | null;
  venue?: string | null;
  doi?: string | null;
  url?: string | null;
}) {
  const lines = [
    `@article{${input.citeKey},`,
    `  title={${input.title}},`,
    `  author={${input.authors.join(' and ') || 'Anonymous'}},`,
  ];
  if (input.venue) lines.push(`  journal={${input.venue}},`);
  if (input.year) lines.push(`  year={${input.year}},`);
  if (input.doi) lines.push(`  doi={${input.doi}},`);
  if (input.url) lines.push(`  url={${input.url}},`);
  lines.push('}');
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const inTrash = sp.get('trash') === '1';
  const q = (sp.get('q') || '').trim().toLowerCase();
  const tag = sp.get('tag') || '';
  const authorFilter = sp.get('author') || '';
  const venueFilter = sp.get('venue') || '';
  const yearFrom = sp.get('yearFrom') ? Number(sp.get('yearFrom')) : null;
  const yearTo = sp.get('yearTo') ? Number(sp.get('yearTo')) : null;
  const unknownYear = sp.get('unknownYear') === '1';

  const allRefs = await prisma.libraryReference.findMany({
    where: { userId: user.id },
    include: { annotations: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  // Compute facets from non-trash references
  const activeRefs = allRefs.filter((r) => !r.inTrash);
  const tagCounts: Record<string, number> = {};
  const authorCounts: Record<string, number> = {};
  const venueCounts: Record<string, number> = {};
  let noTagCount = 0;
  let unknownYearCount = 0;

  for (const r of activeRefs) {
    const tags: string[] = (() => {
      try {
        return JSON.parse(r.tagsJson);
      } catch {
        return [];
      }
    })();
    if (tags.length === 0) noTagCount += 1;
    for (const t of tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }

    const authors: string[] = (() => {
      try {
        return JSON.parse(r.authorsJson);
      } catch {
        return [];
      }
    })();
    for (const a of authors) {
      authorCounts[a] = (authorCounts[a] || 0) + 1;
    }

    if (r.venue) {
      venueCounts[r.venue] = (venueCounts[r.venue] || 0) + 1;
    }
    if (!r.year) {
      unknownYearCount += 1;
    }
  }

  const filtered = allRefs
    .filter((r) => r.inTrash === inTrash)
    .filter((r) => {
      const tags: string[] = (() => {
        try {
          return JSON.parse(r.tagsJson);
        } catch {
          return [];
        }
      })();
      const authors: string[] = (() => {
        try {
          return JSON.parse(r.authorsJson);
        } catch {
          return [];
        }
      })();

      if (tag === '__UNTAGGED__' && tags.length > 0) return false;
      if (tag && tag !== '__UNTAGGED__' && !tags.includes(tag)) return false;
      if (authorFilter && !authors.includes(authorFilter)) return false;
      if (venueFilter && r.venue !== venueFilter) return false;
      if (unknownYear && r.year !== null) return false;
      if (yearFrom !== null && Number.isFinite(yearFrom) && (!r.year || r.year < yearFrom))
        return false;
      if (yearTo !== null && Number.isFinite(yearTo) && (!r.year || r.year > yearTo))
        return false;
      if (q) {
        const hay = `${r.title} ${r.citeKey} ${authors.join(' ')} ${r.venue || ''} ${r.abstract || ''} ${tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((r) => ({
      ...r,
      authors: (() => {
        try {
          return JSON.parse(r.authorsJson);
        } catch {
          return [];
        }
      })(),
      tags: (() => {
        try {
          return JSON.parse(r.tagsJson);
        } catch {
          return [];
        }
      })(),
    }));

  return NextResponse.json({
    references: filtered,
    facets: {
      totalActive: activeRefs.length,
      totalTrash: allRefs.filter((r) => r.inTrash).length,
      noTagCount,
      unknownYearCount,
      tags: Object.entries(tagCounts).map(([name, count]) => ({ name, count })),
      authors: Object.entries(authorCounts).map(([name, count]) => ({ name, count })),
      venues: Object.entries(venueCounts).map(([name, count]) => ({ name, count })),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (user.role === 'Viewer') {
    return NextResponse.json(
      { error: 'forbidden_role', message: 'Viewer accounts have read-only library access.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : 'Untitled Scholarly Reference';
  const authors: string[] = Array.isArray(body.authors)
    ? body.authors.map((a: unknown) => String(a).trim()).filter(Boolean)
    : typeof body.authors === 'string'
      ? body.authors
          .split(/,|;|\band\b/i)
          .map((a: string) => a.trim())
          .filter(Boolean)
      : ['Unknown Author'];
  const year =
    typeof body.year === 'number' && Number.isFinite(body.year)
      ? body.year
      : typeof body.year === 'string' && /^\d{4}$/.test(body.year.trim())
        ? Number(body.year.trim())
        : new Date().getFullYear();
  const venue = typeof body.venue === 'string' ? body.venue.trim() : null;
  const doi = typeof body.doi === 'string' ? body.doi.trim() : null;
  const arxivId = typeof body.arxivId === 'string' ? body.arxivId.trim() : null;
  const openAlexId = typeof body.openAlexId === 'string' ? body.openAlexId.trim() : null;
  const url = typeof body.url === 'string' ? body.url.trim() : null;
  const abstract = typeof body.abstract === 'string' ? body.abstract.trim() : null;
  const tags: string[] = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const firstAuthorSurname =
    (authors[0] || 'author')
      .split(/\s+/)
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'ref';
  const firstTitleWord =
    title
      .split(/\s+/)[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'paper';
  const citeKey =
    typeof body.citeKey === 'string' && body.citeKey.trim()
      ? body.citeKey.trim().replace(/\s+/g, '_')
      : `${firstAuthorSurname}${year}${firstTitleWord}`;

  const bibtex =
    typeof body.bibtex === 'string' && body.bibtex.trim()
      ? body.bibtex.trim()
      : generateBibtexFromFields({
          citeKey,
          title,
          authors,
          year,
          venue,
          doi,
          url,
        });

  const pdfTextContent =
    typeof body.pdfTextContent === 'string' && body.pdfTextContent.trim()
      ? body.pdfTextContent.trim()
      : `${title}\n${authors.join(', ')} (${year})\n${venue || 'Working Paper'}\n\nAbstract\n${abstract || 'Full manuscript text indexed in CorTeX Research Library for evidence extraction, inline highlighting, and sticky note annotation.'}\n\n1. Introduction\nThis reference explores key theoretical and empirical foundations relevant to ${title}. Select any sentence in the reader below to create a color-coded highlight or attach a research memo.`;

  const created = await prisma.libraryReference.create({
    data: {
      userId: user.id,
      title,
      citeKey,
      authorsJson: JSON.stringify(authors),
      year,
      venue,
      doi,
      arxivId,
      openAlexId,
      url,
      abstract,
      tagsJson: JSON.stringify(tags),
      bibtex,
      pdfFileName:
        typeof body.pdfFileName === 'string' ? body.pdfFileName : `${citeKey}.pdf`,
      pdfSizeBytes:
        typeof body.pdfSizeBytes === 'number'
          ? body.pdfSizeBytes
          : Buffer.byteLength(pdfTextContent, 'utf8'),
      pdfTextContent,
      citationCount:
        typeof body.citationCount === 'number' ? body.citationCount : 0,
      referenceCount:
        typeof body.referenceCount === 'number' ? body.referenceCount : 0,
    },
    include: { annotations: true },
  });

  return NextResponse.json(
    {
      ok: true,
      reference: {
        ...created,
        authors,
        tags,
      },
    },
    { status: 201 }
  );
}
