import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 獲取當前文件的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 從登入測試匯入 storage state 路徑
const STORAGE_STATE_PATH = path.resolve(__dirname, '../../../.auth/user.json');

/**
 * 測試場景：資源頁面 - 上傳資源
 * 
 * 📌 此測試依賴 auth-setup 專案（login.spec.js）先執行登入並保存認證狀態
 * 📌 測試流程：
 *    1. 載入已登入的認證狀態
 *    2. 導航到資源頁面
 *    3. 點擊「上傳我的資源」按鈕開啟上傳對話框
 *    4. 填寫完整表單（名稱、階段、版本、冊別、內容類型）
 *    5. 上傳測試 PDF 檔案
 *    6. 點擊送出並驗證成功訊息
 */
test.describe('資源上傳測試', () => {

    // 在所有測試開始前檢查認證狀態
    test.beforeAll(async () => {
        if (!fs.existsSync(STORAGE_STATE_PATH)) {
            console.warn('[測試] 警告：認證狀態文件不存在，請先執行登入測試');
            console.warn('[測試] 預期路徑:', STORAGE_STATE_PATH);
        }
    });

    test.beforeEach(async ({ page, context }) => {
        // 檢查認證狀態文件是否存在
        if (!fs.existsSync(STORAGE_STATE_PATH)) {
            test.skip(true, '認證狀態不存在，請先執行登入測試 (login.spec.js)');
            return;
        }

        // 載入已保存的認證狀態
        const storageState = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf-8'));

        // 1. 應用 cookies（包含 refresh_token_cookie）
        if (storageState.cookies && storageState.cookies.length > 0) {
            await context.addCookies(storageState.cookies);
            console.log(`[測試] 已載入 ${storageState.cookies.length} 個 cookies`);
        }

        // 2. 應用 localStorage 狀態（包含 isLoggedIn 和 user）
        if (storageState.origins && storageState.origins.length > 0) {
            await page.addInitScript((origins) => {
                for (const origin of origins) {
                    for (const item of origin.localStorage || []) {
                        window.localStorage.setItem(item.name, item.value);
                    }
                }
            }, storageState.origins);
            console.log('[測試] 已載入 localStorage 狀態');
        }

        console.log('[測試] ✓ 認證狀態載入完成');
    });

    test('應該能在已登入狀態下填寫表單並成功上傳資源', async ({ page }) => {
        // 設定較長的超時時間（上傳可能需要較長時間）
        test.setTimeout(60000);

        // 導航到資源頁面
        await page.goto('/resource');
        console.log('[測試] 已導航到資源頁面');

        // 等待頁面完全載入
        await page.waitForLoadState('networkidle');

        // 檢查是否有登入彈窗，如果有則表示認證狀態失效
        const loginModal = page.locator('.login-modal-container, .login-modal');
        if (await loginModal.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('[測試] 發現登入彈窗，認證狀態可能已失效');
            test.skip(true, '認證狀態已失效，請重新執行登入測試');
            return;
        }

        // 等待頁面穩定
        await page.waitForTimeout(1000);

        // === 步驟 1: 點擊「上傳我的資源」按鈕 ===
        console.log('[測試] 步驟 1: 點擊「上傳我的資源」按鈕');
        const uploadButton = page.locator('button.res-upload-button, button:has-text("上傳我的資源")');
        await uploadButton.waitFor({ state: 'visible', timeout: 15000 });
        await uploadButton.click();

        // 再次檢查是否出現登入彈窗（未登入時點擊上傳會彈出登入框）
        await page.waitForTimeout(500);
        if (await loginModal.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('[測試] 點擊上傳後出現登入彈窗');
            test.skip(true, '認證狀態失效，點擊上傳後出現登入彈窗');
            return;
        }

        // === 步驟 2: 等待上傳對話框出現 ===
        console.log('[測試] 步驟 2: 等待上傳對話框出現');
        const uploadDialog = page.locator('.upload-resource-overlay');
        await uploadDialog.waitFor({ state: 'visible', timeout: 10000 });
        // 等待表單完全載入（版本 API 調用等）
        await page.waitForTimeout(2000);
        console.log('[測試] ✓ 上傳對話框已開啟');

        // === 步驟 3: 填寫資源名稱 ===
        console.log('[測試] 步驟 3: 填寫資源名稱');
        const resourceName = 'E2E 測試上傳 - ' + Date.now();
        // 使用 placeholder 來定位輸入框（更穩定）
        const nameInput = page.locator('input[placeholder="字數最多28字"]');
        await nameInput.waitFor({ state: 'visible', timeout: 5000 });
        await nameInput.focus();
        await nameInput.fill(resourceName);
        console.log('[測試] ✓ 已填寫資源名稱:', resourceName);

        // === 步驟 4: 選擇階段 (高中) ===
        console.log('[測試] 步驟 4: 選擇階段 - 高中');
        await page.getByLabel('高中', { exact: true }).click();
        // 等待階段選擇生效和版本 API 載入
        await page.waitForTimeout(2000);
        console.log('[測試] ✓ 已選擇階段: 高中');

        // === 步驟 5: 選擇版本 ===
        console.log('[測試] 步驟 5: 選擇版本');
        // 嘗試選擇版本（包含各階段可能的版本）
        const versionOptions = ['南一', '康軒', '翰林', '真平', '育達', '泰宇', '奇異果', '創新', '全華', '豪風', '長鴻', '師昀'];
        let versionSelected = false;

        for (const version of versionOptions) {
            const versionLabel = page.getByLabel(version, { exact: true });
            if (await versionLabel.isVisible({ timeout: 500 }).catch(() => false)) {
                await versionLabel.click();
                console.log(`[測試] ✓ 已選擇版本: ${version}`);
                versionSelected = true;
                break;
            }
        }

        if (!versionSelected) {
            // 如果沒有預設版本可選，選擇「其他」並填寫
            console.log('[測試] 沒有預設版本，選擇「其他」');
            const otherLabel = page.locator('.upload-resource-overlay').getByLabel('其他').first();
            await otherLabel.click();
            await page.locator('input[name="versionOther"]').fill('測試版本');
            console.log('[測試] ✓ 已填寫自訂版本');
        }

        // === 步驟 6: 填寫冊別 ===
        console.log('[測試] 步驟 6: 填寫冊別');
        const bookInput = page.locator('input[name="book"]');
        await bookInput.waitFor({ state: 'visible', timeout: 3000 });
        await bookInput.focus();
        await bookInput.fill('113 上冊');
        await expect(bookInput).toHaveValue('113 上冊');
        console.log('[測試] ✓ 已填寫冊別');

        // === 步驟 7: 選擇內容類型 (學習單) ===
        console.log('[測試] 步驟 7: 選擇內容類型 - 學習單');
        // 使用 getByLabel 選擇內容類型
        await page.getByLabel('學習單', { exact: true }).click();
        console.log('[測試] ✓ 已選擇內容類型: 學習單');

        // === 步驟 8: 上傳測試 PDF 檔案 ===
        console.log('[測試] 步驟 8: 上傳測試 PDF 檔案');
        const testFilePath = path.resolve(__dirname, '../../../fixtures/test-file.pdf');

        // 確認測試檔案存在
        if (!fs.existsSync(testFilePath)) {
            console.error('[測試] 錯誤：測試檔案不存在:', testFilePath);
            test.skip(true, '測試檔案 test-file.pdf 不存在');
            return;
        }

        await page.locator('input.file-upload').setInputFiles(testFilePath);
        console.log('[測試] ✓ 已上傳測試檔案');

        // 等待檔案處理
        await page.waitForTimeout(1000);

        // 確認檔案已被選取（UI 應該顯示「已上傳檔案！」）
        await expect(page.locator('.upload-button')).toContainText('已上傳');

        // === 步驟 9: 點擊送出按鈕 ===
        console.log('[測試] 步驟 9: 點擊送出按鈕');
        const submitButton = page.locator('.upload-resource-overlay button.submit-button');
        await submitButton.waitFor({ state: 'visible' });

        // 確認按鈕已啟用（非 disabled 且 class 包含 enabled）
        await expect(submitButton).not.toBeDisabled();

        // 檢查按鈕 class，確認表單狀態正確
        const buttonClass = await submitButton.getAttribute('class');
        console.log('[測試] 送出按鈕 class:', buttonClass);

        // 點擊送出按鈕
        await submitButton.click({ force: true });
        console.log('[測試] ✓ 已點擊送出按鈕');

        // 等待按鈕狀態變化（應該變成「處理中」）
        await page.waitForTimeout(500);

        // === 步驟 10: 驗證上傳成功 ===
        console.log('[測試] 步驟 10: 驗證上傳成功');

        // 等待處理結果
        // 成功情況：
        // 1. Toast 顯示「資源上傳成功」
        // 2. 按鈕變成「上傳成功！」
        // 3. 對話框自動關閉

        try {
            await Promise.race([
                // Toast 顯示成功訊息
                expect(page.locator('.toast-message')).toContainText(/資源上傳成功|上傳成功/, { timeout: 45000 }),
                // 或者按鈕變成「上傳成功！」
                expect(submitButton).toContainText('上傳成功', { timeout: 45000 }),
                // 或者對話框關閉（表示上傳完成）
                expect(page.locator('.upload-resource-overlay')).not.toBeVisible({ timeout: 45000 }),
            ]);
            console.log('[測試] ✓✓✓ 資源上傳測試成功完成！');
        } catch (verifyError) {
            // 檢查是否有錯誤訊息
            const toastVisible = await page.locator('.toast-message').isVisible().catch(() => false);
            if (toastVisible) {
                const toastText = await page.locator('.toast-message').textContent();
                console.log('[測試] Toast 訊息:', toastText);

                // 檢查是否為 Missing Authorization Header 錯誤
                if (toastText?.includes('Missing Authorization Header') ||
                    toastText?.includes('缺少認證標頭') ||
                    toastText?.includes('登入狀態已失效')) {
                    console.log('[測試] ❌ 驗證錯誤：缺少認證標頭');
                    throw new Error('上傳失敗：API 返回 Missing Authorization Header 錯誤，請確認認證狀態');
                }

                if (toastText?.includes('成功')) {
                    console.log('[測試] ✓✓✓ 資源上傳測試成功完成！');
                    return;
                }
            }

            // 檢查按鈕狀態
            const buttonText = await submitButton.textContent().catch(() => '');
            console.log('[測試] 按鈕文字:', buttonText);
            if (buttonText?.includes('上傳成功')) {
                console.log('[測試] ✓✓✓ 資源上傳測試成功完成！');
                return;
            }

            // 檢查對話框是否已關閉
            const dialogVisible = await page.locator('.upload-resource-overlay').isVisible().catch(() => true);
            if (!dialogVisible) {
                console.log('[測試] ✓✓✓ 對話框已關閉，上傳可能成功！');
                return;
            }

            throw verifyError;
        }
    });

    test('資源頁面應該能正確載入並顯示上傳按鈕', async ({ page }) => {
        // 設定超時時間
        test.setTimeout(30000);

        // 導航到資源頁面
        await page.goto('/resource');

        // 等待頁面載入
        await page.waitForLoadState('domcontentloaded');

        // 驗證頁面有搜尋功能
        const searchInput = page.locator('input.res-search-input, input[placeholder*="搜尋"]');
        await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
        console.log('[測試] ✓ 搜尋輸入框已顯示');

        // 驗證有上傳按鈕
        const uploadButton = page.locator('button.res-upload-button, button:has-text("上傳我的資源")');
        await expect(uploadButton.first()).toBeVisible();
        console.log('[測試] ✓ 上傳按鈕已顯示');

        // 驗證有階段下拉選單
        const gradeDropdown = page.locator('select.grade-dropdown');
        await expect(gradeDropdown).toBeVisible();
        console.log('[測試] ✓ 階段選單已顯示');
    });
});
