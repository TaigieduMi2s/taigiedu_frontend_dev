/**
 * 應用程式環境變數與功能開關設定 (Feature Config)
 * 統一在此處讀取與轉型所有的環境變數，避免散落在各個元件中。
 */

export const envConfig = {
    // 基礎設定
    basePath: import.meta.env.VITE_BASE_PATH || '/',
    apiUrl: import.meta.env.VITE_API_URL || 'https://dev.taigiedu.com/backend',
    imageUrl: import.meta.env.VITE_IMAGE_URL || 'https://dev.taigiedu.com',

    // 功能開關 (Feature Toggles)
    features: {
        // 是否啟用尚未成熟的功能（朗讀、翻譯、逐字稿等）
        enableUnstableFeatures: import.meta.env.VITE_ENABLE_UNSTABLE_FEATURES === 'true',
        // 是否規範搜尋引擎不索引此網站（通常開發與測試環境為 true，正式環境為 false）
        enableRobotsNoindex: import.meta.env.VITE_ENABLE_ROBOTS_NOINDEX === 'true',
    }
};

export default envConfig;
