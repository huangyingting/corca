import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VENUE_TEMPLATES,
  VENUE_TEMPLATE_CATEGORIES,
  generateStarterFilesForTemplate,
} from '../src/lib/data/venue-templates';
import {
  ACADEMIC_PHRASEBANK,
  PHRASEBANK_FAMILIES,
} from '../src/lib/data/phrasebank';
import {
  compileAcademicDocument,
  compileProjectWorkspace,
  parseBibtexContent,
} from '../src/lib/compiler/compile-engine';
import {
  AccountAdmissionError,
  createAccountInvitation,
  createInvitePassCode,
  createOpaqueToken,
  hashInvitePassCode,
  hashOpaqueToken,
  hashPassword,
  issueCodePassBatch,
  redeemCodePassForExistingUser,
  registerAccount,
  revokeAccountInvitation,
  revokeInviteCodePass,
  revokeUserSessions,
  verifyPassword,
} from '../src/lib/account-admission';
import { prisma } from '../src/lib/prisma';

describe('CorTeX Venue Templates & Multi-Format Academic Compiler', () => {
  it('provides all 104 official academic venue & document templates across 10 categories', () => {
    assert.equal(VENUE_TEMPLATES.length, 104);
    assert.equal(VENUE_TEMPLATE_CATEGORIES.length, 11);

    const neurips = VENUE_TEMPLATES.find((t) => t.id.startsWith('neurips'));
    assert.ok(neurips);
    assert.equal(neurips.category, 'AI & machine learning');

    const starter = generateStarterFilesForTemplate(neurips.id, 'Geodesic Transformers');
    assert.equal(starter.length, 2);
    assert.ok(starter.some((f) => f.path === 'main.tex' && f.isMain));
    assert.ok(starter.some((f) => f.path === 'refs.bib'));

    // Verify all 16 Academic Phrasebank rhetorical families + claim-strength metadata
    assert.equal(PHRASEBANK_FAMILIES.length, 16);
    assert.ok(ACADEMIC_PHRASEBANK.length >= 18);
    assert.ok(ACADEMIC_PHRASEBANK.some((p) => p.strength === 'cautious'));
    assert.ok(ACADEMIC_PHRASEBANK.some((p) => p.strength === 'neutral'));
    assert.ok(ACADEMIC_PHRASEBANK.some((p) => p.strength === 'strong'));
  });

  it('compiles LaTeX, Typst, Markdown, and Slides with SyncTeX and citation diagnostics', () => {
    const bib = `@inproceedings{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam},
  booktitle={NeurIPS},
  year={2017}
}`;
    const parsedBib = parseBibtexContent(bib);
    assert.equal(parsedBib.length, 1);
    assert.equal(parsedBib[0].citeKey, 'vaswani2017attention');

    const latexCompiled = compileProjectWorkspace({
      mainFilePath: 'main.tex',
      mainContent: `\\documentclass{article}
\\title{Test Paper}
\\author{Alice}
\\begin{document}
\\section{Intro}
See \\cite{vaswani2017attention} and missing \\cite{unknown2099ref}.
\\end{document}`,
      bibContent: bib,
    });

    assert.equal(latexCompiled.ok, true);
    assert.ok(latexCompiled.outline.length >= 1);
    assert.ok(
      latexCompiled.diagnostics.some((d) => d.message.includes('unknown2099ref'))
    );

    const slidesCompiled = compileAcademicDocument({
      fileName: 'slides.md',
      content: `# Slide 1\n- Point A\n\n---\n\n# Slide 2\n$$E = mc^2$$`,
    });
    assert.ok(slidesCompiled.html.includes('cortex-slide-deck'));
  });
});

