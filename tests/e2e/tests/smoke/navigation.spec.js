/**
 * 導航功能測試
 *
 * 📌 Smoke Test：驗證 Sidebar 導航到各核心頁面的功能正常
 * 確保使用者能透過選單成功導航到不同頁面
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait, waitForStableUI } from '../../utils/helpers.js';

test.describe('Sidebar 導航功能', () => {
    test.beforeEach(async ({ page }) => {
        await navigateAndWait(page, '/');
    });

    test('點擊「台語逐字稿」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語逐字稿' });
        await menuItem.click();

        await expect(page).toHaveURL('/transcript');
        await waitForStableUI(page);
    });

    test('點擊「台語朗讀」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語朗讀' });
        await menuItem.click();

        await expect(page).toHaveURL('/read');
        await waitForStableUI(page);
    });

    test('點擊「台語文字轉換」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語文字轉換' });
        await menuItem.click();

        await expect(page).toHaveURL('/translate');
        await waitForStableUI(page);
    });

    test('點擊「台語教學資源共享平台」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語教學資源共享平台' });
        await menuItem.click();

        await expect(page).toHaveURL('/resource');
        await waitForStableUI(page);
    });

    test('點擊「台語俗諺語」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語俗諺語' });
        await menuItem.click();

        await expect(page).toHaveURL('/phrase');
        await waitForStableUI(page);
    });

    test('點擊「台語名人堂」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語名人堂' });
        await menuItem.click();

        await expect(page).toHaveURL('/celebrity');
        await waitForStableUI(page);
    });

    test('「台語文化」子選單展開並導航', async ({ page }) => {
        // 點擊「台語文化」展開子選單
        const cultureMenu = page.locator('.menu-item', { hasText: '台語文化' });
        await cultureMenu.click();

        // 等待子選單展開
        const submenu = page.locator('.submenu');
        await expect(submenu).toBeVisible();

        // 點擊「飲食」子項目
        const foodItem = submenu.locator('.submenu-item', { hasText: '飲食' });
        await foodItem.click();

        await expect(page).toHaveURL('/culture/food');
        await waitForStableUI(page);
    });

    test('點擊「媒體與社群資源」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '媒體與社群資源' });
        await menuItem.click();

        await expect(page).toHaveURL('/socialmedia');
        await waitForStableUI(page);
    });

    test('點擊「認證考試」導航成功', async ({ page }) => {
        const menuItem = page.locator('.menu-item', { hasText: '認證考試' });
        await menuItem.click();

        await expect(page).toHaveURL('/exam');
        await waitForStableUI(page);
    });

    test('點擊 Logo 返回首頁', async ({ page }) => {
        // 先導航到其他頁面
        await page.goto('/resource');
        await waitForStableUI(page);

        // 點擊 Logo 返回首頁
        const logo = page.getByTestId('header-logo');
        await logo.click();

        await expect(page).toHaveURL('/');
    });
});

test.describe('直接 URL 導航', () => {
    test('直接訪問 /terms 頁面成功', async ({ page }) => {
        await navigateAndWait(page, '/terms');
        await expect(page).toHaveURL('/terms');
    });

    test('直接訪問 /policy 頁面成功', async ({ page }) => {
        await navigateAndWait(page, '/policy');
        await expect(page).toHaveURL('/policy');
    });

    test('直接訪問 /login 頁面成功', async ({ page }) => {
        await navigateAndWait(page, '/login');
        await expect(page).toHaveURL('/login');

        // 登入 modal 應該顯示
        const loginModal = page.locator('.login-modal-container');
        await expect(loginModal).toBeVisible();
    });
});
