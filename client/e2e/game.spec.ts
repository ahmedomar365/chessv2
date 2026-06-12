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
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'PLAY' })).toBeVisible({ timeout: 20_000 });
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
  await pageA.getByRole('button', { name: 'PLAY' }).click();
  await expect(pageA.getByText('Searching for an opponent')).toBeVisible({ timeout: 10_000 });
  await pageB.getByRole('button', { name: 'PLAY' }).click();

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

  // cooldown feedback: white immediately tries the same pawn again → shake
  await clickSquare(pageA, 4, 3, false);
  await clickSquare(pageA, 4, 4, false);
  await expect(pageA.locator('.piece-shake')).toBeVisible({ timeout: 2_000 });

  // white resigns (two-step confirm)
  await pageA.getByRole('button', { name: 'Resign' }).click();
  await pageA.getByRole('button', { name: 'Confirm resign' }).click();

  await expect(pageA.locator('.result-title')).toHaveText('DEFEAT', { timeout: 10_000 });
  await expect(pageB.locator('.result-title')).toHaveText('VICTORY', { timeout: 10_000 });

  // back to lobby
  await pageB.getByRole('button', { name: 'Back to lobby' }).click();
  await expect(pageB.getByRole('button', { name: 'PLAY' })).toBeVisible({ timeout: 10_000 });
});