describe('CorTeX Invite-Only Admission, Single-Use Invitations, Code Passes, RBAC & Audit Logs', () => {
  it('hashes and verifies passwords and generates cryptographic tokens and passes', async () => {
    const hash = await hashPassword('ScholarPass123!');
    assert.equal(await verifyPassword('ScholarPass123!', hash), true);
    assert.equal(await verifyPassword('WrongPass999!', hash), false);

    const inviteTok = createOpaqueToken();
    const inviteTokHash = hashOpaqueToken(inviteTok);
    assert.ok(inviteTok.length >= 32);
    assert.equal(inviteTokHash.length, 43);

    const passCode = createInvitePassCode();
    const passCodeHash = hashInvitePassCode(passCode);
    assert.ok(passCode.startsWith('CTX-'));
    assert.equal(passCodeHash.length, 43);
  });

  it('enforces single-use email invitations, code pass redemption, revocation, and audit logs', async () => {
    const runSuffix = Date.now().toString(36);
    const inviteEmail = `invited-${runSuffix}@stanford.edu`;

    // 1. Issue single-use email invitation
    const issued = await createAccountInvitation({
      email: inviteEmail,
      role: 'Researcher',
      planTier: 'standard',
      reason: 'Unit test single-use invite',
    });
    assert.equal(issued.invitation.status, 'PENDING');
    assert.ok(issued.invitePath.includes('/invite/'));

    // 2. Accept single-use invitation
    const reg = await registerAccount({
      token: issued.token,
      email: inviteEmail,
      name: 'Dr. Test Researcher',
      password: 'SecurePassword123',
    });
    assert.equal(reg.user.email, inviteEmail);
    assert.equal(reg.user.role, 'Researcher');

    // 3. Re-using the same single-use token must fail with invalid_invitation
    await assert.rejects(
      async () => {
        await registerAccount({
          token: issued.token,
          email: inviteEmail,
          name: 'Replay Attacker',
          password: 'SecurePassword123',
        });
      },
      (err: unknown) =>
        err instanceof AccountAdmissionError && err.code === 'invalid_invitation'
    );

    // 4. Issue a single-use Code Pass (CTX-XXXX-XXXX-XXXX) and redeem it for a new user via registerAccount
    const passes = await issueCodePassBatch({
      name: 'Unit Test Lab Pass',
      role: 'Viewer',
      planTier: 'pro',
      maxUses: 1,
      quantity: 1,
      reason: 'Unit test code pass',
    });
    assert.equal(passes.length, 1);
    const passEmail = `pass-user-${runSuffix}@mit.edu`;

    const redeemed = await registerAccount({
      inviteCode: passes[0].code,
      email: passEmail,
      name: 'Pass Scholar',
      password: 'PassUser1234',
    });
    assert.equal(redeemed.user.email, passEmail);
    assert.equal(redeemed.user.role, 'Viewer');
    assert.equal(redeemed.user.planTier, 'pro');

    // 5. Re-using exhausted single-use Code Pass must fail with invalid_code
    await assert.rejects(
      async () => {
        await registerAccount({
          inviteCode: passes[0].code,
          email: `another-${runSuffix}@mit.edu`,
          name: 'Second User',
          password: 'PassUser1234',
        });
      },
      (err: unknown) =>
        err instanceof AccountAdmissionError && err.code === 'invalid_code'
    );

    // 6. Test invitation & code pass revocation + session revocation
    const revInvite = await createAccountInvitation({
      email: `revoke-${runSuffix}@ox.ac.uk`,
      role: 'Researcher',
    });
    const revokedInv = await revokeAccountInvitation(revInvite.invitation.id, {
      email: 'sysop@corca.ai',
      reason: 'Revoked during unit test',
    });
    assert.equal(revokedInv.status, 'REVOKED');

    const revPassBatch = await issueCodePassBatch({
      name: 'Revocable Pass',
      maxUses: 5,
      quantity: 1,
    });
    const revokedPass = await revokeInviteCodePass(revPassBatch[0].id, {
      email: 'sysop@corca.ai',
      reason: 'Compromised code',
    });
    assert.equal(revokedPass.status, 'REVOKED');

    const prevVersion = reg.user.sessionVersion;
    await revokeUserSessions(reg.user.id);
    const refreshedUser = await prisma.user.findUnique({ where: { id: reg.user.id } });
    assert.equal(refreshedUser?.sessionVersion, prevVersion + 1);

    // 7. Verify immutable AuditLog entries exist
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    assert.ok(logs.length >= 4);
    assert.ok(logs.some((l) => l.action.includes('invitation.accept')));
    assert.ok(logs.some((l) => l.action.includes('code_pass')));
    assert.ok(logs.some((l) => l.action.includes('invitation.revoke')));

    // Clean up unit test artifacts so database stays clean (no dummy users left behind)
    await prisma.inviteCodeRedemption.deleteMany({
      where: { userId: { in: [reg.user.id, redeemed.user.id] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [inviteEmail, passEmail] } },
    });
    await prisma.accountInvitation.deleteMany({
      where: {
        email: { in: [inviteEmail, `revoke-${runSuffix}@ox.ac.uk`] },
      },
    });
    await prisma.inviteCodePass.deleteMany({
      where: { id: { in: [passes[0].id, revPassBatch[0].id] } },
    });
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: [reg.user.id, redeemed.user.id] } },
          { targetId: { in: [reg.user.id, redeemed.user.id, issued.invitation.id, revInvite.invitation.id, passes[0].id, revPassBatch[0].id] } },
        ],
      },
    });
  });
});
