/**
 * 親戚計算機 — /relative-calculator
 *
 * 📌 稱謂資料來自 public/data/relatives3.json（前端靜態檔），計算不打 API。
 * 📌 由 VITE_ENABLE_RELATIVE_CALCULATOR_FEATURE 控制，正式站關閉（TAIGIE-264）。
 */

import { test, expect } from '@playwright/test';
import { gotoFeaturePage } from '../../utils/helpers.js';

const btn = (page, label) => page.locator('.rc-grid').getByRole('button', { name: label, exact: true });

test.describe('親戚計算機', () => {
    test.beforeEach(async ({ page }) => {
        await gotoFeaturePage(page, test, '/relative-calculator');
        await expect(page.locator('.rc-calc-card')).toBeVisible();
    });

    test('爸爸的媽媽 ＝ 阿媽', async ({ page }) => {
        await btn(page, '父').click();
        await btn(page, '的').click();
        await btn(page, '母').click();

        await expect(page.locator('.rc-display-chain')).toContainText('爸爸 的 媽媽');
        await btn(page, '＝').click();

        const result = page.locator('.rc-result-card');
        await expect(result.locator('.rc-result-zh')).toHaveText('祖母、奶奶');
        await expect(result.locator('.rc-result-alt')).toHaveText('阿媽');
    });

    test('按鈕依輸入狀態啟用／停用', async ({ page }) => {
        // 尚未輸入：「的」與「＝」不可按
        await expect(btn(page, '的')).toBeDisabled();
        await expect(btn(page, '＝')).toBeDisabled();

        await btn(page, '父').click();
        await expect(btn(page, '的')).toBeEnabled();
        await expect(btn(page, '＝')).toBeEnabled();

        // 以「的」結尾時不能計算
        await btn(page, '的').click();
        await expect(btn(page, '＝')).toBeDisabled();
    });

    test('清除後回到初始狀態', async ({ page }) => {
        await btn(page, '父').click();
        await btn(page, '＝').click();
        await expect(page.locator('.rc-result-card')).toBeVisible();

        await page.locator('.rc-btn-clear').click();
        await expect(page.locator('.rc-result-card')).toHaveCount(0);
        await expect(page.locator('.rc-display-chain')).toContainText('請選擇關係');
    });
});
