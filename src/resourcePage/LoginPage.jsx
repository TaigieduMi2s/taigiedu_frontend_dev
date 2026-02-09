import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import ForgetPassword from "./ForgetPassword";
import "./LoginPage.css";

const LoginPage = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login, loginWithData, isAuthenticated } = useAuth();

  // 判斷是否為彈窗模式（從 Header 開啟）
  const isModalMode = typeof onClose === 'function';

  // 取得驗證碼
  const fetchCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/captcha`, {
        method: "GET"
      });

      const data = await response.json();

      if (response.ok && data.id && data.image) {
        setCaptchaId(data.id);
        setCaptchaImage(data.image);
        setCaptcha(""); // 清空輸入的驗證碼
      } else {
        showToast("無法載入驗證碼，請重試", "error");
      }
    } catch (error) {
      console.error("取得驗證碼失敗:", error);
      showToast("取得驗證碼時發生錯誤", "error");
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // 檢查必填欄位
    if (!email || !password || !captcha) {
      showToast("請填寫所有必填欄位", "error");
      return;
    }

    // 檢查驗證碼 ID
    if (!captchaId) {
      showToast("驗證碼無效，請重新整理", "error");
      fetchCaptcha();
      return;
    }

    // 設置提交狀態
    setIsSubmitting(true);

    try {
      // 使用 AuthContext 的 login 函數
      const result = await login({
        username: email,
        password: password,
        captchaId: captchaId,
        captcha: captcha
      });

      if (result.success) {
        // 登入成功處理
        showToast("登入成功！", "success");

        // 如果是彈窗模式，關閉彈窗
        if (isModalMode) {
          onClose();
        } else if (location.state?.redirectTo) {
          // 導航到之前嘗試訪問的頁面或首頁
          navigate(location.state.redirectTo, { replace: true });
        } else {
          navigate(-1); // 返回上一頁
        }
      } else {
        // 登入失敗處理
        showToast(result.message || "登入失敗，請檢查帳號和密碼！", "error");
        // 登入失敗後重新載入驗證碼
        fetchCaptcha();
      }
    } catch (error) {
      console.error("登入請求失敗:", error);
      showToast("登入過程中發生錯誤，請稍後再試", "error");
      // 發生錯誤後重新載入驗證碼
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // 如果有 onClose prop (彈窗模式)，使用它；否則使用 navigate
    if (isModalMode) {
      onClose();
    } else {
      navigate(-1); // 點擊關閉按鈕返回上一頁
    }
  };

  const handleRegister = () => {
    navigate("/register"); // 跳轉到註冊頁面
  };

  // Google 登入 callback 函數
  const handleGoogleLogin = async (response) => {
    try {
      const credential = response.credential; // Google ID Token
      console.log("Google credential received:", credential);

      setIsSubmitting(true);

      // 呼叫後端 API 驗證 Google token
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/user/google_login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ credential: credential })
      });

      const data = await apiResponse.json();
      console.log("Google 登入 API 回應:", data);

      if (data.success) {
        // Google 登入成功
        showToast("Google 登入成功！", "success");

        // 使用 AuthContext 的 loginWithData 保存狀態並更新 UI
        loginWithData({
          accessToken: data.accessToken,
          user: data.user,
          expiresIn: data.expiresIn
        });

        // 如果是彈窗模式，關閉彈窗
        if (isModalMode) {
          onClose();
        } else if (location.state?.redirectTo) {
          navigate(location.state.redirectTo, { replace: true });
        } else {
          navigate("/");
        }
      } else {
        showToast(data.message || "Google 登入失敗", "error");
      }
    } catch (error) {
      console.error("Google 登入失敗:", error);
      showToast("Google 登入過程中發生錯誤", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // 組件載入時取得驗證碼
    fetchCaptcha();

    // 初始化 Google Sign-In
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "89678427593-9u5iffjjqb6ls27nn99mu3ehidd38kvb.apps.googleusercontent.com",
        callback: handleGoogleLogin,
        auto_select: false
      });

      // 渲染 Google 登入按鈕
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        {
          type: "standard",
          size: "large",
          theme: "outline",
          text: "continue_with",
          width: 250
        }
      );
    }

    // 檢查是否已登入，如果已登入且有重定向目標，則導航到該目標
    if (isAuthenticated && location.state?.redirectTo) {
      navigate(location.state.redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-container">
        <div className="login-modal-header">
          <div>登入</div>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        {/* 第三方登入區 */}
        <div className="third-party-login">
          <div className="separator">&nbsp;</div>
          <p>使用第三方登入：</p>
          <div id="googleSignInButton" style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}></div>
          <p>或是</p>
          <div className="separator">&nbsp;</div>
          <p>本站帳號登入：</p>
        </div>

        {/* 本站帳號登入表單 */}
        <form className="login-modal-form" onSubmit={handleLogin}>
          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>帳號
            </span>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入您的電子郵件"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>密碼
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入您的密碼"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>請輸入驗證碼
            </span>
            <div className="captcha-input-container">
              <input
                type="text"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="請輸入驗證碼"
                disabled={isSubmitting || isLoadingCaptcha}
                required
                className="captcha-input"
              />
              {captchaImage && (
                <div className="captcha-image-wrapper">
                  <img
                    src={captchaImage}
                    alt="驗證碼"
                    className="captcha-image"
                  />
                  <button
                    type="button"
                    className="captcha-refresh-button"
                    onClick={fetchCaptcha}
                    disabled={isSubmitting || isLoadingCaptcha}
                    title="重新整理驗證碼"
                  >
                    ↻
                  </button>
                </div>
              )}
              {isLoadingCaptcha && (
                <div className="captcha-loading">載入中...</div>
              )}
            </div>
          </label>

          <button
            type="submit"
            className="login-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "登入中..." : "登入"}
          </button>
        </form>

        {/* 註冊按鈕 */}
        <div className="register-button-container">
          <button
            className="register-button"
            onClick={handleRegister}
            disabled={isSubmitting}
          >
            沒有帳號？進行註冊
          </button>
        </div>

        {/* 忘記密碼連結 */}
        <div className="forgot-password-container">
          <span
            className="forgot-password-link"
            onClick={() => setIsForgotPasswordOpen(true)}
          >
            忘記密碼
          </span>
        </div>
      </div>

      {/* 忘記密碼 Modal */}
      <ForgetPassword
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default LoginPage;