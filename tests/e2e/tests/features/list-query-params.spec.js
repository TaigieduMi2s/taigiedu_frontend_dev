/**
 * 分類瀏覽頁的 query string（utils/listFilterParams.js）
 *
 * 📌 媒體與社群資源、認證考試的關鍵字／分類／頁碼一律以網址為準，
 *    重新整理、上一頁、分享網址都要回到同一個畫面（2026-09 修正）。
 * 📌 這兩頁的資料來自真實後端 API；API 無法連線時會略過。
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait } from '../../utils/helpers.js';

const PAGES = [
    { name: '媒體與社群資源', path: '/socialmedia', prefix: 'social' },
    { name: '認證考試', path: '/exam', prefix: 'exam' },
];

for (const { name, path, prefix } of PAGES) {
    test.describe(`${name}（${path}）`, () => {
        test.beforeEach(async ({ page }) => {
            await navigateAndWait(page, path, { waitForIdle: false });
            const input = page.locator(`.${prefix}-search-input`);
            const loaded = await input.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
            test.skip(!loaded, `${name} 的資料未能載入（後端 API 無法連線？）`);
        });

        test('邊打邊篩：關鍵字以 replace 寫入網址，不新增歷史紀錄', async ({ page }) => {
            const historyBefore = await page.evaluate(() => history.length);

            await page.locator(`.${prefix}-search-input`).fill('台語');
            await expect(page).toHaveURL(new RegExp(`[?&]q=${encodeURIComponent('台語')}`));
            await expect(page.locator(`.${prefix}-list-summary`)).toHaveText(/共 \d+ 筆｜第 \d+／\d+ 頁/);

            expect(await page.evaluate(() => history.length)).toBe(historyBefore);
        });

        test('重新整理後保留關鍵字與搜尋結果', async ({ page }) => {
            await page.locator(`.${prefix}-search-input`).fill('台語');
            const summary = await page.locator(`.${prefix}-list-summary`).textContent();

            await page.reload();
            await expect(page.locator(`.${prefix}-search-input`)).toHaveValue('台語', { timeout: 20000 });
            await expect(page.locator(`.${prefix}-list-summary`)).toHaveText(summary);
        });

        test('查無資料時顯示空狀態', async ({ page }) => {
            await page.locator(`.${prefix}-search-input`).fill('zzzz-no-such-keyword');
            await expect(page.locator(`.${prefix}-empty`)).toHaveText('沒有符合條件的資料');
        });
    });
}
