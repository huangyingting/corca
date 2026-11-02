import { NextRequest, NextResponse } from 'next/server';
import {
  AccountAdmissionError,
  getCurrentUser,
  revokeAccountInvitation,
  rotateAccountInvitation,
} from '@/lib/account-admission';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (body.action === 'revoke') {
      const revoked = await revokeAccountInvitation(id, {
        id: user.id,
        email: user.email,
        reason: typeof body.reason === 'string' ? body.reason : null,
      });
      return NextResponse.json({ ok: true, invitation: revoked });
    }

    const rotated = await rotateAccountInvitation(id, {
      id: user.id,
      email: user.email,
    });
    return NextResponse.json({
      ok: true,
      invitation: rotated.invitation,
      token: rotated.token,
      invitePath: rotated.invitePath,
    });
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Operation failed.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const revoked = await revokeAccountInvitation(id, {
      id: user.id,
      email: user.email,
      reason: 'Revoked via DELETE /api/admin/invitations/[id]',
    });
    return NextResponse.json({ ok: true, invitation: revoked });
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to revoke invitation.' },
      { status: 500 }
    );
  }
}
