/**
 * 台語地名與文化 — /placename-culture
 *
 * 📌 資料來自 services/placenameCultureMockApi.js（臺南市 37 區）。
 * 📌 兩層導覽以 query string 切換：無參數為臺南全圖，?district=安平區 為單一行政區。
 */

import { test, expect } from '@playwright/test';
import { gotoFeaturePage } from '../../utils/helpers.js';

test.describe('台語地名與文化', () => {
    test('全圖：滑過行政區顯示簡介，點擊進入該區介紹', async ({ page }) => {
        await gotoFeaturePage(page, test, '/placename-culture');

        await expect(page.locator('.pc-intro-title')).toBeVisible();
        const anping = page.locator('.pc-overview-map [role="button"][aria-label="安平區"]');
        await expect(anping).toBeVisible();

        await anping.hover();
        await expect(page.locator('.pc-brief-name')).toHaveText('安平區');
        await expect(page.locator('.pc-brief-romaji')).toHaveText('An-pîng-khu');

        await anping.click();
        await expect(page).toHaveURL(new RegExp(`district=${encodeURIComponent('安平區')}`));
        await expect(page.locator('.pc-detail-name')).toHaveText('安平區');
    });

    test('單一行政區：顯示古地名與里舊名，點小地圖回到全圖', async ({ page }) => {
        await gotoFeaturePage(page, test, `/placename-culture?district=${encodeURIComponent('安平區')}`);

        await expect(page.locator('.pc-detail-name')).toHaveText('安平區');
        await expect(page.locator('.pc-detail-oldname')).toHaveText('古地名：大員');
        await expect(page.locator('.pc-oldnames-title')).toBeVisible();

        await page.getByRole('button', { name: '回到臺南地圖' }).click();
        await expect(page).not.toHaveURL(/district=/);
        await expect(page.locator('.pc-intro-title')).toBeVisible();
    });

    test('隨機探索會進入某個行政區', async ({ page }) => {
        await gotoFeaturePage(page, test, '/placename-culture');

        await page.locator('.pc-random-btn').click();
        await expect(page).toHaveURL(/district=/);
        await expect(page.locator('.pc-detail-name')).not.toBeEmpty();
    });

    test('網址帶入不存在的行政區時顯示錯誤訊息，不渲染介紹', async ({ page }) => {
        await gotoFeaturePage(page, test, `/placename-culture?district=${encodeURIComponent('不存在區')}`);
        // mock 對未知行政區會 reject，頁面顯示通用錯誤訊息
        await expect(page.locator('.pc-msg-error')).toBeVisible();
        await expect(page.locator('.pc-detail-name')).toHaveCount(0);
    });
});
