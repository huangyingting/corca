export type AccountAdmissionMode = 'invitation-only' | 'public';

export type SystemRole = 'Admin' | 'Researcher' | 'Viewer';

export type PlanTier = 'free' | 'standard' | 'pro';

export function accountAdmissionMode(): AccountAdmissionMode {
  const mode = (process.env.ACCOUNT_ADMISSION_MODE || 'invitation-only')
    .trim()
    .toLowerCase();
  return mode === 'public' ? 'public' : 'invitation-only';
}

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAccountEmail(email: string): boolean {
  const normalized = normalizeAccountEmail(email);
  if (normalized.length < 3 || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function normalizeSystemRole(role?: string | null): SystemRole {
  const cleaned = (role || '').trim().toLowerCase();
  if (cleaned === 'admin' || cleaned === 'sysop') return 'Admin';
  if (cleaned === 'viewer') return 'Viewer';
  return 'Researcher';
}

export function normalizePlanTier(plan?: string | null): PlanTier {
  const cleaned = (plan || '').trim().toLowerCase();
  if (cleaned === 'pro') return 'pro';
  if (cleaned === 'standard') return 'standard';
  return 'free';
}
