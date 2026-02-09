import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';

// 建立 Auth Context
const AuthContext = createContext(null);

// Auth Provider 組件
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);

    // 使用 ref 追蹤 token 刷新定時器
    const refreshTimerRef = useRef(null);

    // 儲存 token 到記憶體
    const saveToken = useCallback((token) => {
        setAccessToken(token);
        authService.setAccessToken(token);
    }, []);

    // 清除認證狀態
    const clearAuth = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        setAccessToken(null);
        authService.clearAccessToken();
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
    }, []);

    // 設定自動刷新 token 的定時器
    const setupTokenRefresh = useCallback((expiresIn) => {
        // 清除舊的定時器
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        // 在 token 過期前 60 秒刷新 (至少提前 10% 的時間)
        const refreshTime = Math.max((expiresIn - 60) * 1000, expiresIn * 0.9 * 1000);

        refreshTimerRef.current = setTimeout(async () => {
            try {
                const result = await authService.refreshToken();
                if (result.success) {
                    saveToken(result.accessToken);
                    if (result.user) {
                        setUser(result.user);
                    }
                    // 設定下一次刷新
                    if (result.expiresIn) {
                        setupTokenRefresh(result.expiresIn);
                    } else {
                        // 預設 15 分鐘
                        setupTokenRefresh(900);
                    }
                } else {
                    // 刷新失敗，清除認證狀態
                    clearAuth();
                }
            } catch (error) {
                console.error('Token 自動刷新失敗:', error);
                clearAuth();
            }
        }, refreshTime);
    }, [saveToken, clearAuth]);

    // 登入處理
    const login = useCallback(async (loginData) => {
        try {
            const result = await authService.login(loginData);

            if (result.success) {
                saveToken(result.accessToken);

                // 取得完整的用戶資訊，確保有 name 欄位
                const userResult = await authService.getCurrentUser();
                const fullUser = userResult.success ? userResult.user : result.user;

                setUser(fullUser);
                setIsAuthenticated(true);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(fullUser));

                // 設定 token 自動刷新 (預設 15 分鐘)
                setupTokenRefresh(result.expiresIn || 900);

                return { success: true, user: fullUser };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('登入失敗:', error);
            return { success: false, message: error.message || '登入失敗' };
        }
    }, [saveToken, setupTokenRefresh]);

    // 處理已經取得資料的登入 (例如 Google 或是註冊後直接登入)
    const loginWithData = useCallback(async (data) => {
        if (data.accessToken) saveToken(data.accessToken);

        // 取得完整的用戶資訊，確保有 name 欄位
        let fullUser = data.user;
        try {
            const userResult = await authService.getCurrentUser();
            if (userResult.success) {
                fullUser = userResult.user;
            }
        } catch (error) {
            console.error('取得使用者資訊失敗:', error);
        }

        if (fullUser) {
            setUser(fullUser);
            localStorage.setItem('user', JSON.stringify(fullUser));
        }
        setIsAuthenticated(true);
        localStorage.setItem('isLoggedIn', 'true');

        // 設定 token 自動刷新
        setupTokenRefresh(data.expiresIn || 900);
    }, [saveToken, setupTokenRefresh]);

    // 登出處理
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('登出 API 呼叫失敗:', error);
        } finally {
            clearAuth();
        }
    }, [clearAuth]);

    // 檢查使用者是否為管理員
    const isAdmin = useCallback(() => {
        return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    }, [user]);

    // 檢查使用者是否為超級管理員
    const isSuperAdmin = useCallback(() => {
        return user?.role === 'SUPER_ADMIN';
    }, [user]);

    // 取得當前使用者資訊
    const fetchCurrentUser = useCallback(async () => {
        try {
            const result = await authService.getCurrentUser();
            if (result.success) {
                setUser(result.user);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(result.user));
                return result.user;
            }
            return null;
        } catch (error) {
            console.error('取得使用者資訊失敗:', error);
            return null;
        }
    }, []);

    // 初始化：嘗試用 refresh token 恢復登入狀態
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);

            // 檢查是否曾經登入過
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

            try {
                if (isLoggedIn) {
                    console.log('偵測到已登入狀態，嘗試刷新 Token...');
                    // 嘗試使用 refresh token 刷新 access token
                    const result = await authService.refreshToken();

                    if (result.success) {
                        console.log('Token 刷新成功');
                        saveToken(result.accessToken);

                        // 取得完整的用戶資訊，確保有 name 欄位
                        const userResult = await authService.getCurrentUser();
                        const fullUser = userResult.success ? userResult.user : result.user;

                        setUser(fullUser);
                        setIsAuthenticated(true);
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('user', JSON.stringify(fullUser));

                        // 設定自動刷新
                        if (result.expiresIn) {
                            setupTokenRefresh(result.expiresIn);
                        } else {
                            setupTokenRefresh(900);
                        }
                    } else {
                        // 刷新失敗且原本認為已登入，才清除狀態
                        console.warn('Token 刷新失敗，Session 可能已過期');
                        clearAuth();
                    }
                } else {
                    // 未登入狀態，直接結束載入
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('初始化認證時發生錯誤:', error);
                clearAuth();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // 清理函數
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [saveToken, setupTokenRefresh, clearAuth]);

    // Context 值
    const value = {
        user,
        isAuthenticated,
        isLoading,
        accessToken,
        login,
        loginWithData,
        logout,
        isAdmin,
        isSuperAdmin,
        fetchCurrentUser,
        clearAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 自訂 Hook 來使用 Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth 必須在 AuthProvider 內使用');
    }
    return context;
};

export default AuthContext;
