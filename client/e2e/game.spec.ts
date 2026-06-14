import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Two-player E2E smoke against the live SpacetimeDB module:
 * register two fresh accounts, queue both, play a move, verify it syncs,
 * verify cooldown feedback, resign, verify result modals on both sides.
 */

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

/** Click square (file 0-7, rank 0-7) given the player's orientation. */
async function clickSquare(page: Page, file: number, rank: number, flipped: boolean) {
  const board = page.locator('.board');
  const box = await board.boundingBox();
  if (!box) throw new Error('board not visible');
  const col = flipped ? 7 - file : file;
  const row = flipped ? rank : 7 - rank;
  await page.mouse.click(box.x + (col + 0.5) * (box.width / 8), box.y + (row + 0.5) * (box.height / 8));
}

test('full two-player game flow', async ({ browser }, testInfo) => {
  const runId = Date.now().toString(36);
  const pageA = await newPlayer(browser, testInfo);
  const pageB = await newPlayer(browser, testInfo);

  await register(pageA, `e2a_${runId}`);
  await register(pageB, `e2b_${runId}`);

  // A queues first → A is white
  await pageA.getByRole('button', { name: 'PLAY', exact: true }).click();
  await expect(pageA.locator('.btn-searching')).toBeVisible({ timeout: 10_000 });
  await pageB.getByRole('button', { name: 'PLAY', exact: true }).click();

  // both land on boards
  await expect(pageA.locator('.board')).toBeVisible({ timeout: 15_000 });
  await expect(pageB.locator('.board')).toBeVisible({ timeout: 15_000 });

  // wait out the 3s countdown
  await pageA.waitForTimeout(3500);

  // white plays e2 → e4
  await clickSquare(pageA, 4, 1, false);
  await clickSquare(pageA, 4, 3, false);

  // the pawn appears on e4 for BLACK (flipped view: x=(7-4)*100, y=3*100)
  await expect(pageB.locator('g.piece-slot[style*="translate(300px, 300px)"]')).toBeVisible({
    timeout: 5_000,
  });

  // cooldown: moving the same pawn again queues a PREMOVE (lichess-style)
  // which auto-fires the moment the 3s pawn cooldown ends → pawn lands on e5
  await clickSquare(pageA, 4, 3, false);
  await clickSquare(pageA, 4, 4, false);
  await expect(pageA.locator('.sq-premove').first()).toBeVisible({ timeout: 2_000 });
  await expect(pageA.locator('g.piece-slot[style*="translate(400px, 300px)"]')).toBeVisible({
    timeout: 7_000,
  });

  // ---- spells are disabled: no card hand or gem meter should render
  await expect(pageA.locator('.card-tile')).toHaveCount(0);
  await expect(pageA.locator('.gem-meter')).toHaveCount(0);

  // white resigns (two-step confirm)
  await pageA.getByRole('button', { name: 'Resign' }).click();
  await pageA.getByRole('button', { name: 'Confirm', exact: true }).click();

  await expect(pageA.locator('.result-title')).toHaveText('DEFEAT', { timeout: 10_000 });
  await expect(pageB.locator('.result-title')).toHaveText('VICTORY', { timeout: 10_000 });

  // back to lobby
  await pageB.getByRole('button', { name: 'Back to lobby' }).click();
  await expect(pageB.getByRole('button', { name: 'PLAY', exact: true })).toBeVisible({ timeout: 10_000 });

  // --- ranked: winner's profile shows the ELO gain (1200 + 16 provisional K)
  await pageB.locator('.lobby-user').click();
  await expect(pageB.locator('.rating-big')).toHaveText('1216', { timeout: 10_000 });
  await expect(pageB.locator('.result-dot.dot-win')).toBeVisible();

  // --- replay with judge report opens from match history
  await pageB.getByRole('button', { name: '▶ Replay' }).first().click();
  await expect(pageB.locator('.board')).toBeVisible({ timeout: 10_000 });
  await expect(pageB.locator('.judge-summary')).toContainText('accuracy');
});
