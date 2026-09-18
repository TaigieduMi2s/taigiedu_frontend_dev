/**
 * 台語文化（test）— /culture-test
 *
 * 📌 資料來自 services/cultureTestMockApi.js 的假資料，不打後端，結果可預期。
 * 📌 驗證重點（見 docs/project_architecture.md §3.1）：
 *   - 「全部」：推薦影音（最多 4 筆）＋推薦文本（最多 5 筆），不分頁、沒有分類下拉
 *   - 類型下拉切到影音／文本後才出現分類下拉；切換類型會清空分類、保留關鍵字
 *   - 分類／關鍵字／頁碼／類型皆寫在 query string，重新整理後維持同一個畫面
 */

import { test, expect } from '@playwright/test';
import { gotoFeaturePage, chooseCustomSelectOption } from '../../utils/helpers.js';

const categoryTrigger = (page) => page.locator('.ctp-dropdown-header');
const typeSelect = (page) => page.locator('.ctp-type-select');
const listSummary = (page) => page.locator('.ctp-list-summary');

test.describe('台語文化（test）', () => {
    test('預設「全部」顯示推薦影音與推薦文本預覽', async ({ page }) => {
        await gotoFeaturePage(page, test, '/culture-test');

        const videoBlock = page.locator('.ctp-mixed-block', { hasText: '推薦影音' });
        const textBlock = page.locator('.ctp-mixed-block', { hasText: '推薦文本' });
        await expect(videoBlock).toBeVisible();
        await expect(textBlock).toBeVisible();

        await expect(videoBlock.locator('.ctp-card')).toHaveCount(4);
        await expect(textBlock.locator('.ctp-text-result')).toHaveCount(5);

        // 兩區都有「共 N 筆」與「查看全部」
        await expect(videoBlock.locator('.ctp-category-count')).toHaveText(/共 \d+ 筆/);
        await expect(videoBlock.getByRole('button', { name: /查看全部/ })).toBeVisible();
        await expect(textBlock.getByRole('button', { name: /查看全部/ })).toBeVisible();

        // 「全部」沒有分類下拉，也沒有分頁
        await expect(categoryTrigger(page)).toHaveCount(0);
        await expect(page.locator('.pagination')).toHaveCount(0);
    });

    test('「推薦影音」的查看全部會切到影音類型並出現分類下拉', async ({ page }) => {
        await gotoFeaturePage(page, test, '/culture-test');

        await page.locator('.ctp-mixed-block', { hasText: '推薦影音' })
            .getByRole('button', { name: /查看全部/ }).click();

        await expect(page).toHaveURL(/[?&]type=video/);
        await expect(typeSelect(page).locator('.custom-select-value')).toHaveText('影音');
        await expect(categoryTrigger(page)).toBeVisible();

        // 未篩選 → 依第一層分區預覽，每區一列 4 筆
        const firstSection = page.locator('.ctp-section').first();
        await expect(firstSection.locator('.ctp-category-title')).toBeVisible();
        expect(await firstSection.locator('.ctp-card').count()).toBeLessThanOrEqual(4);
    });

    test('選擇第一層分類後攤平成完整列表，重新整理仍保留條件', async ({ page }) => {
        await gotoFeaturePage(page, test, '/culture-test?type=video');

        await categoryTrigger(page).click();
        const firstCategory = page.locator('.ctp-dropdown-item.with-submenu').first();
        const categoryName = (await firstCategory.locator('.ctp-dropdown-label').textContent()).trim();
        await firstCategory.click();

        // 點第一層＝全選其第二層，寫成 cat= 或 sub=第一層:第二層
        await expect(page).toHaveURL(new RegExp(`[?&](cat|sub)=${encodeURIComponent(categoryName)}`));
        await expect(listSummary(page)).toHaveText(/共 \d+ 筆｜第 1／\d+ 頁/);
        await expect(page.getByRole('button', { name: '返回全部類別' })).toBeVisible();

        const summaryBefore = await listSummary(page).textContent();
        await page.reload();
        await expect(listSummary(page)).toHaveText(summaryBefore);
        await expect(typeSelect(page).locator('.custom-select-value')).toHaveText('影音');

        // 返回全部類別 → 清空分類，回到分區預覽
        await page.getByRole('button', { name: '返回全部類別' }).click();
        await expect(page).not.toHaveURL(/[?&](cat|sub)=/);
        await expect(page.locator('.ctp-section-header').first()).toBeVisible();
    });

    test('分頁寫入網址（第 1 頁不寫），重新整理停在同一頁', async ({ page }) => {
        await gotoFeaturePage(page, test, '/culture-test?type=video&q=%E6%88%B2');

        const pagination = page.locator('.pagination');
        await expect(pagination).toBeVisible();
        await pagination.locator('.page-button', { hasText: /^2$/ }).click();

        await expect(page).toHaveURL(/[?&]page=2/);
        await expect(listSummary(page)).toContainText('第 2／');

        await page.reload();
        await expect(listSummary(page)).toContainText('第 2／');
    });

    test('關鍵字按 Enter 才送出並寫入網址', async ({ page }) => {
        await gotoFeaturePage(page, test, '/culture-test');

        const input = page.locator('.ctp-search-input');
        await input.fill('歌仔戲');
        // 尚未送出前網址不變
        await expect(page).not.toHaveURL(/[?&]q=/);

        await input.press('Enter');
        await expect(page).toHaveURL(new RegExp(`[?&]q=${encodeURIComponent('歌仔戲')}`));

        // 關鍵字在文本結果中以 <mark> 標示
        await expect(page.locator('.ctp-text-results mark').first()).toHaveText('歌仔戲');

        // 重新整理後輸入框同步回網址上的關鍵字
        await page.reload();
        await expect(page.locator('.ctp-search-input')).toHaveValue('歌仔戲');
    });

    test('切換類型會清空分類但保留關鍵字', async ({ page }) => {
        const sub = encodeURIComponent('戲曲:歌仔戲');
        await gotoFeaturePage(page, test, `/culture-test?type=video&sub=${sub}&q=${encodeURIComponent('歌仔戲')}`);

        await expect(page.getByRole('button', { name: '返回全部類別' })).toBeVisible();

        await chooseCustomSelectOption(page, typeSelect(page), '文本');

        await expect(page).toHaveURL(/[?&]type=text/);
        await expect(page).not.toHaveURL(/[?&]sub=/);
        await expect(page).toHaveURL(new RegExp(`[?&]q=${encodeURIComponent('歌仔戲')}`));
        await expect(page.locator('.ctp-search-input')).toHaveValue('歌仔戲');
        await expect(page.getByRole('button', { name: '返回全部類別' })).toHaveCount(0);
    });

    test('「全部」會忽略網址上殘留的分類參數', async ({ page }) => {
        await gotoFeaturePage(page, test, `/culture-test?cat=${encodeURIComponent('戲曲')}`);

        await expect(page.locator('.ctp-mixed-block', { hasText: '推薦影音' })).toBeVisible();
        await expect(categoryTrigger(page)).toHaveCount(0);
    });

    test('查無資料時顯示空狀態', async ({ page }) => {
        await gotoFeaturePage(page, test, '/culture-test?q=zzzz-no-such-keyword');
        await expect(page.locator('.ctp-empty')).toHaveText('沒有符合條件的資料');
    });
});
