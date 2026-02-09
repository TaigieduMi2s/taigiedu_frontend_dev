/**
 * 📌 選擇器策略說明：
 *
 * 優先使用 data-testid 屬性來定位元素，這是 Playwright 推薦的穩定選擇器策略。
 * 集中管理選擇器可以：
 * 1. 避免選擇器散落在各個測試中
 * 2. 當 UI 變更時只需修改一處
 * 3. 提供清晰的元素命名規範
 *
 * 命名規範：
 * - 使用 kebab-case 命名
 * - 格式：{頁面/區塊}-{元素類型}-{描述}
 * - 例如：header-logo, home-search-input, sidebar-menu-item
 */

export const selectors = {
    // Header 區塊
    header: {
        root: 'header',
        logo: 'header-logo',
    },

    // Sidebar 導航
    sidebar: {
        root: 'sidebar',
        menuItem: 'sidebar-menu-item',
        submenu: 'sidebar-submenu',
    },

    // 首頁 (MainContent)
    home: {
        heroSection: 'home-hero-section',
        searchInput: 'home-search-input',
        searchButton: 'home-search-button',
        tagButton: 'home-tag-button',
        idiomSection: 'home-idiom-section',
        eventsSection: 'home-events-section',
        examSection: 'home-exam-section',
        newsSection: 'home-news-section',
    },

    // 搜尋結果頁
    search: {
        root: 'search-page',
        results: 'search-results',
        resultItem: 'search-result-item',
    },

    // 資源頁面
    resource: {
        root: 'resource-page',
        fileList: 'resource-file-list',
        loginButton: 'resource-login-button',
    },

    // 登入頁面
    login: {
        modal: 'login-modal',
        emailInput: 'login-email-input',
        passwordInput: 'login-password-input',
        captchaInput: 'login-captcha-input',
        submitButton: 'login-submit-button',
        registerButton: 'login-register-button',
        googleButton: 'login-google-button',
    },

    // Footer 區塊
    footer: {
        root: 'footer',
    },
};
