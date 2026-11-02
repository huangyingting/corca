import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AccountAdmissionError,
  expireCodePasses,
  expirePendingInvitations,
  getCurrentUser,
  issueCodePassBatch,
  normalizeAccountEmail,
  normalizePlanTier,
  normalizeSystemRole,
  recordAuditLog,
  revokeInviteCodePass,
  revokeUserSessions,
  type PlanTier,
  type SystemRole,
} from '@/lib/account-admission';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Admin') {
    return NextResponse.json(
      { error: 'forbidden', message: 'Sysop Administrator role required.' },
      { status: 403 }
    );
  }

  await Promise.all([expirePendingInvitations(), expireCodePasses()]);

  const qUser = (request.nextUrl.searchParams.get('userQuery') || '').trim().toLowerCase();
  const qProject = (request.nextUrl.searchParams.get('projectQuery') || '').trim().toLowerCase();
  const qAudit = (request.nextUrl.searchParams.get('auditQuery') || '').trim().toLowerCase();

  const [
    users,
    projects,
    invitations,
    codePasses,
    personalPasses,
    organizations,
    auditLogs,
    outboxEmails,
    libraryCount,
    annotationCount,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ownedProjects: { select: { id: true, name: true, format: true, updatedAt: true } },
        projectVersions: { select: { id: true, createdAt: true } },
        sessions: { select: { id: true, expires: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        files: { select: { id: true, sizeBytes: true } },
        collaborators: { where: { status: 'ACTIVE' } },
      },
      take: 100,
    }),
    prisma.accountInvitation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.inviteCodePass.findMany({
      orderBy: { createdAt: 'desc' },
      include: { redemptions: { include: { user: { select: { email: true, name: true } } } } },
      take: 100,
    }),
    prisma.personalPass.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: { members: true },
      take: 50,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.accountEmailOutbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.libraryReference.count({ where: { inTrash: false } }),
    prisma.libraryAnnotation.count(),
  ]);

  const filteredUsers = users
    .filter((u) => {
      if (!qUser) return true;
      return `${u.email} ${u.name} ${u.role} ${u.id}`.toLowerCase().includes(qUser);
    })
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      planTier: u.planTier,
      operatorGrantPlan: u.operatorGrantPlan,
      effectivePlan: u.operatorGrantPlan || u.planTier,
      uiLanguage: u.uiLanguage,
      dailyTokensUsed: u.dailyTokensUsed,
      monthlyTokensUsed: u.monthlyTokensUsed,
      storageBytesUsed: u.storageBytesUsed,
      projectCount: u.ownedProjects.length,
      versionCount: u.projectVersions.length,
      activeSessions: u.sessions.filter((s) => s.expires > new Date()).length,
      projects: u.ownedProjects,
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt,
    }));

  const filteredProjects = projects
    .filter((p) => {
      if (!qProject) return true;
      return `${p.name} ${p.id} ${p.owner.email} ${p.owner.name}`.toLowerCase().includes(qProject);
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      format: p.format,
      templateId: p.templateId,
      ownerEmail: p.owner.email,
      ownerName: p.owner.name,
      memberCount: p.collaborators.length + 1,
      fileCount: p.files.length,
      sizeBytes: p.files.reduce((s, f) => s + f.sizeBytes, 0),
      updatedAt: p.updatedAt,
    }));

  const filteredAudit = auditLogs.filter((a) => {
    if (!qAudit) return true;
    return `${a.action} ${a.actorEmail || ''} ${a.targetLabel || ''} ${a.reason || ''}`
      .toLowerCase()
      .includes(qAudit);
  });

  // Activity ranking by version history
  const activityRanking = [...filteredUsers]
    .sort((a, b) => b.versionCount - a.versionCount || b.projectCount - a.projectCount)
    .map((u, idx) => ({
      rank: idx + 1,
      userId: u.id,
      email: u.email,
      name: u.name,
      activeDays: Math.max(1, Math.min(30, u.versionCount)),
      versions: u.versionCount,
      projects: u.projectCount,
      lastActivityAt: u.lastActiveAt,
      language: u.uiLanguage,
      signedUpAt: u.createdAt,
    }));

  return NextResponse.json({
    metrics: {
      usersSignedUp: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      projectsExisting: projects.length,
      subsStandard: users.filter((u) => (u.operatorGrantPlan || u.planTier) === 'standard').length,
      subsPro: users.filter((u) => (u.operatorGrantPlan || u.planTier) === 'pro').length,
      staffPlanGrants: users.filter((u) => Boolean(u.operatorGrantPlan)).length,
      libraryReferences: libraryCount,
      libraryAnnotations: annotationCount,
      pendingInvitations: invitations.filter((i) => i.status === 'PENDING').length,
      activeCodePasses: codePasses.filter((c) => c.status === 'ACTIVE').length,
      activeOrganizations: organizations.filter((o) => o.status === 'ACTIVE').length,
    },
    users: filteredUsers,
    projects: filteredProjects,
    invitations,
    codePasses,
    personalPasses,
    organizations,
    activityRanking,
    operations: {
      outboxEmails,
      deletingAccounts: users.filter((u) => u.status === 'deleting'),
    },
    auditLogs: filteredAudit,
  });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== 'Admin') {
      return NextResponse.json(
        { error: 'forbidden', message: 'Sysop Administrator role required.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';

    // 1. Update User Role, Operator Plan Grant, or Account Status / Session Revocation
    if (action === 'update_user') {
      const targetUserId = typeof body.userId === 'string' ? body.userId : '';
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
      }

      const data: Record<string, unknown> = {};
      if (typeof body.role === 'string') {
        data.role = normalizeSystemRole(body.role);
      }
      if ('operatorGrantPlan' in body) {
        data.operatorGrantPlan = body.operatorGrantPlan
          ? normalizePlanTier(body.operatorGrantPlan)
          : null;
        if (data.operatorGrantPlan) {
          data.planTier = data.operatorGrantPlan;
        }
      }
      if (typeof body.status === 'string' && ['active', 'suspended', 'revoked'].includes(body.status)) {
        data.status = body.status;
      }

      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data,
      });

      if (data.status === 'suspended' || data.status === 'revoked' || body.revokeSessions === true) {
        await revokeUserSessions(targetUserId);
      }

      await recordAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action:
          data.status && data.status !== 'active'
            ? 'sysop.user.revoke_access'
            : data.role
              ? 'sysop.user.role_change'
              : 'sysop.user.plan_grant',
        targetType: 'user',
        targetId: updated.id,
        targetLabel: updated.email,
        reason: typeof body.reason === 'string' ? body.reason : 'Operator updated account access',
        metadata: data,
      });

      return NextResponse.json({ ok: true, user: updated });
    }

    // 2. Issue single-use / bounded-use expiring Code Passes
    if (action === 'issue_code_passes') {
      const passes = await issueCodePassBatch({
        name: typeof body.name === 'string' ? body.name : 'CorTeX Access Pass',
        role: (typeof body.role === 'string' ? body.role : 'Researcher') as SystemRole,
        planTier: (typeof body.planTier === 'string' ? body.planTier : 'standard') as PlanTier,
        durationDays: Number(body.durationDays) || 30,
        maxUses: Number(body.maxUses) || 1,
        quantity: Number(body.quantity) || 1,
        expiresAt: body.expiresInDays
          ? new Date(Date.now() + Number(body.expiresInDays) * 86400000)
          : undefined,
        contractRef: typeof body.contractRef === 'string' ? body.contractRef : null,
        reason: typeof body.reason === 'string' ? body.reason : null,
        issuedById: actor.id,
        issuedByEmail: actor.email,
      });
      return NextResponse.json({ ok: true, passes }, { status: 201 });
    }

    // 3. Revoke a Code Pass
    if (action === 'revoke_code_pass') {
      const passId = typeof body.passId === 'string' ? body.passId : '';
      const revoked = await revokeInviteCodePass(passId, {
        id: actor.id,
        email: actor.email,
        reason: typeof body.reason === 'string' ? body.reason : 'Operator revoked code pass',
      });
      return NextResponse.json({ ok: true, pass: revoked });
    }

    // 4. Issue Personal Passes
    if (action === 'issue_personal_passes') {
      const rawEmails: string[] = Array.isArray(body.emails)
        ? body.emails
        : typeof body.emails === 'string'
          ? body.emails.split(/[\n,;]+/)
          : [];
      const emails = [
        ...new Set(rawEmails.map((e) => normalizeAccountEmail(String(e))).filter(Boolean)),
      ].slice(0, 50);

      if (emails.length === 0) {
        return NextResponse.json(
          { error: 'missing_emails', message: 'Enter at least one recipient email.' },
          { status: 400 }
        );
      }

      const planTier = normalizePlanTier(body.planTier || 'standard');
      const durationDays = Math.max(1, Number(body.durationDays) || 365);
      const activationDeadline = new Date(Date.now() + 30 * 86400000);
      const created = [];

      for (const email of emails) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        const pass = await prisma.personalPass.create({
          data: {
            recipientEmail: email,
            normalizedEmail: email,
            userId: existingUser?.id || null,
            planTier,
            durationDays,
            status: existingUser ? 'ACTIVE' : 'AWAITING_ACTIVATION',
            activatedAt: existingUser ? new Date() : null,
            endsAt: existingUser
              ? new Date(Date.now() + durationDays * 86400000)
              : null,
            activationDeadline,
            contractRef: typeof body.contractRef === 'string' ? body.contractRef : null,
            reason: typeof body.reason === 'string' ? body.reason : null,
            issuedById: actor.id,
          },
        });
        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { planTier, operatorGrantPlan: planTier },
          });
        }
        created.push(pass);
      }

      await recordAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'sysop.personal_pass.issue',
        targetType: 'personal_pass',
        targetId: created[0]?.id || null,
        targetLabel: `${emails.length} recipient(s)`,
        reason: typeof body.reason === 'string' ? body.reason : 'Issued personal passes',
        metadata: { emails, planTier, durationDays },
      });

      return NextResponse.json({ ok: true, personalPasses: created }, { status: 201 });
    }

    // 5. Revoke Personal Pass
    if (action === 'revoke_personal_pass') {
      const passId = typeof body.passId === 'string' ? body.passId : '';
      const updated = await prisma.personalPass.update({
        where: { id: passId },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });

      await recordAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'sysop.personal_pass.revoke',
        targetType: 'personal_pass',
        targetId: updated.id,
        targetLabel: updated.recipientEmail,
        reason: typeof body.reason === 'string' ? body.reason : 'Revoked personal pass',
      });

      return NextResponse.json({ ok: true, personalPass: updated });
    }

    // 6. Create or Terminate Organization Contract
    if (action === 'create_organization') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const adminEmail =
        typeof body.adminEmail === 'string' ? normalizeAccountEmail(body.adminEmail) : '';
      const contractRef =
        typeof body.contractRef === 'string' && body.contractRef.trim()
          ? body.contractRef.trim()
          : `CTR-${Date.now().toString(36).toUpperCase()}`;

      if (!name || !adminEmail) {
        return NextResponse.json(
          { error: 'missing_fields', message: 'Organization name and administrator email are required.' },
          { status: 400 }
        );
      }

      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36).slice(-4)}`;
      const startsAt = new Date();
      const endsAt = new Date(Date.now() + 365 * 86400000);

      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          adminEmail,
          contractRef,
          status: 'ACTIVE',
          startsAt,
          endsAt,
          standardSeats: Math.max(0, Number(body.standardSeats) || 20),
          proSeats: Math.max(0, Number(body.proSeats) || 10),
          reason: typeof body.reason === 'string' ? body.reason : null,
          members: {
            create: {
              email: adminEmail,
              role: 'ADMIN',
              seatPlan: 'pro',
              status: 'ACTIVE',
            },
          },
        },
        include: { members: true },
      });

      await recordAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'sysop.organization.create',
        targetType: 'organization',
        targetId: org.id,
        targetLabel: `${org.name} (${org.contractRef})`,
        reason: typeof body.reason === 'string' ? body.reason : 'Created organization contract',
      });

      return NextResponse.json({ ok: true, organization: org }, { status: 201 });
    }

    if (action === 'terminate_organization') {
      const orgId = typeof body.organizationId === 'string' ? body.organizationId : '';
      const org = await prisma.organization.update({
        where: { id: orgId },
        data: { status: 'TERMINATED', endsAt: new Date() },
      });

      await recordAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'sysop.organization.terminate',
        targetType: 'organization',
        targetId: org.id,
        targetLabel: org.name,
        reason: typeof body.reason === 'string' ? body.reason : 'Terminated organization contract',
      });

      return NextResponse.json({ ok: true, organization: org });
    }

    return NextResponse.json(
      { error: 'unknown_action', message: `Unsupported sysop action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Sysop command failed.' },
      { status: 500 }
    );
  }
}
