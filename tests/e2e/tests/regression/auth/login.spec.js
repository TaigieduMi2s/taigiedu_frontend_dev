import { test, expect } from '@playwright/test';
import { getCaptchaWithRetry } from '../../../utils/captcha-ocr.js';
import path from 'path';
import { fileURLToPath } from 'url';

// 獲取當前文件的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 從環境變數讀取測試帳號密碼
const TEST_USER = process.env.TEST_USER;
const TEST_PASS = process.env.TEST_PASS;

// 定義 storageState 路徑供其他測試使用
export const STORAGE_STATE_PATH = path.resolve(__dirname, '../../../.auth/user.json');

/**
 * 測試場景：使用者認證 (登入流程)
 * 
 * 📌 此測試使用真實的 OCR 辨識驗證碼，測試完整的 JWT token 登入流程
 * 📌 登入成功後會保存認證狀態，供其他需要登入的測試使用
 */
test.describe('使用者認證測試', () => {

    // 測試驗證碼刷新功能 (放在登入測試之前)
    test('應該能刷新驗證碼', async ({ page }) => {
        let captchaRequestCount = 0;

        // 攔截驗證碼 API 並計數
        await page.route('**/api/captcha', async (route) => {
            captchaRequestCount++;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: `test-captcha-id-${captchaRequestCount}`,
                    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                })
            });
        });

        await page.goto('/');

        // 開啟登入 Modal
        const loginButton = page.locator('header button:has-text("登入")');
        await loginButton.click();
        await expect(page.locator('.login-modal-container')).toBeVisible();

        // 等待初始驗證碼載入
        await page.waitForTimeout(1000);
        const initialCount = captchaRequestCount;

        // 點擊刷新驗證碼
        const refreshButton = page.locator('button.captcha-refresh-button, button:has-text("↻")');
        await refreshButton.click();

        // 等待新驗證碼載入
        await page.waitForTimeout(1000);

        // 驗證 captcha API 被調用了多次
        expect(captchaRequestCount).toBeGreaterThan(initialCount);
    });

    // 測試登入 - 使用 OCR 辨識驗證碼 (真實登入流程)
    // 登入成功後保存認證狀態供其他測試使用
    test('應該能成功輸入憑證與驗證碼完成登入 (OCR 版本)', async ({ page, context }) => {
        // 設定較長的超時時間，因為 OCR 需要額外時間
        test.setTimeout(60000);

        await page.goto('/');

        // 等待頁面載入完成
        await page.waitForLoadState('networkidle');

        // 點擊登入按鈕開啟登入 Modal
        const loginButton = page.locator('header button:has-text("登入")');
        await loginButton.waitFor({ state: 'visible' });
        await loginButton.click();

        // 等待登入 Modal 打開
        await expect(page.locator('.login-modal-container')).toBeVisible();

        // 等待驗證碼圖片載入
        const captchaImg = page.locator('img.captcha-image, img[alt="驗證碼"]');
        await captchaImg.waitFor({ state: 'visible', timeout: 30000 });

        // 填寫登入表單
        const emailInput = page.locator('input[placeholder*="電子郵件"]');
        await emailInput.waitFor({ state: 'visible' });
        if (!TEST_USER || !TEST_PASS) {
            test.skip(true, '缺少環境變數 TEST_USER 或 TEST_PASS，請在 .env.local 中設定');
            return;
        }
        await emailInput.fill(TEST_USER);

        const passwordInput = page.locator('input[placeholder*="密碼"]');
        await passwordInput.waitFor({ state: 'visible' });
        await passwordInput.fill(TEST_PASS);

        // 登入重試機制 - 當 OCR 驗證碼錯誤時自動重試
        const MAX_LOGIN_ATTEMPTS = 5;
        let loginSuccess = false;
        let lastErrorMessage = '';

        for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
            console.log(`[測試] 登入嘗試 ${attempt}/${MAX_LOGIN_ATTEMPTS}`);

            // 使用 OCR 辨識驗證碼
            let captchaText;
            try {
                captchaText = await getCaptchaWithRetry(page, {
                    captchaSelector: 'img.captcha-image, img[alt="驗證碼"]',
                    refreshSelector: 'button.captcha-refresh-button, button:has-text("↻")',
                    maxRetries: 3,
                    minConfidence: 50,
                    expectedLength: 4
                });
                console.log(`[測試] OCR 辨識的驗證碼: ${captchaText}`);
            } catch (ocrError) {
                console.error(`[測試] 第 ${attempt} 次 OCR 辨識失敗: ${ocrError.message}`);
                if (attempt === MAX_LOGIN_ATTEMPTS) {
                    test.skip(true, 'OCR 辨識失敗，無法進行真實登入測試');
                    return;
                }
                // 刷新驗證碼後繼續重試
                const refreshButton = page.locator('button.captcha-refresh-button, button:has-text("↻")');
                if (await refreshButton.isVisible()) {
                    await refreshButton.click();
                    await page.waitForTimeout(1000);
                }
                continue;
            }

            // 填入驗證碼
            const captchaInput = page.locator('input[placeholder*="驗證碼"]');
            await captchaInput.fill(captchaText);

            // 點擊登入按鈕提交
            const submitButton = page.locator('button.login-submit-button');
            await submitButton.click();

            // 等待登入結果
            let errorMessage = '';

            // 等待 Toast 訊息出現或 Modal 關閉
            try {
                await Promise.race([
                    page.locator('.toast-message').waitFor({ state: 'visible', timeout: 15000 }),
                    expect(page.locator('.login-modal-container')).not.toBeVisible({ timeout: 15000 }),
                ]);
            } catch {
                console.log('[測試] 等待登入回應超時');
            }

            // 檢查 Toast 訊息內容
            const toastMessage = page.locator('.toast-message');
            if (await toastMessage.isVisible()) {
                const toastText = await toastMessage.textContent();
                console.log(`[測試] Toast 訊息: ${toastText}`);

                if (toastText?.includes('登入成功') || toastText?.includes('歡迎')) {
                    loginSuccess = true;
                    console.log('[測試] ✓ 登入成功！(透過 Toast 確認)');
                    break; // 登入成功，跳出重試迴圈
                } else if (toastText?.includes('驗證碼錯誤') || toastText?.includes('驗證碼已過期') || toastText?.includes('過期')) {
                    // 驗證碼相關錯誤，需要重試
                    errorMessage = toastText || '驗證碼錯誤';
                    console.log(`[測試] ⚠ 驗證碼錯誤，準備重試: ${errorMessage}`);
                    lastErrorMessage = errorMessage;

                    // 等待 Toast 消失
                    await page.waitForTimeout(1500);

                    // 先檢查 Modal 是否還可見，如果 Modal 已關閉則可能是登入成功
                    const isModalStillVisible = await page.locator('.login-modal-container').isVisible();
                    if (!isModalStillVisible) {
                        console.log('[測試] ✓ Modal 已關閉，登入可能成功');
                        loginSuccess = true;
                        break;
                    }

                    // 驗證碼錯誤時系統會自動刷新圖片，不需要手動點擊刷新按鈕
                    // 只需等待新的驗證碼圖片載入完成
                    console.log('[測試] ℹ 等待新驗證碼圖片載入...');
                    const captchaImgForRetry = page.locator('img.captcha-image, img[alt="驗證碼"]');
                    await captchaImgForRetry.waitFor({ state: 'visible', timeout: 10000 });
                    // 額外等待確保圖片完全載入
                    await page.waitForTimeout(1000);

                    continue; // 繼續下一次重試
                } else {
                    // 其他錯誤（如帳號密碼錯誤），不重試
                    lastErrorMessage = toastText || '未知錯誤';
                    console.log(`[測試] ✗ 登入失敗 (非驗證碼問題): ${lastErrorMessage}`);
                    break; // 不重試，直接結束
                }
            }

            // 如果 Toast 沒有明確表示成功或失敗，檢查 Modal 狀態和 header
            if (!loginSuccess && !errorMessage) {
                const isModalVisible = await page.locator('.login-modal-container').isVisible();

                if (!isModalVisible) {
                    // Modal 已關閉，檢查 header 是否顯示使用者資訊
                    const userDropdown = page.locator('header .user-dropdown, header button:has-text("登出")');
                    const loginButtonStillExists = page.locator('header button:has-text("登入")');

                    if (await userDropdown.isVisible() || !(await loginButtonStillExists.isVisible())) {
                        loginSuccess = true;
                        console.log('[測試] ✓ 登入成功！(透過 UI 狀態確認)');
                        break;
                    } else {
                        lastErrorMessage = 'Modal 關閉但未檢測到登入狀態';
                    }
                } else {
                    lastErrorMessage = 'Modal 仍然可見，登入可能失敗';
                }
            }
        }

        // 最終斷言 - 登入必須成功，否則測試失敗
        expect(loginSuccess, `登入測試失敗 (嘗試 ${MAX_LOGIN_ATTEMPTS} 次後): ${lastErrorMessage}`).toBe(true);

        // 登入成功後，保存認證狀態供其他測試使用
        if (loginSuccess) {
            console.log('[測試] 保存認證狀態到:', STORAGE_STATE_PATH);

            // 確保 .auth 目錄存在
            const fs = await import('fs');
            const authDir = path.dirname(STORAGE_STATE_PATH);
            if (!fs.existsSync(authDir)) {
                fs.mkdirSync(authDir, { recursive: true });
            }

            // 保存 storage state (包含 cookies 和 localStorage)
            await context.storageState({ path: STORAGE_STATE_PATH });
            console.log('[測試] ✓ 認證狀態已保存');
        }
    });
});
