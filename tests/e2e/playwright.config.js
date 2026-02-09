// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * Playwright E2E 測試配置
 *
 * 📌 架構決策說明：
 * - 使用 Page Helpers 模式而非完整 POM，因為專案規模適中且頁面結構相對簡單
 * - 固定 1440x900 viewport（桌面版專用，無 RWD 測試需求）
 * - 透過環境變數支援 local/staging/production 環境切換
 * - 使用測試專案分組（smoke/auth-setup/regression）提升測試效率
 * 
 * 📝 使用方式：
 * - 執行所有測試: npm run test:e2e
 * - 執行冒煙測試: npm run test:e2e:smoke
 * - UI 模式除錯: npm run test:e2e:ui
 * 
 * 🔐 環境變數設定：
 * - 請在專案根目錄建立 .env.local 檔案
 * - 設定 BASE_URL、TEST_USER、TEST_PASS
 * - 參考 .env.example 查看完整範例
 */

dotenv.config({ path: '.env.local' });

export default defineConfig({
    // 測試目錄
    testDir: './tests',

    // 全域測試設定
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,

    // 報告設定
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    // 共用設定
    use: {
        // 基礎 URL：優先使用環境變數，否則使用本地開發伺服器
        baseURL: process.env.BASE_URL || 'http://localhost:3000',

        // 固定桌面版 viewport
        viewport: { width: 1440, height: 900 },

        // 偵錯與追蹤設定
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        // 穩定性設定
        actionTimeout: 15000,
        navigationTimeout: 30000,
    },

    // 測試專案分組
    projects: [
        {
            name: 'smoke',
            testMatch: '**/smoke/**/*.spec.js',
            use: { ...devices['Desktop Chrome'] },
        },
        // 認證設置專案 - 執行登入測試並保存認證狀態
        {
            name: 'auth-setup',
            testMatch: '**/regression/auth/login.spec.js',
            use: { ...devices['Desktop Chrome'] },
        },
        // Regression 測試 - 依賴 auth-setup，確保登入狀態已準備好
        {
            name: 'regression',
            testMatch: '**/regression/**/*.spec.js',
            testIgnore: '**/regression/auth/login.spec.js', // 排除登入測試，因為已在 auth-setup 執行
            dependencies: ['auth-setup'],
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Web Server 設定（自動啟動開發伺服器）
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },

    // 輸出目錄設定
    outputDir: 'test-results',
});
