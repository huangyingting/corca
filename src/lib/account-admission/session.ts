import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

export const SESSION_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

const IS_PRODUCTION = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).protocol === 'https:'
  : process.env.NODE_ENV === 'production';

export const SESSION_COOKIE_NAME = IS_PRODUCTION
  ? SESSION_COOKIES[1]
  : SESSION_COOKIES[0];

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: IS_PRODUCTION,
};

export async function createDatabaseSession(userId: string, now = new Date()) {
  const expires = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  return prisma.session.create({
    data: {
      sessionToken: randomBytes(32).toString('base64url'),
      userId,
      expires,
    },
  });
}

export function setDatabaseSessionCookie(
  response: NextResponse,
  session: { sessionToken: string; expires: Date }
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.sessionToken,
    expires: session.expires,
    ...SESSION_COOKIE_OPTIONS,
  });
}

export function clearDatabaseSessionCookie(response: NextResponse): void {
  for (const cookieName of SESSION_COOKIES) {
    response.cookies.set({
      name: cookieName,
      value: '',
      expires: new Date(0),
      ...SESSION_COOKIE_OPTIONS,
    });
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(SESSION_COOKIES[1])?.value ||
      cookieStore.get(SESSION_COOKIES[0])?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (!session) return null;
    const now = new Date();
    if (session.expires <= now) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    if (session.user.status !== 'active') {
      await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

export async function revokeUserSessions(userId: string) {
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    }),
  ]);
}
