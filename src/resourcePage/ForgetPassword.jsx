import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import "./ForgetPassword.css";

const ForgetPassword = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Refs for OTP input fields
  const otpRefs = useRef([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setIsSubmitting(false);
      setCooldown(0);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast("請輸入電子郵件", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/request_password_reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message || "驗證碼已寄出", "success");
        setStep(2);
      } else {
        // If there's a cooldown, set the cooldown timer
        if (data.cooldown) {
          setCooldown(data.cooldown);
        }
        showToast(data.message || "發送驗證碼失敗", "error");
      }
    } catch (error) {
      console.error("請求失敗:", error);
      showToast("發生錯誤，請稍後再試", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2: Confirm password reset
  const handleConfirmReset = async (e) => {
    e.preventDefault();

    // Validation
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      showToast("請輸入完整的 6 位數驗證碼", "error");
      return;
    }

    if (!newPassword) {
      showToast("請輸入新密碼", "error");
      return;
    }

    if (!confirmPassword) {
      showToast("請輸入確認密碼", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("密碼與確認密碼不一致", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/confirm_password_reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp: parseInt(otpString, 10),
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message || "密碼重設成功，請使用新密碼登入", "success");
        onClose();
      } else {
        showToast(data.message || "驗證碼錯誤", "error");
      }
    } catch (error) {
      console.error("請求失敗:", error);
      showToast("發生錯誤，請稍後再試", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP keydown for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // If current input is empty and backspace is pressed, focus previous input
      otpRefs.current[index - 1]?.focus();
      // Also clear the previous input
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  // Handle paste for OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);

      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="forget-password-overlay" onClick={onClose}>
      <div
        className="forget-password-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="forget-password-header">
          <h2>忘記密碼</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        {step === 1 ? (
          <form className="forget-password-form" onSubmit={handleRequestReset}>
            <p className="forget-password-description">
              請輸入您註冊時使用的電子郵件，我們將會發送一組 6 位數驗證碼給您。
            </p>

            <label className="form-label">
              <span className="form-label-title">
                <span className="form-label-required">*</span>
                電子郵件
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入電子郵件"
                disabled={isSubmitting || cooldown > 0}
                required
              />
            </label>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || cooldown > 0}
            >
              {cooldown > 0
                ? `請稍候 ${cooldown} 秒再試`
                : isSubmitting
                  ? "送出中..."
                  : "送出"}
            </button>
          </form>
        ) : (
          <form className="forget-password-form" onSubmit={handleConfirmReset}>
            <p className="forget-password-description">
              我們已發送 6 位數驗證碼至您的信箱，請輸入驗證碼。
            </p>

            <div className="otp-section">
              <label className="form-label-title">
                <span className="form-label-required">*</span>
                驗證碼
              </label>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="otp-input"
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <label className="form-label">
              <span className="form-label-title">
                <span className="form-label-required">*</span>
                新密碼
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="請輸入新密碼"
                disabled={isSubmitting}
                required
              />
            </label>

            <label className="form-label">
              <span className="form-label-title">
                <span className="form-label-required">*</span>
                重新輸入新密碼
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="請再次輸入新密碼"
                disabled={isSubmitting}
                required
              />
            </label>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "送出中..." : "送出"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;
