import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/account-admission';
import { runOrcaAssistant } from '@/lib/ai/orca-engine';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const fileContent = typeof body.fileContent === 'string' ? body.fileContent : '';
  const filePath = typeof body.filePath === 'string' ? body.filePath : 'main.tex';
  const selectedText = typeof body.selectedText === 'string' ? body.selectedText : undefined;

  if (!prompt) {
    return NextResponse.json(
      { error: 'missing_prompt', message: 'Enter an instruction for Orca AI.' },
      { status: 400 }
    );
  }

  const proposal = await runOrcaAssistant({
    prompt,
    fileContent,
    filePath,
    selectedText,
    byokOpenAiKey: user?.byokOpenAiKeyEncrypted || null,
  });

  if (user) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: {
          dailyTokensUsed: { increment: proposal.tokensUsed },
          monthlyTokensUsed: { increment: proposal.tokensUsed },
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(proposal);
}
