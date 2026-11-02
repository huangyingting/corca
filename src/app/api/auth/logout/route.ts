import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  clearDatabaseSessionCookie,
  getCurrentUser,
  recordAuditLog,
  SESSION_COOKIES,
} from '@/lib/account-admission';

export async function POST() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIES[1])?.value ||
    cookieStore.get(SESSION_COOKIES[0])?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } }).catch(() => {});
  }

  if (user) {
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'auth.logout',
      targetType: 'session',
      targetId: user.id,
      targetLabel: user.email,
    }).catch(() => {});
  }

  const response = NextResponse.json({ ok: true });
  clearDatabaseSessionCookie(response);
  return response;
}
