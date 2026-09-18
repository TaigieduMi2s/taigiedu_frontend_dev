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
 *
 * ⚠️ 部分頁面（如 /search）會持續打 API，networkidle 可能等不到；
 * 因此預設只等 DOM 載入，networkidle 改為選擇性且逾時很短，避免吃掉整個測試的 timeout。
 * 斷言請改用 `expect(locator).toBeVisible()` 等待實際內容出現。
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} path - 相對路徑，如 '/search'
 * @param {Object} options
 * @param {boolean} [options.waitForIdle=true] - 是否嘗試等待網路閒置
 * @param {number} [options.idleTimeout=5000] - 等待網路閒置的上限
 */
export async function navigateAndWait(page, path, options = {}) {
    const { waitForIdle = true, idleTimeout = 5000 } = options;
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    if (waitForIdle) {
        await page.waitForLoadState('networkidle', { timeout: idleTimeout }).catch(() => {});
    }
}

/**
 * 開啟受 feature flag 控制的頁面；flag 關閉時路由會 `<Navigate>` 回首頁，此時略過測試。
 * （本機 .env.local 預設全開，staging／正式站可能關閉）
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestType<any, any>} test
 * @param {string} path
 */
export async function gotoFeaturePage(page, test, path) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const pathname = path.split('?')[0];
    const redirectedHome = await page
        .waitForURL((url) => url.pathname === '/', { timeout: 1500 })
        .then(() => true)
        .catch(() => false);
    test.skip(redirectedHome && pathname !== '/', `${pathname} 的 feature flag 未開啟，已導回首頁`);
}

/**
 * 操作共用的 `components/CustomSelect`：點開 root 內的 header，再點選項。
 * 選項清單會 portal 到 #root，因此以頁面層級找「目前展開的」選項。
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} selectRoot - `.custom-select` 或其外層
 * @param {string} optionLabel
 */
export async function chooseCustomSelectOption(page, selectRoot, optionLabel) {
    await selectRoot.locator('.custom-select-header').first().click();
    await page.locator('.custom-select-options').getByText(optionLabel, { exact: true }).click();
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
