import React, { useState, useEffect } from "react";
import "./ReadContent.css";
import { useFontSize, useLang } from "./ReadPage";
import { useToast } from "../components/Toast";
import loadingImage from "/src/assets/record_loading.svg"; // 處理中圖示

const ReadContent = () => {
  const { fontSize } = useFontSize(); // 獲取當前字體大小
  const { selectedLang } = useLang();

  const maxCharLimit = 500; // 最大字數限制
  const [content, setContent] = useState(""); // 輸入框內容
  const [remainingChars, setRemainingChars] = useState(maxCharLimit); // 剩餘字數
  const [audioSrc, setAudioSrc] = useState(null); // 音檔的 URL
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // 按鈕禁用狀態
  const [initialContent, setInitialContent] = useState(""); // 音檔生成時的文字
  const [isProcessing, setIsProcessing] = useState(false); // 處理中狀態
  // const [error, setError] = useState(null);
  const { showError, showToast } = useToast();

  const handleInputChange = (e) => {
    const text = e.target.value;
    setContent(text);
    setRemainingChars(maxCharLimit - text.length);

    if (text !== initialContent) {
      setIsButtonDisabled(false);
      setAudioSrc(null); // 清除音檔，禁用下載按鈕
    }
  };

  const handleGenerateAudio = async () => {
    if (content.trim() === "") return;

    setIsProcessing(true);
    setIsButtonDisabled(true);
    setAudioSrc(null);

    try {
      showError(null); // 重置錯誤狀態
      const parameters = {
        tts_lang: selectedLang,
        tts_data: content.replace(/\n/g, " ") // 過濾掉換行符號，替換為空格
      };
      console.log('API Parameters:', parameters);

      // 創建一個超時 Promise
      const timeout = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('請求超時，伺服器回應時間過長'));
        }, 60000); // 60 秒超時
      });

      // 創建 fetch Promise
      const fetchPromise = fetch(`${import.meta.env.VITE_API_URL}/synthesize_speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
      });

      // 讓兩個 Promise 競爭，哪個先完成就用哪個結果
      const response = await Promise.race([fetchPromise, timeout]);

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const synthesized_audio_base64 = await response.text();
      const audioUrl = `data:audio/wav;base64,${synthesized_audio_base64}`;
      setAudioSrc(audioUrl);
      setInitialContent(content);
    } catch (error) {
      console.error('Error generating audio:', error);
      // 根據錯誤類型顯示不同的錯誤訊息
      if (error.message === '請求超時，伺服器回應時間過長') {
        showError('伺服器回應時間過長，請稍後再試！');
      } else {
        showError('伺服器發生錯誤，請稍後再嘗試！');
      }
      setIsButtonDisabled(false); // 恢復按鈕可點擊狀態
    } finally {
      setIsProcessing(false);
    }
  };
  useEffect(() => {
    if (content.trim() !== "") {  // 只有在有內容時才啟用按鈕
      setIsButtonDisabled(false);
    }
  }, [selectedLang]);
  // 音檔生成後的檢查
  useEffect(() => {
    if (audioSrc) {
      console.log("音檔生成:", audioSrc);
    }
  }, [audioSrc]);

  return (
    <div className="read-content">
      {/* 大輸入框 */}
      <textarea
        className={`input-box ${fontSize}`} // 根據字體大小動態
        placeholder="請在此輸入文字..."
        value={content}
        onChange={handleInputChange}
        maxLength={maxCharLimit}
      />

      {/* 剩餘字數 */}
      <div className={`remaining-chars ${remainingChars <= 50 ? "low" : ""}`}>
        剩餘字數：{remainingChars}
      </div>
      {/* 錯誤提示 */}
      {/* {error && (
        <div className="error-toast">
          {error}
        </div>
      )} */}
      {/* 按鈕區域 */}
      <div className="audio-button-container">
        <button
          className={`generate-audio-button ${isProcessing
            ? "processing"
            : content.trim() === "" || isButtonDisabled
              ? "disabled"
              : "enabled"
            }`}
          onClick={handleGenerateAudio}
          disabled={isProcessing || content.trim() === "" || isButtonDisabled}
        >
          {isProcessing ? (
            <>
              <span>處理中</span>
              <img
                src={loadingImage}
                alt="Processing"
                className="loading-icon"
              />
            </>
          ) : (
            "產生音檔"
          )}
        </button>
        {/* 音檔播放條與下載按鈕 */}
        {audioSrc && !isProcessing && (
          <>
            <audio controls>
              <source src={audioSrc} type="audio/wav" />
              您的瀏覽器不支援音檔播放。
            </audio>
            <button
              className="generate-audio-button enabled"
              onClick={() => {
                // 創建一個暫時的 a 元素來觸發下載
                const downloadLink = document.createElement('a');
                downloadLink.href = audioSrc;
                downloadLink.download = '台語音檔.wav'; // 設定下載的檔案名稱
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              }}
            >
              下載音檔
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReadContent;
