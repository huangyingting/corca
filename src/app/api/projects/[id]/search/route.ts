import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveProjectAccess } from '../route';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { project, permission } = await resolveProjectAccess(id);
  if (!project || !permission) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query : '';
  const replaceWith = typeof body.replaceWith === 'string' ? body.replaceWith : null;
  const performReplace = Boolean(body.replaceAll);

  if (!query) {
    return NextResponse.json({ matches: [], replacedCount: 0 });
  }

  const matches: Array<{
    fileId: string;
    filePath: string;
    line: number;
    preview: string;
  }> = [];

  let replacedCount = 0;

  for (const file of project.files) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((l, idx) => {
      if (l.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          fileId: file.id,
          filePath: file.path,
          line: idx + 1,
          preview: l.trim().slice(0, 140),
        });
      }
    });

    if (
      performReplace &&
      replaceWith !== null &&
      (permission === 'OWNER' || permission === 'EDITOR') &&
      file.content.includes(query)
    ) {
      const occurrences = file.content.split(query).length - 1;
      if (occurrences > 0) {
        replacedCount += occurrences;
        const newContent = file.content.split(query).join(replaceWith);
        await prisma.projectFile.update({
          where: { id: file.id },
          data: {
            content: newContent,
            sizeBytes: Buffer.byteLength(newContent, 'utf8'),
          },
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    matches,
    replacedCount,
  });
}
