/**
 * 導航功能測試
 *
 * 📌 Smoke Test：驗證 Sidebar 導航到各核心頁面的功能正常
 * 確保使用者能透過選單成功導航到不同頁面
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait, waitForStableUI } from '../../utils/helpers.js';
import { testData } from '../../fixtures/test-data.js';

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

    test('點擊「台語出名人」導航成功', async ({ page, context }) => {
        const menuItem = page.locator('.menu-item', { hasText: '台語出名人' });
        
        // Mock window.open to intercept the url without causing navigation failures
        await page.evaluate(() => {
            window.openedUrls = [];
            window.open = (url) => { window.openedUrls.push(url); return null; };
        });
        
        await menuItem.click();
        
        const urls = await page.evaluate(() => window.openedUrls);
        expect(urls).toContain('https://famous.taigiedu.com/');
    });

    test('「節慶飲食」子選單展開並導航', async ({ page }) => {
        // 點擊「節慶飲食」展開子選單
        const cultureMenu = page.locator('.menu-item', { hasText: '節慶飲食' });
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

    test('直接訪問 /team 頁面成功並顯示網站貢獻名單', async ({ page }) => {
        await navigateAndWait(page, '/team');
        await expect(page).toHaveURL('/team');

        // TAIGIE-236：頁尾的網站貢獻名單（資料寫死在 contributorsData.js）
        const credits = page.locator('section.credits');
        await expect(credits.getByRole('heading', { name: '網站貢獻名單' })).toBeVisible();
        await expect(credits.locator('.credits-group').first()).toBeVisible();
        expect(await credits.locator('.credits-name').count()).toBeGreaterThan(0);
    });

    test('直接訪問 /login 頁面成功', async ({ page }) => {
        await navigateAndWait(page, '/login');
        await expect(page).toHaveURL('/login');

        // 登入 modal 應該顯示
        const loginModal = page.locator('.login-modal-container, .login-unified-modal');
        await expect(loginModal).toBeVisible();
    });
});

test.describe('「本站特色資源」子選單', () => {
    test.beforeEach(async ({ page }) => {
        await navigateAndWait(page, '/');
    });

    test('展開後顯示已開啟 flag 的子項，並能導航', async ({ page }) => {
        const parent = page.locator('.menu-item', { hasText: '本站特色資源' });
        // 所有子項 flag 都關閉時父選單不會出現
        test.skip((await parent.count()) === 0, '本站特色資源的子項 feature flag 皆未開啟');

        await parent.click();
        const submenu = page.locator('.submenu');
        await expect(submenu).toBeVisible();

        const visibleItems = [];
        for (const item of testData.featuredSubmenuItems) {
            if (await submenu.locator('.submenu-item', { hasText: item.label }).count()) {
                visibleItems.push(item);
            }
        }
        expect(visibleItems.length).toBeGreaterThan(0);

        // 逐一點擊子項，確認導到正確路徑且側邊欄 active 狀態正確
        for (const item of visibleItems) {
            await page.locator('.submenu-item', { hasText: new RegExp(`^${item.label}$`) }).click();
            await expect(page).toHaveURL(item.path);
            await expect(page.locator('.submenu-item.active')).toHaveText(item.label);
        }
    });

    test('直接開啟子頁面時，父選單自動展開並標示 active', async ({ page }) => {
        const [first] = testData.featuredSubmenuItems.filter(i => i.path === '/occupation-test');
        await navigateAndWait(page, `${first.path}/1`);
        test.skip(new URL(page.url()).pathname === '/', '職業台語的 feature flag 未開啟');

        // 巢狀路由 /occupation-test/:id 也要讓「職業台語」維持 active
        await expect(page.locator('.menu-item.active', { hasText: '本站特色資源' })).toBeVisible();
        await expect(page.locator('.submenu-item.active')).toHaveText(first.label);
    });
});

test.describe('Footer 連結', () => {
    for (const { label, path } of [
        { label: '團隊介紹', path: '/team' },
        { label: '使用條款', path: '/terms' },
        { label: '隱私政策', path: '/policy' },
    ]) {
        test(`點擊「${label}」導航到 ${path}`, async ({ page }) => {
            await navigateAndWait(page, '/resource', { waitForIdle: false });
            await page.getByTestId('footer').getByRole('button', { name: label }).click();
            await expect(page).toHaveURL(path);
        });
    }

    test('前台 Footer 顯示「回報問題」按鈕', async ({ page }) => {
        await navigateAndWait(page, '/');
        await expect(page.getByTestId('footer').getByRole('button', { name: '回報問題' })).toBeVisible();
    });
});
