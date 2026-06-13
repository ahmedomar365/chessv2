import { expect, test, type Browser, type Page } from '@playwright/test';

async function newPlayer(browser: Browser, testInfo: { project: { use: Record<string, unknown> } }) {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use as Record<
    string,
    never
  >;
  const ctx = await browser.newContext({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });
  return ctx.newPage();
}

async function register(page: Page, name: string) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Username' }).fill(name);
  await page.getByRole('textbox', { name: 'Password' }).fill('e2e_password');
  await page.getByRole('button', { name: 'ENTER' }).click();
  // dismiss the first-run tutorial overlay
  await page.getByRole('button', { name: 'Skip' }).click({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'PLAY', exact: true })).toBeVisible({ timeout: 20_000 });
}

test('challenges, spectating, and chat', async ({ browser }, testInfo) => {
  const runId = Date.now().toString(36);
  const pageA = await newPlayer(browser, testInfo);
  const pageB = await newPlayer(browser, testInfo);
  const pageC = await newPlayer(browser, testInfo);

  await register(pageA, `soa_${runId}`);
  await register(pageB, `sob_${runId}`);
  await register(pageC, `soc_${runId}`);

  // --- global chat (lives in its own lobby tab now)
  await pageA.getByRole('button', { name: 'Chat' }).click();
  await pageA.locator('.chat-input-row input').fill(`gl_${runId}`);
  await pageA.locator('.chat-input-row button').click();
  await pageB.getByRole('button', { name: 'Chat' }).click();
  await expect(pageB.locator('.chat-list')).toContainText(`gl_${runId}`, { timeout: 8_000 });
  await pageA.getByRole('button', { name: 'Arena' }).click();
  await pageB.getByRole('button', { name: 'Arena' }).click();

  // --- open challenge: A posts, B accepts
  await pageA.getByRole('button', { name: 'Post open challenge' }).click();
  await expect(pageB.getByText('Open challenges')).toBeVisible({ timeout: 8_000 });
  await pageB.getByRole('button', { name: 'Accept' }).first().click();
  await expect(pageA.locator('.board')).toBeVisible({ timeout: 15_000 });
  await expect(pageB.locator('.board')).toBeVisible({ timeout: 15_000 });

  // --- C spectates
  await expect(pageC.getByText('Live games')).toBeVisible({ timeout: 10_000 });
  await pageC.getByRole('button', { name: 'Watch' }).first().click();
  await expect(pageC.locator('.board')).toBeVisible({ timeout: 10_000 });
  await expect(pageC.getByRole('button', { name: 'Stop watching' })).toBeVisible();

  // players see the spectator count
  await expect(pageA.locator('.spec-count')).toBeVisible({ timeout: 8_000 });

  // --- in-game chat between players (clear the 2s chat throttle first)
  await pageA.waitForTimeout(2_500);
  await pageA.getByRole('button', { name: '💬' }).click();
  await pageA.locator('.chat-drawer input').fill(`ig_${runId}`);
  await pageA.locator('.chat-drawer button[type="submit"]').click();
  await pageB.getByRole('button', { name: '💬' }).click();
  await expect(pageB.locator('.chat-drawer .chat-list')).toContainText(`ig_${runId}`, { timeout: 8_000 });

  // --- spectator chat is its own channel: C writes, B (player) must NOT see it
  await pageC.getByRole('button', { name: '💬' }).click();
  await pageC.locator('.chat-drawer input').fill(`sp_${runId}`);
  await pageC.locator('.chat-drawer button[type="submit"]').click();
  await expect(pageC.locator('.chat-drawer .chat-list')).toContainText(`sp_${runId}`, { timeout: 8_000 });
  await pageB.waitForTimeout(1_500);
  await expect(pageB.locator('.chat-drawer .chat-list')).not.toContainText(`sp_${runId}`);

  // --- finish: A resigns; spectator sees the winner banner
  await pageA.getByRole('button', { name: 'Resign' }).click();
  await pageA.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(pageC.locator('.result-title')).toContainText('WINS', { timeout: 10_000 });
  await expect(pageB.locator('.result-title')).toHaveText('VICTORY', { timeout: 10_000 });
});
