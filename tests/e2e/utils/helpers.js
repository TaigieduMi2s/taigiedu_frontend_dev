/**
 * 測試輔助函數
 *
 * 📌 這些 helpers 提供常用的測試操作，避免重複代碼並確保測試穩定性。
 * 使用 Playwright 的 auto-wait 機制，避免人工 sleep/timeout。
 */

import { expect } from '@playwright/test';

/**
 * 等待頁面網路請求穩定（適用於 SPA 初始載入後的 API 呼叫）
 * @param {import('@playwright/test').Page} page
 * @param {Object} options
 * @param {number} [options.timeout=10000] - 最大等待時間
 */
export async function waitForNetworkIdle(page, options = {}) {
    const { timeout = 10000 } = options;
    await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 等待頁面進入穩定狀態（DOM 停止變化）
 * @param {import('@playwright/test').Page} page
 * @param {Object} options
 * @param {number} [options.timeout=10000] - 最大等待時間
 */
export async function waitForStableUI(page, options = {}) {
    const { timeout = 10000 } = options;
    await page.waitForLoadState('domcontentloaded', { timeout });
    // 額外等待 React 渲染完成
    await page.waitForFunction(() => {
        return document.readyState === 'complete';
    }, { timeout });
}

/**
 * 導航至指定路徑並等待頁面穩定
 * @param {import('@playwright/test').Page} page
 * @param {string} path - 相對路徑，如 '/search'
 * @param {Object} options
 * @param {boolean} [options.waitForIdle=true] - 是否等待網路閒置
 */
export async function navigateAndWait(page, path, options = {}) {
    const { waitForIdle = true } = options;
    await page.goto(path);
    if (waitForIdle) {
        try {
            await waitForNetworkIdle(page, { timeout: 15000 });
        } catch {
            // 如果 networkidle 超時，至少確保 DOM 已載入
            await page.waitForLoadState('domcontentloaded');
        }
    }
}

/**
 * 透過 data-testid 取得元素
 * @param {import('@playwright/test').Page} page
 * @param {string} testId
 * @returns {import('@playwright/test').Locator}
 */
export function getByTestId(page, testId) {
    return page.getByTestId(testId);
}

/**
 * 驗證元素存在且可見
 * @param {import('@playwright/test').Page} page
 * @param {string} testId
 * @param {Object} options
 * @param {number} [options.timeout=5000]
 */
export async function expectVisible(page, testId, options = {}) {
    const { timeout = 5000 } = options;
    await expect(getByTestId(page, testId)).toBeVisible({ timeout });
}

/**
 * 驗證頁面標題包含指定文字
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedTitle
 */
export async function expectTitleContains(page, expectedTitle) {
    await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
}

/**
 * 安全地填寫表單欄位
 * @param {import('@playwright/test').Page} page
 * @param {string} testId
 * @param {string} value
 */
export async function fillField(page, testId, value) {
    const field = getByTestId(page, testId);
    await field.waitFor({ state: 'visible' });
    await field.fill(value);
}

/**
 * 安全地點擊元素
 * @param {import('@playwright/test').Page} page
 * @param {string} testId
 */
export async function clickElement(page, testId) {
    const element = getByTestId(page, testId);
    await element.waitFor({ state: 'visible' });
    await element.click();
}
