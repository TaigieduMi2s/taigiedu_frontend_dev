import React, { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import "./TranslateFeedback.css";

const TranslateFeedback = ({
  isOpen,
  onClose,
  originalContent,
  originalLanguage,
  translatedContent,
  translatedLanguage,
  onContentUpdate,
}) => {
  const { showToast } = useToast(); // 使用 useToast
  const [feedbackTranslated, setFeedbackTranslated] = useState(translatedContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 當 translatedContent 發生變化時，更新 feedbackTranslated
  useEffect(() => {
    setFeedbackTranslated(translatedContent);
  }, [translatedContent]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (isOpen) {
        event.preventDefault();
        window.history.pushState(null, "", window.location.href); // 保持當前狀態
      }
    };

    if (isOpen) {
      window.history.pushState(null, "", window.location.href); // 添加歷史記錄條目
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      if (isOpen) {
        window.history.replaceState(null, "", window.location.href);
      }
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  const handleTranslatedChange = (e) => {
    setFeedbackTranslated(e.target.value);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 準備 API 參數
      const parameters = {
        'mode': `${originalLanguage.toLowerCase()}_to_${translatedLanguage.toLowerCase()}`,
        'inputText': originalContent,
        'correctedText': feedbackTranslated
      };

      // 發送 API 請求
      const response = await fetch(`${import.meta.env.VITE_API_URL}/submit_tc_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // 顯示成功訊息
      showToast('回饋提交成功！感謝您的協助改進翻譯品質', 'success');
      onContentUpdate(feedbackTranslated); // 傳送修正後的內容
      onClose(); // 關閉彈窗
    } catch (error) {
      console.error('Feedback submission failed:', error);
      showToast('提交失敗，請稍後再試', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tran-feedback-overlay">
      <div className="tran-feedback-modal">
        <div className="tran-feedback-header">
          <div>內容修正回饋</div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="feedback-body">
          {/* 左右區域 */}
          <div className="feedback-original">
            <div className="feedback-language-display">{originalLanguage}</div>
            <div className="feedback-content-container">
              <div className="feedback-text-display">{originalContent}</div>
            </div>
          </div>

          <div className="feedback-target">
            <div className="feedback-language-display">{translatedLanguage}</div>
            <div className="feedback-content-container">
              <textarea
                className="feedback-text-input"
                placeholder="請輸入修正後的內容..."
                value={feedbackTranslated}
                onChange={handleTranslatedChange}
              />
            </div>
          </div>
        </div>

        <div className="feedback-footer">
          <button
            className={`feedback-submit-button ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslateFeedback;