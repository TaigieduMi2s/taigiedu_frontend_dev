/**
 * 台語教學資源共享平台 — /resource（未登入）
 *
 * 📌 登入後的上傳流程在 tests/regression/resource/upload.spec.js（依賴 auth-setup）。
 * 📌 篩選列已統一為 sticky `.page-filter-header`，階段改用共用 CustomSelect（2026-08）。
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait, chooseCustomSelectOption } from '../../utils/helpers.js';

test.describe('資源共享平台（未登入）', () => {
    test.beforeEach(async ({ page }) => {
        await navigateAndWait(page, '/resource', { waitForIdle: false });
    });

    test('篩選列顯示階段、版本、內容類型、搜尋與上傳按鈕', async ({ page }) => {
        const header = page.locator('.resource-header.page-filter-header');
        await expect(header).toBeVisible();

        await expect(header.locator('.grade-select .custom-select-value')).toHaveText('階段');
        await expect(header.locator('.res-search-input')).toBeVisible();
        await expect(header.getByRole('button', { name: '上傳我的資源' })).toBeVisible();

        // 未選階段前，版本多選為停用狀態
        await expect(header.locator('.multiselect-wrapper').first()).toHaveClass(/disabled/);
    });

    test('選擇階段後版本多選啟用', async ({ page }) => {
        const header = page.locator('.resource-header');
        await chooseCustomSelectOption(page, header.locator('.grade-select'), '高中');

        await expect(header.locator('.grade-select .custom-select-value')).toHaveText('高中');
        await expect(header.locator('.multiselect-wrapper').first()).toHaveClass(/enabled/);
    });

    test('未登入點「上傳我的資源」會要求登入', async ({ page }) => {
        await page.getByRole('button', { name: '上傳我的資源' }).click();
        await expect(page.locator('.login-unified-modal, .login-modal-container')).toBeVisible();
    });
});
