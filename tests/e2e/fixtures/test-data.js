/**
 * 測試資料集中管理
 *
 * 📌 所有測試用的固定資料都放在這裡，包括：
 * - 測試用的搜尋關鍵字
 * - 導航路徑
 * - Mock 資料（如有需要）
 *
 * 敏感資料（如登入憑證）應透過環境變數提供，不要硬編碼在此。
 */

export const testData = {
    // 搜尋測試用關鍵字
    searchQueries: {
        valid: '台語',
        withResults: '台語文',
        empty: '',
    },

    // 核心路由列表（用於導航測試）
    routes: {
        home: '/',
        search: '/search',
        transcript: '/transcript',
        read: '/read',
        translate: '/translate',
        resource: '/resource',
        phrase: '/phrase',
        celebrity: '/celebrity',
        cultureFood: '/culture/food',
        cultureFestival: '/culture/festival',
        socialmedia: '/socialmedia',
        exam: '/exam',
        login: '/login',
        register: '/register',
        terms: '/terms',
        policy: '/policy',
    },

    // Sidebar 選單項目（用於驗證）
    sidebarItems: [
        { label: '主頁搜尋', path: '/' },
        { label: '台語逐字稿', path: '/transcript' },
        { label: '台語朗讀', path: '/read' },
        { label: '台語文字轉換', path: '/translate' },
        { label: '台語教學資源共享平台', path: '/resource' },
        { label: '台語俗諺語', path: '/phrase' },
        { label: '台語名人堂', path: '/celebrity' },
        { label: '台語文化', hasSubmenu: true },
        { label: '媒體與社群資源', path: '/socialmedia' },
        { label: '認證考試', path: '/exam' },
    ],

    // 首頁區塊標題（用於驗證）
    homePageSections: [
        '俗語諺輪播',
        '今日大事',
        '考試資訊',
        '活動快訊',
    ],
};

/**
 * 從環境變數取得測試用憑證
 * @returns {{ username: string, password: string } | null}
 */
export function getTestCredentials() {
    const username = process.env.TEST_USER;
    const password = process.env.TEST_PASS;

    if (!username || !password) {
        console.warn('⚠️ TEST_USER 或 TEST_PASS 環境變數未設定，登入測試將被跳過');
        return null;
    }

    return { username, password };
}
