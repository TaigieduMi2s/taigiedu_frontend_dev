import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import "./Header.css";
import logo from "./assets/new_logo_1111.svg";

// 導入原本的 LoginPage
import LoginPage from "./resourcePage/LoginPage";

const Header = () => {
  const { user, isAuthenticated, isLoading, logout, isAdmin } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // 處理登出
  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  // 點擊外部關閉用戶選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 取得用戶顯示名稱
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return '使用者';
  };

  // 取得用戶角色標籤
  const getRoleLabel = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return '超級管理員';
      case 'ADMIN':
        return '管理員';
      case 'MEMBER':
      default:
        return '會員';
    }
  };

  // 處理登入按鈕點擊
  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  // 處理登入模態框關閉
  const handleLoginClose = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <>
      <header className="header" data-testid="header">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" data-testid="header-logo" />
        </Link>

        <div className="header-right">
          {isLoading ? (
            <div className="header-loading">
              <div className="header-loading-spinner"></div>
            </div>
          ) : isAuthenticated ? (
            // 已登入：顯示用戶資訊
            <div className="header-user" ref={userMenuRef}>
              <button
                className="header-user-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
              >
                <div className="header-user-avatar">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
                <span className="header-user-name">{getUserDisplayName()}</span>
                <svg
                  className={`header-user-arrow ${isUserMenuOpen ? 'open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              {/* 用戶下拉選單 */}
              {isUserMenuOpen && (
                <div className="header-user-menu">
                  <div className="header-user-menu-info">
                    <div className="header-user-menu-name">{getUserDisplayName()}</div>
                    <div className="header-user-menu-email">{user?.email}</div>
                    <div className="header-user-menu-role">{getRoleLabel()}</div>
                  </div>

                  <div className="header-user-menu-divider"></div>

                  {isAdmin() && (
                    <>
                      <Link
                        to="/admin"
                        className="header-user-menu-item"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M7.333 2H2.667A.667.667 0 002 2.667v4.666c0 .369.298.667.667.667h4.666A.667.667 0 008 7.333V2.667A.667.667 0 007.333 2zM13.333 2H8.667A.667.667 0 008 2.667v2.666c0 .369.298.667.667.667h4.666a.667.667 0 00.667-.667V2.667A.667.667 0 0013.333 2zM13.333 8H8.667A.667.667 0 008 8.667v4.666c0 .369.298.667.667.667h4.666a.667.667 0 00.667-.667V8.667A.667.667 0 0013.333 8zM7.333 10H2.667A.667.667 0 002 10.667v2.666c0 .369.298.667.667.667h4.666A.667.667 0 008 13.333v-2.666A.667.667 0 007.333 10z" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        後台管理
                      </Link>
                      <div className="header-user-menu-divider"></div>
                    </>
                  )}

                  <button
                    className="header-user-menu-item header-user-menu-logout"
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10.667 11.333L14 8m0 0l-3.333-3.333M14 8H6M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 未登入：顯示登入按鈕 (使用 Footer 按鈕樣式)
            <button
              className="header-login-button"
              onClick={handleLoginClick}
            >
              登入
            </button>
          )}
        </div>
      </header>

      {/* 使用原本的 LoginPage 作為登入彈窗 */}
      {isLoginModalOpen && (
        <div className="header-login-modal-wrapper">
          <LoginPage onClose={handleLoginClose} />
        </div>
      )}
    </>
  );
};

export default Header;
