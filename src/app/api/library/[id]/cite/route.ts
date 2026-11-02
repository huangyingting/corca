import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/account-admission';

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
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';

  const ref = await prisma.libraryReference.findFirst({
    where: { id, userId: user.id },
  });
  if (!ref) {
    return NextResponse.json({ error: 'reference_not_found' }, { status: 404 });
  }

  if (projectId) {
    const bibFile = await prisma.projectFile.findFirst({
      where: {
        projectId,
        path: { endsWith: '.bib' },
      },
    });

    if (bibFile) {
      if (!bibFile.content.includes(ref.citeKey)) {
        const updatedBib = `${bibFile.content.trim()}\n\n${ref.bibtex}\n`;
        await prisma.projectFile.update({
          where: { id: bibFile.id },
          data: {
            content: updatedBib,
            sizeBytes: Buffer.byteLength(updatedBib, 'utf8'),
          },
        });
      }
    } else {
      await prisma.projectFile.create({
        data: {
          projectId,
          path: 'refs.bib',
          name: 'refs.bib',
          folderPath: '',
          kind: 'bib',
          content: `${ref.bibtex}\n`,
          sizeBytes: Buffer.byteLength(ref.bibtex, 'utf8'),
          isMain: false,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    citeKey: ref.citeKey,
    latexCommand: `\\cite{${ref.citeKey}}`,
    bibtex: ref.bibtex,
  });
}
