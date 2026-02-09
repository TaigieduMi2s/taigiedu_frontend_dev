import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import TermsDialog from "../components/TermsDialog";
import "./RegisterPage.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 條款相關狀態
  const [termsDialogType, setTermsDialogType] = useState(null); // 'terms' or 'privacy'
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    lastName: "",
    firstName: "",
    profession: "",
    professionOther: "",
    organization: "",
    usagePurpose: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (value === "其他") {
        setFormData((prev) => ({
          ...prev,
          usagePurpose: checked
            ? [...prev.usagePurpose, { type: value, custom: "" }]
            : prev.usagePurpose.filter((item) => item.type !== value),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          usagePurpose: checked
            ? [...prev.usagePurpose, { type: value }]
            : prev.usagePurpose.filter((item) => item.type !== value),
        }));
      }
    } else if (name === "customPurpose") {
      setFormData((prev) => ({
        ...prev,
        usagePurpose: prev.usagePurpose.map(
          (item) => (item.type === "其他" ? { ...item, custom: value } : item)
        ),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 處理條款 checkbox 點擊
  const handleTermsCheckboxClick = (e) => {
    if (!hasReadTerms) {
      e.preventDefault();
      setTermsDialogType('terms');
    } else {
      setAgreeTerms(e.target.checked);
    }
  };

  // 處理隱私權 checkbox 點擊
  const handlePrivacyCheckboxClick = (e) => {
    if (!hasReadPrivacy) {
      e.preventDefault();
      setTermsDialogType('privacy');
    } else {
      setAgreePrivacy(e.target.checked);
    }
  };

  // 開啟條款對話框
  const openTermsDialog = (type) => {
    setTermsDialogType(type);
  };

  // 關閉條款對話框
  const closeTermsDialog = () => {
    setTermsDialogType(null);
  };

  // 接受條款
  const handleAcceptTerms = () => {
    if (termsDialogType === 'terms') {
      setHasReadTerms(true);
      setAgreeTerms(true);
    } else if (termsDialogType === 'privacy') {
      setHasReadPrivacy(true);
      setAgreePrivacy(true);
    }
    closeTermsDialog();
  };

  // 檢查必填欄位是否都已填寫
  const isFormValid = () => {
    if (!formData.email || !formData.password || !formData.lastName ||
      !formData.firstName || !formData.profession || !formData.organization) {
      return false;
    }

    if (formData.usagePurpose.length === 0) {
      return false;
    }

    if (formData.profession === "其他" && !formData.professionOther) {
      return false;
    }

    const otherPurpose = formData.usagePurpose.find(item => item.type === "其他");
    if (otherPurpose && !otherPurpose.custom) {
      return false;
    }

    return true;
  };

  // 檢查送出按鈕是否應該啟用
  const isSubmitEnabled = () => {
    return isFormValid() && agreeTerms && agreePrivacy && !isSubmitting;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 檢查是否已同意條款
    if (!agreeTerms || !agreePrivacy) {
      showToast("請先閱讀並同意使用條款及隱私權政策", "error");
      return;
    }

    // 基本驗證
    if (formData.password !== formData.confirmPassword) {
      showToast("密碼與確認密碼不一致！", "error");
      return;
    }

    // 檢查必填欄位
    if (!formData.email || !formData.password || !formData.lastName || !formData.firstName || !formData.profession) {
      showToast("請填寫所有必填欄位", "error");
      return;
    }

    // 檢查至少選擇一個使用網站動機
    if (formData.usagePurpose.length === 0) {
      showToast("請至少選擇一個使用網站動機", "error");
      return;
    }

    // 如果選擇了"其他"職業，但沒有填寫說明
    if (formData.profession === "其他" && !formData.professionOther) {
      showToast("請填寫其他職業說明", "error");
      return;
    }

    // 如果選擇了"其他"使用動機，但沒有填寫說明
    const otherPurpose = formData.usagePurpose.find(item => item.type === "其他");
    if (otherPurpose && !otherPurpose.custom) {
      showToast("請填寫其他使用動機說明", "error");
      return;
    }

    // 準備 API 參數
    const parameters = {
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      lastName: formData.lastName,
      firstName: formData.firstName,
      profession: formData.profession,
      organization: formData.organization,
      usagePurpose: formData.usagePurpose,
    };

    // 只有當選擇"其他"職業時，才加入 professionOther
    if (formData.profession === "其他") {
      parameters.professionOther = formData.professionOther;
    }

    setIsSubmitting(true); // 開始提交

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parameters),
      });

      const data = await response.json();

      if (response.ok) {
        // 註冊成功
        console.log("Register success:", data);
        showToast("註冊成功！請查看您的電子郵件進行驗證", "success");
        setIsVerificationVisible(true); // 顯示驗證提示
      } else {
        // 註冊失敗
        console.error("Register failed:", data);
        // 顯示具體錯誤訊息
        showToast(data.message || "註冊失敗，請稍後再試", "error");
      }
    } catch (error) {
      console.error("Request error:", error);
      showToast("網路連線錯誤，請檢查您的網路連線", "error");
    } finally {
      setIsSubmitting(false); // 結束提交
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown === 0) {
      setResendCooldown(60); // 重置倒數計時

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/resend-verification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        });

        const data = await response.json();

        if (response.ok) {
          showToast("驗證信已重新發送", "success");
        } else {
          showToast(data.message || "重新發送驗證信失敗", "error");
        }
      } catch (error) {
        console.error("Resend verification error:", error);
        showToast("網路連線錯誤，請稍後再試", "error");
      }
    }
  };

  // 倒數計時邏輯
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown((prev) => prev - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleClose = () => {
    navigate(-1); // 返回上一頁
  };

  return (
    <div className="register-modal-overlay">
      {!isVerificationVisible ? (
        <>
          {/* 註冊表單 */}
          <div className="register-modal-container">
            <div className="register-modal-header">
              <div>註冊</div>
              <button className="close-button" onClick={handleClose}>
                ×
              </button>
            </div>

            <form className="register-modal-form" onSubmit={handleSubmit}>
              {/* 帳號（電子郵件信箱） */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>
                  帳號（電子郵件信箱）
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* 密碼 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>密碼
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* 再次輸入密碼 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>再次輸入密碼
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* 姓氏 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>姓氏
                </span>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* 名字 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>名字
                </span>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* 職業 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>職業
                </span>
                <div className="radio-group">
                  {["老師", "台語文相關工作者"].map((profession) => (
                    <label key={profession}>
                      <input
                        type="radio"
                        name="profession"
                        value={profession}
                        onChange={handleChange}
                        required
                      />
                      {profession}
                    </label>
                  ))}
                  <label>
                    <input
                      type="radio"
                      name="profession"
                      value="其他"
                      onChange={handleChange}
                    />
                    其他
                    <input
                      type="text"
                      name="professionOther"
                      value={
                        formData.profession === "其他"
                          ? formData.professionOther
                          : ""
                      }
                      onChange={handleChange}
                      disabled={formData.profession !== "其他"}
                      placeholder="請說明"
                    />
                  </label>
                </div>
              </label>

              {/* 服務單位 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>服務單位
                </span>
                <p>※例如：台南一中</p>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* 使用網站動機 */}
              <label className="form-label">
                <span className="form-label-title">
                  <span className="form-label-required">*</span>
                  使用網站動機（可多選）
                </span>
                <div className="checkbox-group">
                  {["備課", "自學"].map((purpose) => (
                    <label key={purpose}>
                      <input
                        type="checkbox"
                        value={purpose}
                        onChange={handleChange}
                      />
                      {purpose}
                    </label>
                  ))}
                  <label>
                    <input
                      type="checkbox"
                      value="其他"
                      onChange={handleChange}
                    />
                    其他
                    <input
                      type="text"
                      name="customPurpose"
                      placeholder="請說明"
                      onChange={handleChange}
                      disabled={
                        !formData.usagePurpose.some(
                          (item) => item.type === "其他"
                        )
                      }
                    />
                  </label>
                </div>
              </label>

              {/* 使用條款及隱私權政策同意區塊 */}
              <div className="terms-agreement-section">
                <p className="terms-agreement-title">
                  <span className="form-label-required">*</span>
                  使用條款與隱私權政策（必須閱讀完畢）：
                </p>

                <div className="terms-checkbox-group">
                  <label className="terms-checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={handleTermsCheckboxClick}
                      disabled={!hasReadTerms}
                    />
                    <span>我已閱讀並同意</span>
                    <button
                      type="button"
                      className="terms-link-button"
                      onClick={() => openTermsDialog('terms')}
                    >
                      《網站使用條款》
                    </button>
                  </label>

                  <label className="terms-checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={handlePrivacyCheckboxClick}
                      disabled={!hasReadPrivacy}
                    />
                    <span>我已閱讀並同意</span>
                    <button
                      type="button"
                      className="terms-link-button"
                      onClick={() => openTermsDialog('privacy')}
                    >
                      《隱私權政策》
                    </button>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="register-submit-button"
                disabled={!isSubmitEnabled()}
              >
                {isSubmitting ? "處理中..." : "送出"}
              </button>
            </form>
          </div>

          {/* 條款對話框 */}
          <TermsDialog
            isOpen={termsDialogType !== null}
            onClose={closeTermsDialog}
            onAccept={handleAcceptTerms}
            type={termsDialogType}
          />
        </>
      ) : (
        <>
          {/* 信箱驗證提醒視窗 */}
          <div className="verification-modal-container">
            <div className="verification-modal-header">
              <div>驗證您的信箱</div>
              <button className="close-button" onClick={handleClose}>
                ×
              </button>
            </div>
            <div className="verification-modal-content">
              <p>驗證信件已寄出，請於30分鐘之內至您的信箱完成驗證喔！</p>
              <button
                className="resend-button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `再次獲取驗證碼 (${resendCooldown}s)`
                  : "再次獲取驗證碼"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterPage;