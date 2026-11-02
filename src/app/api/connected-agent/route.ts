import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, recordAuditLog } from '@/lib/account-admission';

interface ConnectedAgentState {
  state: 'unpaired' | 'pairing' | 'connected';
  pairingExpiresAt?: string;
  connectedAt?: string;
  activity?: 'idle' | 'busy' | 'offline';
  lastSeenAt?: string;
  relaySha256?: string;
  script?: string;
}

function parseLabsConfig(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const labs = parseLabsConfig(user.labsConfigJson);
  const agent = (labs.connectedAgent as ConnectedAgentState | undefined) ?? { state: 'unpaired' };

  if (
    agent.state === 'pairing' &&
    agent.pairingExpiresAt &&
    new Date(agent.pairingExpiresAt).getTime() < Date.now()
  ) {
    return NextResponse.json({ state: 'unpaired' });
  }

  return NextResponse.json({
    state: agent.state,
    pairingExpiresAt: agent.pairingExpiresAt,
    connectedAt: agent.connectedAt,
    activity: agent.state === 'connected' ? agent.activity ?? 'idle' : undefined,
    lastSeenAt: agent.lastSeenAt,
    plan: user.operatorGrantPlan || user.planTier,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const labs = parseLabsConfig(user.labsConfigJson);

  if (body.action === 'confirm') {
    const nowIso = new Date().toISOString();
    const nextAgent: ConnectedAgentState = {
      state: 'connected',
      connectedAt: nowIso,
      activity: body.activity === 'busy' ? 'busy' : 'idle',
      lastSeenAt: nowIso,
    };
    labs.connectedAgent = nextAgent;
    await prisma.user.update({
      where: { id: user.id },
      data: { labsConfigJson: JSON.stringify(labs) },
    });
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'agent.connected',
      targetType: 'User',
      targetId: user.id,
      metadata: { connectedAt: nowIso, activity: nextAgent.activity },
    });
    return NextResponse.json(nextAgent);
  }

  const rawToken = `ctx_agent_${crypto.randomBytes(18).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const origin = req.nextUrl.origin || 'http://localhost:3000';
  const relayPayload = `#!/usr/bin/env bash\nset -euo pipefail\n# CorTeX Connected Agent Relay Bootstrap\nexport CORTEX_RELAY_URL="${origin}/api/connected-agent"\nexport CORTEX_PAIRING_TOKEN="${rawToken}"\necho "Connecting local agent to CorTeX (${origin})..."\ncurl -fsSL -X POST "$CORTEX_RELAY_URL" -H "Content-Type: application/json" -d '{"action":"confirm"}'`;
  const relaySha256 = crypto.createHash('sha256').update(relayPayload).digest('hex');

  const nextAgent: ConnectedAgentState = {
    state: 'pairing',
    pairingExpiresAt: expiresAt,
    relaySha256,
    script: relayPayload,
  };
  labs.connectedAgent = nextAgent;

  await prisma.user.update({
    where: { id: user.id },
    data: { labsConfigJson: JSON.stringify(labs) },
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'agent.pairing_created',
    targetType: 'User',
    targetId: user.id,
    metadata: { expiresAt, relaySha256 },
  });

  return NextResponse.json({
    state: 'pairing',
    expiresAt,
    relaySha256,
    script: relayPayload,
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const labs = parseLabsConfig(user.labsConfigJson);
  labs.connectedAgent = { state: 'unpaired' };

  await prisma.user.update({
    where: { id: user.id },
    data: { labsConfigJson: JSON.stringify(labs) },
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'agent.disconnected',
    targetType: 'User',
    targetId: user.id,
  });

  return NextResponse.json({ state: 'unpaired' });
}
