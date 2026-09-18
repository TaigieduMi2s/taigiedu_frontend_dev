/**
 * 職業台語（test）— /occupation-test、/occupation-test/:id
 *
 * 📌 資料來自 services/occupationTestMockApi.js：醫療長照／行業台語各 18 筆（共 36 筆），每頁 12 筆。
 * 📌 驗證重點（見 docs/project_architecture.md §3.1）：
 *   - 單一分類下拉 + 關鍵字；卡片不顯示點讚數／下載數、不顯示標籤、不顯示總筆數
 *   - 點卡片站內導頁（不開新分頁）到詳細頁，詳細頁可返回列表
 */

import { test, expect } from '@playwright/test';
import { gotoFeaturePage, chooseCustomSelectOption } from '../../utils/helpers.js';

const cards = (page) => page.locator('.otp-grid .cc-card');

test.describe('職業台語（test）列表', () => {
    test.beforeEach(async ({ page }) => {
        await gotoFeaturePage(page, test, '/occupation-test');
        await expect(cards(page).first()).toBeVisible();
    });

    test('第一頁顯示 12 張卡片與分頁，卡片不含點讚／下載數與標籤', async ({ page }) => {
        await expect(cards(page)).toHaveCount(12);
        await expect(page.locator('.pagination')).toBeVisible();

        const first = cards(page).first();
        await expect(first.locator('.cc-title')).not.toBeEmpty();
        await expect(first.locator('.cc-file-type')).toHaveText(/^(pdf|ppt|doc)$/);
        await expect(first.locator('.cc-uploader')).toBeVisible();
        await expect(page.locator('.otp-grid .cc-stats')).toHaveCount(0);
        await expect(page.locator('.otp-grid .cc-tags')).toHaveCount(0);
    });

    test('選擇分類後只剩該分類（18 筆 → 第二頁 6 筆）', async ({ page }) => {
        await chooseCustomSelectOption(page, page.locator('.otp-category-select'), '醫療長照');

        await expect(cards(page)).toHaveCount(12);
        await page.locator('.pagination .page-button', { hasText: /^2$/ }).click();
        await expect(cards(page)).toHaveCount(6);

        // 選「全部」等同清空條件
        await chooseCustomSelectOption(page, page.locator('.otp-category-select'), '全部');
        await expect(cards(page)).toHaveCount(12);
        await expect(page.locator('.pagination .page-button', { hasText: /^3$/ })).toBeVisible();
    });

    test('關鍵字搜尋，查無資料顯示空狀態', async ({ page }) => {
        const input = page.locator('.otp-search-input');

        await input.fill('看診對話');
        await input.press('Enter');
        await expect(cards(page).first().locator('.cc-title')).toContainText('看診對話');

        await input.fill('zzzz-no-such-keyword');
        await input.press('Enter');
        await expect(page.locator('.otp-empty')).toHaveText('沒有找到符合條件的資源');
    });

    test('點卡片在站內開啟詳細頁，並可返回列表', async ({ page, context }) => {
        const title = (await cards(page).first().locator('.cc-title').textContent()).trim();

        const pagesBefore = context.pages().length;
        await cards(page).first().click();

        await expect(page).toHaveURL(/\/occupation-test\/\d+$/);
        expect(context.pages().length).toBe(pagesBefore); // 不另開分頁
        await expect(page.locator('.otd-title')).toHaveText(title);

        await page.getByRole('button', { name: /返回職業台語列表/ }).click();
        await expect(page).toHaveURL('/occupation-test');
    });
});

test.describe('職業台語（test）詳細頁', () => {
    test('顯示標題、預覽與「閱讀全部」；尚無檔案時提示錯誤', async ({ page }) => {
        await gotoFeaturePage(page, test, '/occupation-test/1');

        await expect(page.locator('.otd-title')).not.toBeEmpty();
        await expect(page.locator('.otd-preview')).toBeVisible();
        // 詳細頁不放點讚、下載按鈕
        await expect(page.getByRole('button', { name: /下載資源|點讚資源/ })).toHaveCount(0);

        // mock 資料沒有 fileUrl → 顯示錯誤 toast、不離開本頁
        await page.locator('.otd-bottom-fixed').click();
        await expect(page.locator('.toast-message')).toContainText('檔案連結不可用');
        await expect(page).toHaveURL('/occupation-test/1');
    });

    test('不存在的 id 顯示返回列表按鈕', async ({ page }) => {
        await gotoFeaturePage(page, test, '/occupation-test/99999');
        await expect(page.locator('.otd-empty')).toBeVisible();
        await page.locator('.otd-empty').getByRole('button', { name: /返回職業台語列表/ }).click();
        await expect(page).toHaveURL('/occupation-test');
    });
});
