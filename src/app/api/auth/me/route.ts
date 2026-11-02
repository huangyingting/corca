import { NextResponse } from 'next/server';
import { accountAdmissionMode, getCurrentUser } from '@/lib/account-admission';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      admissionMode: accountAdmissionMode(),
      user: null,
    });
  }

  const effectivePlan = user.operatorGrantPlan || user.planTier || 'free';
  return NextResponse.json({
    authenticated: true,
    admissionMode: accountAdmissionMode(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      planTier: effectivePlan,
      operatorGrantPlan: user.operatorGrantPlan,
      uiLanguage: user.uiLanguage,
      dailyTokensUsed: user.dailyTokensUsed,
      monthlyTokensUsed: user.monthlyTokensUsed,
      storageBytesUsed: user.storageBytesUsed,
      byokConfigured: Boolean(user.byokOpenAiKeyEncrypted),
      byokKeyHint: user.byokOpenAiKeyHint,
      labs: (() => {
        try {
          return JSON.parse(user.labsConfigJson);
        } catch {
          return {};
        }
      })(),
    },
  });
}
