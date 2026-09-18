/**
 * 回報問題 — Footer 入口 + ReportIssueModal
 *
 * 📌 入口統一在全站 Footer（TAIGIE-252），後台不顯示。
 * 📌 後端 POST /issue_report 尚未上線，service 預設走 mock；
 *    為避免 VITE_ENABLE_REPORT_ISSUE_MOCK=false 時誤送到真實 API，這裡一律攔截該請求。
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { navigateAndWait, chooseCustomSelectOption } from '../../utils/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_FIXTURE = path.resolve(__dirname, '../../fixtures/test-file.pdf');

const modal = (page) => page.locator('.report-issue-modal');
const submit = (page) => modal(page).locator('.report-issue-submit');

test.describe('回報問題', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/issue_report', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{"message":"ok"}' })
        );
        await navigateAndWait(page, '/terms');
        await page.getByTestId('footer').getByRole('button', { name: '回報問題' }).click();
        await expect(modal(page)).toBeVisible();
    });

    test('必填欄位填完才能送出，送出後顯示成功', async ({ page }) => {
        await expect(submit(page)).toBeDisabled();

        await chooseCustomSelectOption(page, modal(page).locator('.report-issue-select-feature'), '台語俗諺語');
        await chooseCustomSelectOption(page, modal(page).locator('.report-issue-select-type'), '問題回報');

        // 選「問題回報」後才出現細項，且為必填
        const detailSelect = modal(page).locator('.report-issue-select-detail');
        await expect(detailSelect).toBeVisible();

        await modal(page).locator('#report-issue-title').fill('E2E 測試標題');
        await modal(page).locator('#report-issue-description').fill('E2E 測試描述');
        await expect(submit(page)).toBeDisabled();

        await detailSelect.locator('.custom-select-header').click();
        await page.locator('.custom-select-options .custom-select-option').first().click();
        await expect(submit(page)).toBeEnabled();

        await submit(page).click();
        await expect(page.locator('.toast-message')).toBeVisible();
        await expect(submit(page)).toHaveText('已送出!');
    });

    test('問題類別切回「其他」會隱藏並清空細項', async ({ page }) => {
        await chooseCustomSelectOption(page, modal(page).locator('.report-issue-select-feature'), '認證考試');
        await chooseCustomSelectOption(page, modal(page).locator('.report-issue-select-type'), '問題回報');
        await expect(modal(page).locator('.report-issue-select-detail')).toBeVisible();

        await chooseCustomSelectOption(page, modal(page).locator('.report-issue-select-type'), '其他');
        await expect(modal(page).locator('.report-issue-select-detail')).toHaveCount(0);

        // 「其他」不需細項：填完標題與描述即可送出
        await modal(page).locator('#report-issue-title').fill('E2E');
        await modal(page).locator('#report-issue-description').fill('E2E');
        await expect(submit(page)).toBeEnabled();
    });

    test('附件只接受 JPG／PNG', async ({ page }) => {
        await modal(page).locator('.report-issue-file-input').setInputFiles(PDF_FIXTURE);
        await expect(page.locator('.toast-message')).toContainText('僅限上傳 JPG 或 PNG 圖片檔');
        await expect(modal(page).locator('.report-issue-upload-button')).not.toHaveClass(/has-file/);
    });

    test('關閉後重新開啟，表單會重置', async ({ page }) => {
        await modal(page).locator('#report-issue-title').fill('殘留內容');
        await modal(page).getByRole('button', { name: '關閉' }).click();
        await expect(modal(page)).toHaveCount(0);

        await page.getByTestId('footer').getByRole('button', { name: '回報問題' }).click();
        await expect(modal(page).locator('#report-issue-title')).toHaveValue('');
    });
});
