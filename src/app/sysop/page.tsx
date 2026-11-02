'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';

type SysopSection =
  | 'overview'
  | 'analytics'
  | 'users'
  | 'storage'
  | 'passes'
  | 'activity'
  | 'operations'
  | 'audit';

export default function SysopConsolePage() {
  const router = useRouter();
  const [section, setSection] = useState<SysopSection>('overview');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [metrics, setMetrics] = useState({
    usersSignedUp: 0,
    activeUsers: 0,
    projectsExisting: 0,
    subsStandard: 0,
    subsPro: 0,
    staffPlanGrants: 0,
    libraryReferences: 0,
    libraryAnnotations: 0,
    pendingInvitations: 0,
    activeCodePasses: 0,
    activeOrganizations: 0,
  });

  const [users, setUsers] = useState<Array<Record<string, any>>>([]);
  const [projects, setProjects] = useState<Array<Record<string, any>>>([]);
  const [invitations, setInvitations] = useState<Array<Record<string, any>>>([]);
  const [codePasses, setCodePasses] = useState<Array<Record<string, any>>>([]);
  const [personalPasses, setPersonalPasses] = useState<Array<Record<string, any>>>([]);
  const [organizations, setOrganizations] = useState<Array<Record<string, any>>>([]);
  const [activityRanking, setActivityRanking] = useState<Array<Record<string, any>>>([]);
  const [operations, setOperations] = useState<{
    outboxEmails: Array<Record<string, any>>;
    deletingAccounts: Array<Record<string, any>>;
  }>({ outboxEmails: [], deletingAccounts: [] });
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, any>>>([]);

  // Filters
  const [userQuery, setUserQuery] = useState('');
  const [projectQuery, setProjectQuery] = useState('');
  const [auditQuery, setAuditQuery] = useState('');

  // Action Forms
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Researcher');
  const [invitePlan, setInvitePlan] = useState('standard');
  const [inviteReason, setInviteReason] = useState('');
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null);

  const [passBatchName, setPassBatchName] = useState('Lab Access Pass');
  const [passBatchRole, setPassBatchRole] = useState('Researcher');
  const [passBatchPlan, setPassBatchPlan] = useState('pro');
  const [passBatchMaxUses, setPassBatchMaxUses] = useState(1);
  const [passBatchQuantity, setPassBatchQuantity] = useState(1);
  const [passBatchReason, setPassBatchReason] = useState('');

  const [personalEmails, setPersonalEmails] = useState('');
  const [personalPlan, setPersonalPlan] = useState('pro');
  const [personalDuration, setPersonalDuration] = useState(365);

  const [orgName, setOrgName] = useState('');
  const [orgAdminEmail, setOrgAdminEmail] = useState('');
  const [orgStdSeats, setOrgStdSeats] = useState(25);
  const [orgProSeats, setOrgProSeats] = useState(10);

  const [banner, setBanner] = useState<string | null>(null);

  const loadSysopData = useCallback(async () => {
    const sp = new URLSearchParams();
    if (userQuery.trim()) sp.set('userQuery', userQuery.trim());
    if (projectQuery.trim()) sp.set('projectQuery', projectQuery.trim());
    if (auditQuery.trim()) sp.set('auditQuery', auditQuery.trim());

    const res = await fetch(`/api/sysop/overview?${sp.toString()}`);
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setMetrics(data.metrics || metrics);
      setUsers(data.users || []);
      setProjects(data.projects || []);
      setInvitations(data.invitations || []);
      setCodePasses(data.codePasses || []);
      setPersonalPasses(data.personalPasses || []);
      setOrganizations(data.organizations || []);
      setActivityRanking(data.activityRanking || []);
      setOperations(data.operations || { outboxEmails: [], deletingAccounts: [] });
      setAuditLogs(data.auditLogs || []);
    }
    setLoading(false);
  }, [userQuery, projectQuery, auditQuery, router]);

  useEffect(() => {
    loadSysopData();
  }, [loadSysopData]);

  async function handleIssueEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole,
        planTier: invitePlan,
        reason: inviteReason || 'Sysop single-use email invitation',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteEmail('');
      setInviteReason('');
      setLatestInviteLink(data.invitePath);
      setBanner(`Created single-use invitation: ${data.invitePath}`);
      loadSysopData();
    } else {
      setBanner(data.message || 'Failed to create invitation.');
    }
  }

  async function handleRevokeInvitation(id: string) {
    const res = await fetch(`/api/admin/invitations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setBanner('Invitation revoked and logged in AuditLog.');
      loadSysopData();
    }
  }

  async function handleSysopCommand(payload: Record<string, unknown>) {
    const res = await fetch('/api/sysop/overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setBanner('Operator command executed and recorded in AuditLog.');
      loadSysopData();
    } else {
      setBanner(data.message || 'Command failed.');
    }
  }

  function exportAuditLogs(format: 'json' | 'csv') {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(auditLogs, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cortex-audit-log.json';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const header = 'createdAt,action,actorEmail,actorRole,targetType,targetLabel,reason\n';
    const rows = auditLogs
      .map(
        (l) =>
          `"${l.createdAt}","${l.action}","${l.actorEmail || ''}","${l.actorRole || ''}","${l.targetType}","${l.targetLabel || ''}","${(l.reason || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cortex-audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9] text-sm text-[#575751]">
        Loading Sysop Operator Console...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcf9] p-6 text-center">
        <h1 className="font-serif-academic text-3xl font-semibold text-[#1c1c1a]">
          403 · Sysop Administrator Access Required
        </h1>
        <p className="text-xs text-[#575751] mt-2 max-w-md">
          Only accounts with the Admin system role may access `/sysop` telemetry, pass
          issuance, and security audit logs.
        </p>
        <Link
          href="/app"
          className="mt-6 px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium"
        >
          Return to Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      {/* Top Operator Bar */}
      <header className="border-b border-[#e2e2d8] bg-[#1c1c1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/sysop" className="font-semibold tracking-tight text-base">
              CorTeX · Sysop Console
            </Link>
            <span className="px-2 py-0.5 rounded bg-[#0d9488] text-[10px] font-semibold uppercase">
              Operator Admin
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/app" className="text-[#d6d6cc] hover:text-white">
              ← Back to Workspace (`/app`)
            </Link>
          </div>
        </div>
      </header>

      {banner ? (
        <div className="bg-[#0d9488] text-white text-xs px-6 py-2 flex items-center justify-between">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner(null)}>
            ✕
          </button>
        </div>
      ) : null}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* 8-Section Operator Navigation */}
        <aside className="space-y-1">
          {(
            [
              { id: 'overview', label: '1. Overview' },
              { id: 'analytics', label: '2. Product analytics' },
              { id: 'users', label: '3. Users & RBAC' },
              { id: 'storage', label: '4. Metadata & storage' },
              { id: 'passes', label: '5. Contracts & passes' },
              { id: 'activity', label: '6. Activity ranking' },
              { id: 'operations', label: '7. Operations' },
              { id: 'audit', label: '8. Audit log' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`w-full text-left px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
                section === item.id
                  ? 'bg-[#1c1c1a] text-white'
                  : 'text-[#575751] hover:bg-[#f4f4ee] hover:text-[#1c1c1a]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* Section Body */}
        <main className="space-y-6 min-w-0">
          {section === 'overview' || section === 'analytics' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  {section === 'overview'
                    ? 'System Overview & KPIs'
                    : 'Product Analytics & Funnel Telemetry'}
                </h1>
                <p className="text-xs text-[#575751] mt-1">
                  Live database telemetry across users, projects, subscriptions, passes,
                  and research library objects.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Users signed up', metrics.usersSignedUp],
                  ['Active users', metrics.activeUsers],
                  ['Projects existing', metrics.projectsExisting],
                  ['Subscriptions (Std)', metrics.subsStandard],
                  ['Subscriptions (Pro)', metrics.subsPro],
                  ['Staff plan grants', metrics.staffPlanGrants],
                  ['Pending invitations', metrics.pendingInvitations],
                  ['Active code passes', metrics.activeCodePasses],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="p-4 rounded-xl border border-[#e2e2d8] bg-white"
                  >
                    <div className="text-[11px] font-semibold uppercase text-[#8a8a80]">
                      {label}
                    </div>
                    <div className="text-2xl font-bold text-[#1c1c1a] mt-1">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {section === 'users' ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                    Users, Roles, Operator Plan Grants & Revocation
                  </h1>
                  <p className="text-xs text-[#575751]">
                    Modify system roles (`Admin`, `Researcher`, `Viewer`), grant `standard`
                    or `pro` plans, or immediately revoke sessions.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Search user email, name, role..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#d6d6cc] text-xs bg-white"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#e2e2d8] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e2d8] bg-[#f4f4ee]">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">System Role</th>
                      <th className="py-3 px-3">Effective Plan</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Projects</th>
                      <th className="py-3 px-3">Operator Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2d8]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#fafaf6]">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1c1c1a]">{u.name}</div>
                          <div className="text-[#575751]">{u.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            aria-label={`Role for ${u.email}`}
                            value={u.role}
                            onChange={(e) =>
                              handleSysopCommand({
                                action: 'update_user',
                                userId: u.id,
                                role: e.target.value,
                                reason: `Role changed to ${e.target.value}`,
                              })
                            }
                            className="px-2 py-1 rounded border border-[#d6d6cc] bg-white"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Researcher">Researcher</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            aria-label={`Plan grant for ${u.email}`}
                            value={u.operatorGrantPlan || ''}
                            onChange={(e) =>
                              handleSysopCommand({
                                action: 'update_user',
                                userId: u.id,
                                operatorGrantPlan: e.target.value || null,
                                reason: `Operator plan grant set to ${e.target.value || 'none'}`,
                              })
                            }
                            className="px-2 py-1 rounded border border-[#d6d6cc] bg-white"
                          >
                            <option value="">No staff grant ({u.planTier})</option>
                            <option value="standard">Grant Standard</option>
                            <option value="pro">Grant Pro</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">{u.projectCount}</td>
                        <td className="py-3 px-3 space-x-2">
                          {u.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleSysopCommand({
                                  action: 'update_user',
                                  userId: u.id,
                                  status: 'revoked',
                                  revokeSessions: true,
                                  reason: 'Operator revoked user access and sessions',
                                })
                              }
                              className="px-2.5 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                            >
                              Revoke Access
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleSysopCommand({
                                  action: 'update_user',
                                  userId: u.id,
                                  status: 'active',
                                  reason: 'Operator restored user access',
                                })
                              }
                              className="px-2.5 py-1 rounded bg-[#0d9488] text-white font-medium"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === 'storage' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  Metadata & Storage Explorer
                </h1>
                <input
                  type="text"
                  placeholder="Filter by project or owner..."
                  value={projectQuery}
                  onChange={(e) => setProjectQuery(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#d6d6cc] text-xs bg-white"
                />
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#e2e2d8] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e2d8] bg-[#f4f4ee]">
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Owner</th>
                      <th className="py-3 px-3">Format / Template</th>
                      <th className="py-3 px-3">Files</th>
                      <th className="py-3 px-3">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2d8]">
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-semibold">{p.name}</td>
                        <td className="py-2.5 px-3 text-[#575751]">{p.ownerEmail}</td>
                        <td className="py-2.5 px-3 font-mono-code">
                          {p.format} · {p.templateId}
                        </td>
                        <td className="py-2.5 px-3">{p.fileCount}</td>
                        <td className="py-2.5 px-3">{p.sizeBytes} B</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === 'passes' ? (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  Invite-Only Admission, Code Passes, Personal Passes & Organizations
                </h1>
                <p className="text-xs text-[#575751]">
                  Issue single-use expiring email invitations, shareable Code Passes
                  (`CTX-XXXX-XXXX-XXXX`), Personal Passes, and institutional contracts.
                </p>
              </div>

              {/* 1. Single-Use Email Invitations */}
              <div className="p-5 rounded-xl border border-[#e2e2d8] bg-white space-y-4">
                <h2 className="text-sm font-semibold text-[#1c1c1a]">
                  1. Single-Use Email Invitations (`/invite/[token]`)
                </h2>
                <form
                  onSubmit={handleIssueEmailInvite}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs"
                >
                  <input
                    type="email"
                    required
                    placeholder="scholar@stanford.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="px-3 py-2 rounded border border-[#d6d6cc]"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc] bg-white"
                  >
                    <option value="Researcher">Researcher</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <select
                    value={invitePlan}
                    onChange={(e) => setInvitePlan(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc] bg-white"
                  >
                    <option value="standard">Standard Tier</option>
                    <option value="pro">Pro Tier</option>
                  </select>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded bg-[#1c1c1a] text-white font-medium"
                  >
                    Issue Invitation
                  </button>
                </form>

                {latestInviteLink ? (
                  <div className="p-3 rounded bg-[#f4f4ee] border border-[#d6d6cc] text-xs font-mono-code">
                    Latest single-use invite path: <strong>{latestInviteLink}</strong>
                  </div>
                ) : null}

                <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded border border-[#e2e2d8] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold">{inv.email}</span> ·{' '}
                        <span className="text-[#0d9488] font-medium">{inv.role}</span> ·{' '}
                        <span className="uppercase text-[10px]">{inv.status}</span>
                      </div>
                      {inv.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="text-red-700 font-medium hover:underline"
                        >
                          Revoke
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Code Passes */}
              <div className="p-5 rounded-xl border border-[#e2e2d8] bg-white space-y-4">
                <h2 className="text-sm font-semibold text-[#1c1c1a]">
                  2. Single-Use / Bounded-Use Code Passes (`CTX-XXXX-XXXX-XXXX`)
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSysopCommand({
                      action: 'issue_code_passes',
                      name: passBatchName,
                      role: passBatchRole,
                      planTier: passBatchPlan,
                      maxUses: passBatchMaxUses,
                      quantity: passBatchQuantity,
                      reason: passBatchReason || 'Issued from Sysop Console',
                    });
                  }}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder="Batch name"
                    value={passBatchName}
                    onChange={(e) => setPassBatchName(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc]"
                  />
                  <select
                    value={passBatchRole}
                    onChange={(e) => setPassBatchRole(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc] bg-white"
                  >
                    <option value="Researcher">Researcher</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <select
                    value={passBatchPlan}
                    onChange={(e) => setPassBatchPlan(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc] bg-white"
                  >
                    <option value="standard">Standard</option>
                    <option value="pro">Pro</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passBatchMaxUses}
                    onChange={(e) => setPassBatchMaxUses(Number(e.target.value) || 1)}
                    placeholder="Max uses"
                    className="px-2.5 py-2 rounded border border-[#d6d6cc]"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded bg-[#1c1c1a] text-white font-medium"
                  >
                    Generate Code Pass
                  </button>
                </form>

                <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                  {codePasses.map((cp) => (
                    <div
                      key={cp.id}
                      className="p-2.5 rounded border border-[#e2e2d8] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono-code font-bold text-[#1c1c1a]">
                          {cp.codePlain || cp.codePreview}
                        </span>{' '}
                        · <span>{cp.name}</span> ·{' '}
                        <span className="text-[#0d9488] font-semibold">
                          {cp.role} / {cp.planTier.toUpperCase()}
                        </span>{' '}
                        ·{' '}
                        <span>
                          Uses: {cp.usedCount}/{cp.maxUses} ({cp.status})
                        </span>
                      </div>
                      {cp.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleSysopCommand({
                              action: 'revoke_code_pass',
                              passId: cp.id,
                              reason: 'Revoked from Sysop Console',
                            })
                          }
                          className="text-red-700 font-medium hover:underline"
                        >
                          Revoke
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Organizations */}
              <div className="p-5 rounded-xl border border-[#e2e2d8] bg-white space-y-4">
                <h2 className="text-sm font-semibold text-[#1c1c1a]">
                  3. Institutional Organizations & Seat Contracts
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSysopCommand({
                      action: 'create_organization',
                      name: orgName,
                      adminEmail: orgAdminEmail,
                      standardSeats: orgStdSeats,
                      proSeats: orgProSeats,
                    });
                    setOrgName('');
                    setOrgAdminEmail('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder="Institution / Lab Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="admin@university.edu"
                    value={orgAdminEmail}
                    onChange={(e) => setOrgAdminEmail(e.target.value)}
                    className="px-2.5 py-2 rounded border border-[#d6d6cc]"
                  />
                  <input
                    type="number"
                    value={orgStdSeats}
                    onChange={(e) => setOrgStdSeats(Number(e.target.value) || 0)}
                    placeholder="Standard seats"
                    className="px-2.5 py-2 rounded border border-[#d6d6cc]"
                  />
                  <input
                    type="number"
                    value={orgProSeats}
                    onChange={(e) => setOrgProSeats(Number(e.target.value) || 0)}
                    placeholder="Pro seats"
                    className="px-2.5 py-2 rounded border border-[#d6d6cc]"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded bg-[#1c1c1a] text-white font-medium"
                  >
                    Create Organization
                  </button>
                </form>

                <div className="space-y-1.5 text-xs">
                  {organizations.map((o) => (
                    <div
                      key={o.id}
                      className="p-2.5 rounded border border-[#e2e2d8] flex items-center justify-between"
                    >
                      <div>
                        <strong>{o.name}</strong> ({o.contractRef}) · Admin: {o.adminEmail}{' '}
                        · Seats: {o.standardSeats} Std / {o.proSeats} Pro ·{' '}
                        <span className="uppercase font-semibold">{o.status}</span>
                      </div>
                      {o.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleSysopCommand({
                              action: 'terminate_organization',
                              organizationId: o.id,
                            })
                          }
                          className="text-red-700 font-medium hover:underline"
                        >
                          Terminate
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {section === 'activity' ? (
            <div className="space-y-4">
              <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                Researcher Activity Ranking (Version Snapshots)
              </h1>
              <div className="overflow-x-auto rounded-xl border border-[#e2e2d8] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e2d8] bg-[#f4f4ee]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Versions</th>
                      <th className="py-2.5 px-3">Projects</th>
                      <th className="py-2.5 px-3">Language</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2d8]">
                    {activityRanking.map((r) => (
                      <tr key={r.userId}>
                        <td className="py-2.5 px-3 font-bold">#{r.rank}</td>
                        <td className="py-2.5 px-3">{r.email}</td>
                        <td className="py-2.5 px-3">{r.versions}</td>
                        <td className="py-2.5 px-3">{r.projects}</td>
                        <td className="py-2.5 px-3">{r.language}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === 'operations' ? (
            <div className="space-y-4">
              <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                Operations & Transactional Email Outbox
              </h1>
              <div className="p-4 rounded-xl border border-[#e2e2d8] bg-white space-y-2 text-xs">
                <div className="font-semibold">
                  Outbox Deliveries ({operations.outboxEmails.length})
                </div>
                {operations.outboxEmails.map((em) => (
                  <div
                    key={em.id}
                    className="p-2.5 rounded bg-[#fafaf6] border border-[#e2e2d8]"
                  >
                    <div className="font-medium">
                      To: {em.recipientEmail} · {em.subject}
                    </div>
                    <div className="font-mono-code text-[11px] text-[#0d9488] mt-0.5">
                      {em.actionUrl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {section === 'audit' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                    Immutable Security & Governance Audit Log
                  </h1>
                  <p className="text-xs text-[#575751]">
                    Every admission, invitation, pass redemption, role change, and
                    session revocation is permanently recorded.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter action, actor, target..."
                    value={auditQuery}
                    onChange={(e) => setAuditQuery(e.target.value)}
                    className="px-3 py-1.5 rounded border border-[#d6d6cc] text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => exportAuditLogs('csv')}
                    className="px-3 py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportAuditLogs('json')}
                    className="px-3 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Export JSON
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#e2e2d8] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e2d8] bg-[#f4f4ee]">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Target</th>
                      <th className="py-2.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2d8]">
                    {auditLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-[#fafaf6]">
                        <td className="py-2.5 px-3 font-mono-code text-[11px] text-[#575751]">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono-code font-semibold text-[#0d9488]">
                          {l.action}
                        </td>
                        <td className="py-2.5 px-3">
                          {l.actorEmail || 'system'} ({l.actorRole || '—'})
                        </td>
                        <td className="py-2.5 px-3">
                          {l.targetType}: {l.targetLabel || l.targetId || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#575751]">{l.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
