/**
 * 身份驗證服務
 * 處理 JWT Token 管理、API 請求和自動刷新
 */

// 在開發環境下，如果沒有 VITE_API_URL，使用相對路徑 /backend 以觸發 vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/backend' : 'https://dev.taigiedu.com/backend');

// 存放 Access Token 在記憶體中
let accessToken = null;

/**
 * 設定 Access Token
 */
export const setAccessToken = (token) => {
    accessToken = token;
};

/**
 * 取得 Access Token
 */
export const getAccessToken = () => {
    return accessToken;
};

/**
 * 清除 Access Token
 */
export const clearAccessToken = () => {
    accessToken = null;
};

/**
 * 建立帶有認證標頭的 fetch 請求
 */
export const authenticatedFetch = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // 確保 cookie 被傳送
    });

    // 如果是 401 錯誤，嘗試刷新 token
    if (response.status === 401 && accessToken) {
        const refreshResult = await refreshToken();
        if (refreshResult.success) {
            // 重試原始請求
            headers['Authorization'] = `Bearer ${accessToken}`;
            return fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });
        }
    }

    return response;
};

/**
 * 使用者登入
 * @param {Object} credentials - 登入憑證
 * @param {string} credentials.username - 使用者帳號
 * @param {string} credentials.password - 密碼
 * @param {string} credentials.captchaId - 驗證碼 ID
 * @param {string} credentials.captcha - 驗證碼
 */
export const login = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 接收 HttpOnly Cookie
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            accessToken = data.accessToken;
            return {
                success: true,
                accessToken: data.accessToken,
                user: data.user,
                message: data.message,
            };
        } else {
            return {
                success: false,
                message: data.message || '登入失敗',
            };
        }
    } catch (error) {
        console.error('登入 API 錯誤:', error);
        return {
            success: false,
            message: '網路錯誤，請稍後再試',
        };
    }
};

/**
 * 刷新 Access Token
 * 使用 HttpOnly Cookie 中的 Refresh Token
 */
export const refreshToken = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 確保傳送 Refresh Token cookie
        });

        const data = await response.json();

        if (response.ok && data.success) {
            accessToken = data.accessToken;
            return {
                success: true,
                accessToken: data.accessToken,
                tokenType: data.tokenType,
                expiresIn: data.expiresIn,
                user: data.user,
            };
        } else {
            console.warn(`Token 刷新失敗: 狀態碼 ${response.status}`, data);
            clearAccessToken();
            return {
                success: false,
                message: data.error?.message || 'Token 刷新失敗',
            };
        }
    } catch (error) {
        console.error('Token 刷新 API 網路錯誤:', error);
        clearAccessToken();
        return {
            success: false,
            message: '網路錯誤，請稍後再試',
        };
    }
};

/**
 * 取得當前使用者資訊
 */
export const getCurrentUser = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return {
                success: true,
                user: data.user,
            };
        } else {
            return {
                success: false,
                message: data.error?.message || '取得使用者資訊失敗',
            };
        }
    } catch (error) {
        console.error('取得使用者資訊 API 錯誤:', error);
        return {
            success: false,
            message: '網路錯誤，請稍後再試',
        };
    }
};

/**
 * 查詢所有 Session
 * @param {boolean} includeRevoked - 是否包含已撤銷的紀錄
 */
export const getSessions = async (includeRevoked = false) => {
    try {
        const url = `${API_BASE_URL}/auth/sessions${includeRevoked ? '?include_revoked=true' : ''}`;
        const response = await authenticatedFetch(url, {
            method: 'GET',
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return {
                success: true,
                totalCount: data.totalCount,
                sessions: data.sessions,
            };
        } else {
            return {
                success: false,
                message: data.error?.message || '取得 Session 列表失敗',
            };
        }
    } catch (error) {
        console.error('取得 Session 列表 API 錯誤:', error);
        return {
            success: false,
            message: '網路錯誤，請稍後再試',
        };
    }
};

/**
 * 撤銷 Session (強制登出)
 * @param {Object} options - 撤銷選項
 * @param {string} options.sessionId - 要撤銷的 Session ID
 * @param {boolean} options.all - 是否撤銷所有 Session
 * @param {boolean} options.exceptCurrent - 撤銷所有時是否排除當前 Session
 */
export const revokeSessions = async (options) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/auth/sessions`, {
            method: 'DELETE',
            body: JSON.stringify(options),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return {
                success: true,
                message: data.message,
            };
        } else {
            return {
                success: false,
                message: data.error?.message || '撤銷 Session 失敗',
            };
        }
    } catch (error) {
        console.error('撤銷 Session API 錯誤:', error);
        return {
            success: false,
            message: '網路錯誤，請稍後再試',
        };
    }
};

/**
 * 登出
 */
export const logout = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
        });

        const data = await response.json();

        // 無論是否成功都清除本地 token
        clearAccessToken();

        if (response.ok && data.success) {
            return {
                success: true,
                message: data.message,
            };
        } else {
            return {
                success: false,
                message: data.error?.message || '登出失敗',
            };
        }
    } catch (error) {
        console.error('登出 API 錯誤:', error);
        clearAccessToken();
        return {
            success: false,
            message: '網路錯誤，但已清除本地登入狀態',
        };
    }
};

// 匯出所有函數作為一個物件
export const authService = {
    setAccessToken,
    getAccessToken,
    clearAccessToken,
    authenticatedFetch,
    login,
    refreshToken,
    getCurrentUser,
    getSessions,
    revokeSessions,
    logout,
};

export default authService;
