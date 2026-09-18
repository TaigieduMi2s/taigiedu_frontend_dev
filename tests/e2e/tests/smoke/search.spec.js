/**
 * 搜尋功能測試
 *
 * 📌 Smoke Test：驗證首頁搜尋功能正常運作
 * 確保使用者能輸入關鍵字並成功跳轉到搜尋結果頁
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait, waitForStableUI } from '../../utils/helpers.js';
import { testData } from '../../fixtures/test-data.js';

test.describe('搜尋功能', () => {
    test.beforeEach(async ({ page }) => {
        // 首頁送出搜尋時會先 POST /top_keywords { text } 記錄搜尋統計，完成後才導頁。
        // 攔截這一支：(1) 避免測試關鍵字灌進正式的熱門關鍵字統計；(2) 後端忙碌時不會卡住導頁。
        // 載入熱門標籤用的 /top_keywords（body 沒有 text）照常打真實 API。
        await page.route('**/top_keywords', (route) => {
            const body = route.request().postDataJSON?.() ?? null;
            if (body && typeof body.text === 'string') {
                return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
            }
            return route.continue();
        });
        await navigateAndWait(page, '/');
    });

    test('輸入關鍵字並搜尋跳轉成功', async ({ page }) => {
        const searchInput = page.getByTestId('home-search-input');
        const searchQuery = testData.searchQueries.valid;

        // 輸入搜尋關鍵字
        await searchInput.fill(searchQuery);
        await expect(searchInput).toHaveValue(searchQuery);

        // 提交搜尋（按 Enter 或點擊搜尋圖示）
        await searchInput.press('Enter');

        // 驗證跳轉到搜尋結果頁
        await expect(page).toHaveURL(new RegExp(`/search\\?query=${encodeURIComponent(searchQuery)}`));
    });

    test('點擊搜尋圖示觸發搜尋', async ({ page }) => {
        const searchInput = page.getByTestId('home-search-input');
        const searchButton = page.getByTestId('home-search-button');
        const searchQuery = '母語';

        // 輸入關鍵字並等待
        await searchInput.fill(searchQuery);
        await expect(searchInput).toHaveValue(searchQuery);

        // 點擊搜尋圖示
        await searchButton.click();

        // 驗證跳轉（使用更寬鬆的匹配）
        await expect(page).toHaveURL(/\/search.*query=/);
    });

    test('點擊熱門關鍵字標籤跳轉搜尋', async ({ page }) => {
        await waitForStableUI(page);

        // 等待標籤按鈕載入
        const tagButton = page.locator('.tag-buttons .button').first();

        // 等待至少有一個標籤可點擊
        await expect(tagButton).toBeVisible({ timeout: 15000 });

        // 取得標籤文字
        const tagText = await tagButton.textContent();

        // 點擊標籤
        await tagButton.click();

        // 驗證跳轉到搜尋頁面，query 參數應包含標籤文字
        await expect(page).toHaveURL(new RegExp(`/search\\?query=${encodeURIComponent(tagText.trim())}`));
    });

    test('空白搜尋不觸發跳轉', async ({ page }) => {
        const searchInput = page.getByTestId('home-search-input');

        // 確保輸入框為空
        await searchInput.fill('');

        // 嘗試按 Enter
        await searchInput.press('Enter');

        // 應該仍然在首頁
        await expect(page).toHaveURL('/');
    });

    test('搜尋結果頁面正確顯示', async ({ page }) => {
        // 直接導航到搜尋結果頁（此頁會持續打 API，不等 networkidle）
        await navigateAndWait(page, `/search?query=${encodeURIComponent('台語')}`, { waitForIdle: false });

        await expect(page).toHaveURL(/\/search/);

        // 搜尋列應帶入網址上的關鍵字
        await expect(page.locator('.search-bar .search-input')).toHaveValue('台語');

        // Sidebar 應該仍然顯示
        await expect(page.getByTestId('sidebar')).toBeVisible();
    });
});
