import { NextRequest, NextResponse } from 'next/server';
import {
  compileAcademicDocument,
  compileProjectWorkspace,
} from '@/lib/compiler/compile-engine';
import { resolveProjectAccess } from '../route';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  // Support both persisted projects and ephemeral /try/* compilations
  if (id === 'try' || typeof body.mainContent === 'string') {
    const filePath =
      typeof body.mainFilePath === 'string'
        ? body.mainFilePath
        : typeof body.filePath === 'string'
          ? body.filePath
          : 'main.tex';
    const content =
      typeof body.mainContent === 'string'
        ? body.mainContent
        : typeof body.content === 'string'
          ? body.content
          : '';
    const bibContent = typeof body.bibContent === 'string' ? body.bibContent : '';
    const workspace = compileProjectWorkspace({
      mainFilePath: filePath,
      mainContent: content,
      bibContent,
      templateId: typeof body.templateId === 'string' ? body.templateId : 'blank-article',
      texliveVersion:
        typeof body.texliveVersion === 'string'
          ? body.texliveVersion
          : 'tl2026-20260826-b6584b4',
    });
    const doc = compileAcademicDocument({
      fileName: filePath,
      content,
      bibContent,
    });
    return NextResponse.json({
      ok: true,
      compiled: {
        ...workspace,
        html: doc.html,
        stats: doc.stats,
      },
    });
  }

  const { project, permission } = await resolveProjectAccess(id);
  if (!project || !permission) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const mainFile =
    project.files.find((f) => f.path === project.mainFilePath) ||
    project.files.find((f) => f.isMain) ||
    project.files[0];
  const bibFile = project.files.find((f) => f.path.endsWith('.bib'));

  const filePath =
    typeof body.filePath === 'string' ? body.filePath : mainFile?.path || 'main.tex';
  const content =
    typeof body.content === 'string' ? body.content : mainFile?.content || '';
  const bibContent = bibFile?.content || '';

  const workspace = compileProjectWorkspace({
    mainFilePath: filePath,
    mainContent: content,
    bibContent,
    templateId: project.templateId,
    texliveVersion: project.texliveVersion,
  });
  const doc = compileAcademicDocument({
    fileName: filePath,
    content,
    bibContent,
  });

  return NextResponse.json({
    ok: true,
    compiled: {
      ...workspace,
      html: doc.html,
      stats: doc.stats,
    },
  });
}
