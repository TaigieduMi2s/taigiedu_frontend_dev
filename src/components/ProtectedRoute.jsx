import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 受保護的路由組件
 * 用於保護需要認證或特定角色才能訪問的頁面
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子組件
 * @param {boolean} props.requireAuth - 是否需要認證 (預設 true)
 * @param {boolean} props.requireAdmin - 是否需要管理員權限 (預設 false)
 * @param {string} props.redirectTo - 未認證時重定向的路徑 (預設 '/login')
 */
const ProtectedRoute = ({
    children,
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/login'
}) => {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();
    const location = useLocation();

    // 載入中顯示載入畫面
    if (isLoading) {
        return (
            <div className="protected-route-loading">
                <div className="loading-spinner"></div>
                <p>載入中...</p>
            </div>
        );
    }

    // 需要認證但未認證
    if (requireAuth && !isAuthenticated) {
        return (
            <Navigate
                to={redirectTo}
                state={{ redirectTo: location.pathname }}
                replace
            />
        );
    }

    // 需要管理員權限但不是管理員
    if (requireAdmin && !isAdmin()) {
        return (
            <Navigate
                to="/"
                state={{ error: '您沒有權限訪問此頁面' }}
                replace
            />
        );
    }

    return children;
};

/**
 * 管理員路由組件
 * 同時需要認證和管理員權限
 */
export const AdminRoute = ({ children }) => {
    return (
        <ProtectedRoute requireAuth={true} requireAdmin={true}>
            {children}
        </ProtectedRoute>
    );
};

export default ProtectedRoute;
