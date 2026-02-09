/**
 * 首頁渲染關鍵元素測試
 *
 * 📌 Smoke Test：驗證首頁基本 UI 元素正確渲染
 * 這是最基本的健康檢查，確保應用程式能正常啟動並顯示核心內容
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait, waitForStableUI } from '../../utils/helpers.js';
import { testData } from '../../fixtures/test-data.js';

test.describe('首頁關鍵元素渲染', () => {
    test.beforeEach(async ({ page }) => {
        await navigateAndWait(page, '/');
    });

    test('頁面載入成功且顯示標題', async ({ page }) => {
        // 驗證頁面能正常載入
        await expect(page).toHaveURL('/');

        // 驗證 HTML title 包含網站名稱（根據實際 index.html 調整）
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
    });

    test('Header Logo 顯示且可點擊', async ({ page }) => {
        // 使用 data-testid（已添加到元件）
        const header = page.getByTestId('header');
        await expect(header).toBeVisible();

        const logo = page.getByTestId('header-logo');
        await expect(logo).toBeVisible();

        // Logo 應該是可點擊的連結
        const logoLink = page.locator('header.header a').first();
        await expect(logoLink).toHaveAttribute('href', '/');
    });

    test('Sidebar 導航選單顯示', async ({ page }) => {
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toBeVisible();

        // 驗證選單項目數量
        const menuItems = page.locator('.sidebar .menu-item');
        const count = await menuItems.count();
        expect(count).toBeGreaterThanOrEqual(8); // 至少有 8 個主選單項目
    });

    test('搜尋欄位顯示且可互動', async ({ page }) => {
        // 使用 data-testid
        const searchInput = page.getByTestId('home-search-input');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();

        // 可以輸入文字
        await searchInput.fill('測試搜尋');
        await expect(searchInput).toHaveValue('測試搜尋');
    });

    test('Hero Section 顯示', async ({ page }) => {
        const heroSection = page.getByTestId('home-hero-section');
        await expect(heroSection).toBeVisible();

        // Hero 內應有歡迎文字
        const heroText = page.locator('.hero-text');
        await expect(heroText).toBeVisible();
        await expect(heroText).toContainText('歡迎來到');
    });

    test('首頁四個內容區塊顯示', async ({ page }) => {
        await waitForStableUI(page);

        // 驗證 Grid 區塊存在
        const gridContainer = page.locator('.grid-container');
        await expect(gridContainer).toBeVisible();

        // 驗證四個區塊標題
        for (const sectionTitle of testData.homePageSections) {
            const section = page.locator('.section-title', { hasText: sectionTitle });
            await expect(section).toBeVisible();
        }
    });

    test('Footer 顯示', async ({ page }) => {
        const footer = page.getByTestId('footer');
        await expect(footer).toBeVisible();
    });

    test('關鍵字標籤按鈕顯示', async ({ page }) => {
        await waitForStableUI(page);

        // 等待關鍵字載入（可能需要 API 呼叫）
        const tagButtons = page.locator('.tag-buttons .button');

        // 等待至少有一個按鈕出現，或顯示載入中
        await expect(async () => {
            const count = await tagButtons.count();
            const loadingText = page.locator('.tag-buttons').getByText('載入關鍵字中');
            const isLoading = await loadingText.isVisible().catch(() => false);
            expect(count > 0 || isLoading).toBeTruthy();
        }).toPass({ timeout: 10000 });
    });
});
