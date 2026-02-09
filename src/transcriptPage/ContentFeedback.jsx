import React, { useState, useEffect } from "react";
import { useToast } from "../components/Toast";// 引入 useToast
import "./ContentFeedback.css";

const ContentFeedback = ({ isOpen, onClose, content, onSubmit, audioSource, activeTab }) => {
  const { showToast } = useToast();// 使用 useToast
  const [editableContent, setEditableContent] = useState(content || ""); // 預設為傳遞的內容
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handlePopState = (event) => {
      if (isOpen) {
        // 阻止返回頁面行為
        event.preventDefault();
        window.history.pushState(null, "", window.location.href); // 重新添加條目
      }
    };

    if (isOpen) {
      // 初始化內容
      setEditableContent(content);
      // 添加一個新的歷史記錄條目
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      if (isOpen) {
        window.history.replaceState(null, "", window.location.href);
      }

      // 滾動到頁面頂部
      window.scrollTo(0, 0);

      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, content]);

  const handleContentChange = (event) => {
    setEditableContent(event.target.value); // 更新可編輯內容
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 準備 base64 音訊數據
      let base64Audio = '';
      if (audioSource) {
        const response = await fetch(audioSource);
        const blob = await response.blob();
        const reader = new FileReader();
        base64Audio = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      // 準備語言代碼
      const langMap = {
        '台文漢字': 'tb',
        '台羅': 'tl',
        '白話字': 'poj'
      };

      const parameters = {
        audio_text: editableContent,
        audio_lang: langMap[activeTab],
        audio_data: base64Audio
      };

      console.log('Full Parameters:', parameters);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/submit_stt_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
        throw new Error('回饋提交失敗');
      }

      showToast('提交成功，感謝您的回饋！', 'success');
      onSubmit(editableContent);
      onClose();
    } catch (error) {
      console.error('Feedback submission failed:', error);
      showToast('提交失敗，請稍後再試', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null; // 如果視窗未打開，不渲染任何內容

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>

        <p>語音：</p>
        <audio controls>
          {audioSource ? (
            <source src={audioSource} type="audio/wav" />
          ) : (
            <span>無可用的音訊</span>
          )}
          您的瀏覽器不支援音訊播放。
        </audio>

        <p>正確文字：</p>
        <textarea
          className="feedback-textarea"
          value={editableContent} // 綁定到可編輯的內容
          onChange={handleContentChange} // 更新內容
          placeholder="請輸入您的回饋內容..."
        ></textarea>

        <div className="modal-actions">
          <button
            className={`modal-button ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '送出'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentFeedback;
