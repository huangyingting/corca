import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser } from 'playwright';
import { bootstrapAdmin } from '../src/lib/account-admission';
import { prisma } from '../src/lib/prisma';

const PORT = 3105;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'e2e-sysop-operator@corca.ai';
const ADMIN_PASS = 'CorcaOperator2026!';

async function waitForServer(url: string, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

describe('CorTeX by Corca End-to-End Playwright Suite', () => {
  let serverProc: ChildProcess | null = null;
  let browser: Browser | null = null;

  before(async () => {
    // Provision temporary E2E Admin account via bootstrap helper (cleaned up in after())
    await bootstrapAdmin({
      email: ADMIN_EMAIL,
      name: 'CorTeX E2E Operator',
      password: ADMIN_PASS,
    });

    serverProc = spawn(
      './node_modules/.bin/next',
      ['start', '-p', String(PORT)],
      {
        cwd: process.cwd(),
        stdio: 'ignore',
        detached: true,
        env: { ...process.env, PORT: String(PORT) },
      }
    );

    await waitForServer(BASE_URL);
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (serverProc && serverProc.pid) {
      try {
        process.kill(-serverProc.pid, 'SIGTERM');
      } catch {
        try {
          process.kill(serverProc.pid, 'SIGTERM');
        } catch {
          // ignore
        }
      }
    }

    // Clean up all E2E test records so zero dummy/test accounts remain in the database
    const adminUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (adminUser) {
      await prisma.project.deleteMany({ where: { ownerId: adminUser.id } });
      await prisma.libraryReference.deleteMany({ where: { userId: adminUser.id } });
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: adminUser.id },
            { actorEmail: ADMIN_EMAIL },
          ],
        },
      });
    }
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: ADMIN_EMAIL },
          { email: { startsWith: 'e2e-' } },
        ],
      },
    });
    await prisma.accountInvitation.deleteMany({
      where: { email: { startsWith: 'e2e-' } },
    });
    await prisma.inviteCodePass.deleteMany({
      where: { name: 'Lab Access Pass' },
    });
  });

  it('verifies Public Landing, 9-language switcher, 4-format hero, Gallery, Docs, Legal, and /try Browser Trial', async () => {
    assert.ok(browser);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // 1. Public Marketing Landing Page (/)
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('h1');
    const heroHeading = await page.locator('h1').textContent();
    assert.ok(heroHeading?.includes('Built for scholars, designed for research'));

    // 4-Format Hero Switcher
    await page.getByRole('button', { name: 'Typst' }).click();
    await page.getByText('main.typ').first().waitFor();
    await page.getByRole('button', { name: 'Presentation' }).click();
    await page.getByText('slides.md').first().waitFor();

    // 9-Language Selector
    await page.locator('#lang-select').selectOption('ko');
    const koHeading = await page.locator('h1').textContent();
    assert.ok(koHeading?.includes('학자를 위해 설계된 통합 연구 및 집필 환경'));
    await page.locator('#lang-select').selectOption('en');
    await page.screenshot({
      path: 'screenshots/verification/01-landing-desktop.png',
      fullPage: true,
    });

    // 2. Open Workspace Gallery (/gallery)
    await page.goto(`${BASE_URL}/gallery`);
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.getByText('memo.md').first().waitFor();
    await page.screenshot({ path: 'screenshots/verification/02-gallery.png' });

    // 3. Documentation Portal & Interactive 5-Step LaTeX Guide
    await page.goto(`${BASE_URL}/docs/en/guides/latex-for-beginners`);
    await page.getByText('5-Step Hands-On LaTeX Sandbox').waitFor();
    await page.getByRole('button', { name: 'Step 3' }).click();
    await page.screenshot({ path: 'screenshots/verification/03-docs-latex-guide.png' });

    // 4. Legal Portal (/legal/en/terms)
    await page.goto(`${BASE_URL}/legal/en/terms`);
    await page.getByText('CorTeX Terms of Service').waitFor();

    // 5. Instant Browser Trial (/try/tex)
    await page.goto(`${BASE_URL}/try/tex`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '5-Step Tour' }).click();
    await page.getByText('Interactive Tour · Step 1 of 5').waitFor();
    await page.getByRole('button', { name: /Next step/i }).click();
    await page.getByText('Interactive Tour · Step 2 of 5').waitFor();

    await page.getByRole('button', { name: /Phrasebank \(\/\)/i }).click();
    await page.getByText('Academic Phrasebank & LaTeX Snippets').waitFor();
    await page
      .getByRole('button', { name: /Recent advances have demonstrated/i })
      .click();

    await page.getByRole('button', { name: 'Typst (.typ)' }).click();
    await page.getByText('main.typ').first().waitFor();
    await page.screenshot({ path: 'screenshots/verification/04-try-workspace.png' });

    // 5b. Browser Trial Draft Recovery (/try/recover) & GitHub Direct Workspace (/gh/...)
    await page.goto(`${BASE_URL}/try/recover`);
    await page.getByText('Unsaved Browser Trial Recovery').waitFor();

    await page.goto(`${BASE_URL}/gh/corca-ai/cortex-paper/blob/main/main.tex`);
    await page.getByText('corca-ai/cortex-paper').first().waitFor();

    // 6. Mobile Responsive Verification (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('h1');
    await page.screenshot({ path: 'screenshots/verification/10-mobile-landing.png' });

    await context.close();
  });

  it('verifies Invite-Only Auth, /sysop Console, Single-Use Invites, Code Passes, 104-Template Project Workspace & 3-Pane Library', async () => {
    assert.ok(browser);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // 1. Login as Bootstrapped Admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#login-email', ADMIN_EMAIL);
    await page.fill('#login-password', ADMIN_PASS);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/app');
    await page.getByText('Research Library').waitFor();
    await page.screenshot({ path: 'screenshots/verification/05-app-dashboard.png' });

    // 2. Sysop Operator Console (/sysop)
    await page.goto(`${BASE_URL}/sysop`);
    await page.getByText('System Overview & KPIs').waitFor();

    await page.getByRole('button', { name: '5. Contracts & passes' }).click();
    const invitedEmail = `e2e-scholar-${Date.now()}@stanford.edu`;
    await page.fill('input[placeholder="scholar@stanford.edu"]', invitedEmail);
    await page.getByRole('button', { name: 'Issue Invitation' }).click();
    await page.getByText('Latest single-use invite path:').waitFor();

    await page.getByRole('button', { name: 'Generate Code Pass' }).click();
    await page.getByText(/CTX-/).first().waitFor();

    await page.getByRole('button', { name: '8. Audit log' }).click();
    await page.getByText('invitation.create').first().waitFor();
    await page.getByText('code_pass.issue').first().waitFor();
    await page.screenshot({ path: 'screenshots/verification/06-sysop-console.png' });

    // 3. Create Project from 104 Venue Templates
    await page.goto(`${BASE_URL}/app`);
    await page.getByRole('button', { name: '+ New project' }).first().click();
    await page.getByText(/Choose from 104 official journal, conference/i).waitFor();
    await page.fill('#new-project-name', 'NeurIPS 2026 Spectral Manuscript');
    await page.fill('#template-search', 'NeurIPS');
    await page.getByRole('button', { name: /NeurIPS/i }).first().click();
    await page.getByRole('button', { name: /Create project/i }).click();

    await page.waitForURL('**/app/projects/**');
    await page.getByText('NeurIPS 2026 Spectral Manuscript').first().waitFor();

    // Test Sidebar Tabs (Outline, Review, GitHub, Timeline) + Accessible PDF Preflight + Section PDF Export + Refactoring
    await page.getByRole('button', { name: 'Outline', exact: true }).click();
    await page.getByRole('button', { name: 'Review', exact: true }).click();
    await page.getByRole('button', { name: 'GitHub', exact: true }).click();
    await page.getByText('Git & GitHub Sync').waitFor();
    await page.getByRole('button', { name: 'Timeline', exact: true }).click();
    await page.getByRole('button', { name: 'Save version snapshot' }).click();
    await page.getByText('Restore').first().waitFor();

    // Accessible PDF Export & Preflight dialog
    await page.getByTestId('open-accessible-export-btn').click();
    await page.locator('[data-ui="accessible-pdf-export-dialog"]').waitFor();
    await page.getByTestId('confirm-accessible-export-btn').click();
    await page.getByText('PDF/UA-2').first().waitFor();
    await page.getByRole('button', { name: 'Done' }).click();

    // Section PDF Export dialog
    await page.getByTestId('open-section-export-btn').click();
    await page.locator('[data-ui="section-export-dialog"]').waitFor();
    await page.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: 'Share', exact: true }).click();
    await page.getByRole('button', { name: 'Create Share Link' }).click();
    await page.getByText(/Share link created/i).waitFor();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.screenshot({ path: 'screenshots/verification/07-project-workspace.png' });

    // 4. 3-Pane Research Library (/app/library) + Notebook + Explore Graph + BibTeX Import
    await page.goto(`${BASE_URL}/app/library`);
    await page.getByText('All references').waitFor();
    await page.getByRole('button', { name: 'From the web' }).click();
    await page.getByText('Attention Is All You Need').first().waitFor();
    await page.getByRole('button', { name: '+ Add to Library' }).first().click();

    await page.getByRole('button', { name: /PDF Reader/i }).click();
    await page.fill(
      'textarea[placeholder="Highlighted passage from PDF..."]',
      'We propose a new simple network architecture, the Transformer'
    );
    await page.fill(
      'textarea[placeholder="Research memo or sticky note..."]',
      'Cite this in Section 2 baseline comparison.'
    );
    await page.getByRole('button', { name: 'Save Note' }).click();
    await page.getByText('Cite this in Section 2 baseline comparison.').waitFor();

    await page.getByTestId('library-tab-notebook').click();
    await page.getByTestId('library-notebook-panel').waitFor();
    await page.getByTestId('library-tab-explore').click();
    await page.getByTestId('library-explore-panel').waitFor();

    await page.getByTestId('open-import-bibtex-btn').click();
    await page.getByTestId('import-bibtex-modal').waitFor();
    await page.getByTestId('confirm-import-bibtex-btn').click();
    await page.screenshot({ path: 'screenshots/verification/08-research-library.png' });

    // 5. Connected Local Agent Relay (/connect) & Account Settings (/app/settings/account)
    await page.goto(`${BASE_URL}/connect`);
    await page.getByText('Connected Local Agent Relay').waitFor();
    await page.getByTestId('create-agent-script-btn').click();
    await page.getByTestId('agent-prompt-box').waitFor();
    await page.getByTestId('confirm-agent-connection-btn').click();
    await page.getByTestId('disconnect-agent-btn').waitFor();

    await page.goto(`${BASE_URL}/app/settings/account`);
    await page.getByText('Account Preferences').waitFor();
    await page.getByRole('button', { name: 'Organizations' }).click();
    await page.getByText('Organizations & Lab Seats').waitFor();
    await page.getByRole('button', { name: 'API & Agent Connection' }).click();
    await page.getByText('API Connection & Connected Local Agent').waitFor();
    await page.screenshot({ path: 'screenshots/verification/09-account-settings.png' });

    await context.close();
  });
});
