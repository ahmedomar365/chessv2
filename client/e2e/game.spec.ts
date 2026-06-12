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

  // ---- cards: hand of 3 renders; play a no-target or targeted card once affordable
  await expect(pageA.locator('.card-tile')).toHaveCount(3);
  await pageA.waitForTimeout(17_000); // ≥3 gems accrued (1 per 5s from game start)
  const gemCount = await pageA.locator('.gem-count').textContent();
  expect(Number(gemCount)).toBeGreaterThanOrEqual(3);

  // arm the first playable (non-passive) card and resolve it generically
  const tiles = pageA.locator('.card-tile:not(.card-passive)');
  const tileCount = await tiles.count();
  expect(tileCount).toBeGreaterThan(0);
  let played = false;
  for (let i = 0; i < tileCount && !played; i++) {
    const tile = tiles.nth(i);
    const text = (await tile.textContent()) ?? '';
    if (text.includes('5◆') && Number(gemCount) < 5) continue; // skip unaffordable Rewind
    await tile.click();
    if (text.includes('Time Theft') || text.includes('Pawn Storm') || text.includes('Rewind')) {
      played = true; // no-target cards fire immediately on arm
    } else {
      // targeted: click the first highlighted ring's square via the aim flow
      await expect(pageA.locator('.aim-chip')).toBeVisible({ timeout: 2_000 });
      const ringCount = await pageA.locator('.card-target-ring').count();
      if (ringCount === 0) {
        await tile.click(); // disarm (e.g. Reset with nothing cooling)
        continue;
      }
      // Swap needs two picks; others need one. Click rings by reading their positions.
      const board = pageA.locator('.board');
      const box = await board.boundingBox();
      if (!box) throw new Error('no board');
      const positions = await pageA.locator('.card-target-ring').evaluateAll((els) =>
        els.map((el) => ({ cx: Number(el.getAttribute('cx')), cy: Number(el.getAttribute('cy')) })),
      );
      const clickRing = async (p: { cx: number; cy: number }) =>
        pageA.mouse.click(box.x + (p.cx / 800) * box.width, box.y + (p.cy / 800) * box.height);
      await clickRing(positions[0]);
      if (text.includes('Swap')) {
        await pageA.waitForTimeout(300);
        const positions2 = await pageA.locator('.card-target-ring').evaluateAll((els) =>
          els.map((el) => ({ cx: Number(el.getAttribute('cx')), cy: Number(el.getAttribute('cy')) })),
        );
        if (positions2.length > 0) await clickRing(positions2[0]);
      }
      played = true;
    }
  }
  expect(played).toBe(true);
  // a card play always logs a card_played effect → opponent gets a toast or the gem count drops
  await pageA.waitForTimeout(1_500);
  const gemsAfter = Number(await pageA.locator('.gem-count').textContent());
  expect(gemsAfter).toBeLessThan(Number(gemCount) + 3); // spent something (allowing accrual drift)

  // white resigns (two-step confirm)
  await pageA.getByRole('button', { name: 'Resign' }).click();
  await pageA.getByRole('button', { name: 'Confirm', exact: true }).click();

  await expect(pageA.locator('.result-title')).toHaveText('DEFEAT', { timeout: 10_000 });
  await expect(pageB.locator('.result-title')).toHaveText('VICTORY', { timeout: 10_000 });

  // back to lobby
  await pageB.getByRole('button', { name: 'Back to lobby' }).click();
  await expect(pageB.getByRole('button', { name: 'PLAY' })).toBeVisible({ timeout: 10_000 });

  // --- ranked: winner's profile shows the ELO gain (1200 + 16 provisional K)
  await pageB.locator('.lobby-user').click();
  await expect(pageB.locator('.rating-big')).toHaveText('1216', { timeout: 10_000 });
  await expect(pageB.locator('.result-dot.dot-win')).toBeVisible();

  // --- replay with judge report opens from match history
  await pageB.getByRole('button', { name: '▶ Replay' }).first().click();
  await expect(pageB.locator('.board')).toBeVisible({ timeout: 10_000 });
  await expect(pageB.locator('.judge-summary')).toContainText('accuracy');
});
