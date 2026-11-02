import { NextRequest, NextResponse } from 'next/server';
import {
  AccountAdmissionError,
  authenticatePassword,
  setDatabaseSessionCookie,
} from '@/lib/account-admission';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email.trim() || !password) {
      return NextResponse.json(
        { error: 'missing_credentials', message: 'Enter both email and password.' },
        { status: 400 }
      );
    }

    const result = await authenticatePassword({
      email,
      password,
      ipAddress: request.headers.get('x-forwarded-for') || null,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        planTier: result.user.operatorGrantPlan || result.user.planTier,
      },
    });
    setDatabaseSessionCookie(response, result.session);
    return response;
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Unable to sign in right now.' },
      { status: 500 }
    );
  }
}
