import React, { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import "./TranslateTarget.css";
import speakerIcon from "../assets/speaker-wave.svg";
import chevronUpIcon from "../assets/chevron-up.svg";
import loadingIcon from "../assets/loading.png";

const TranslateTarget = ({
  isEditable,
  content,
  setTargetLanguage,
  onFeedbackOpen,
  availableLanguages,
  isOriginalModified = false, // 新增：原文是否被修改
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("台羅");
  const [isCopied, setIsCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // 當 availableLanguages 改變時，選擇對應的第一個可用語言
  useEffect(() => {
    if (availableLanguages.length > 0) {
      setSelectedLanguage(availableLanguages[0]);
      setTargetLanguage(availableLanguages[0]);
    }
  }, [availableLanguages, setTargetLanguage]);

  const handleCopy = () => {
    if (content.trim() === "") return;
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch((err) => {
        console.error("複製失敗:", err);
      });
  };

  const handleLanguageChange = (e) => {
    const language = e.target.value;
    setSelectedLanguage(language);
    setTargetLanguage(language);
  };

  const handlePlayAudio = async () => {
    if (!content.trim()) {
      showToast("沒有可播放的內容！", 'error');
      return;
    }

    // 設置載入中狀態，但還不是播放中
    setIsLoading(true);

    try {
      let ttsLang = "tb"; // 預設是漢羅

      // switch (selectedLanguage) {
      //   case "台羅":
      //     ttsLang = "tl";
      //     break;
      //   case "漢羅":
      //     ttsLang = "tb";
      //     break;
      //   case "白話字":
      //     ttsLang = "poj";
      //     break;
      //   default:
      //     ttsLang = "tb"; // 預設漢羅
      // }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/synthesize_speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tts_lang: ttsLang,
          tts_data: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP 錯誤！狀態碼：${response.status}`);
      }

      const synthesizedAudioBase64 = await response.text(); // API 回傳 Base64 音訊

      // 創建音頻對象
      const audioSrc = `data:audio/wav;base64,${synthesizedAudioBase64}`;
      const audio = new Audio(audioSrc);

      // 預先加載音頻
      await new Promise((resolve, reject) => {
        audio.onloadeddata = resolve;
        audio.onerror = reject;

        // 10秒後如果還沒加載完成就超時
        const timeout = setTimeout(() => {
          reject(new Error("音訊加載超時"));
          showToast("音訊加載超時", 'error');
        }, 10000);

        // 清除超時計時器
        audio.onloadeddata = () => {
          clearTimeout(timeout);
          resolve();
        };
      });

      // 音頻加載完成，設置載入狀態為 false，播放狀態為 true
      setIsLoading(false);
      setIsPlaying(true);

      // 播放音頻
      await audio.play();

      // 監聽播放結束
      audio.onended = () => {
        setIsPlaying(false);
      };

    } catch (error) {
      console.error("語音合成失敗:", error);
      showToast("語音合成或播放失敗，請稍後再試", 'error');
      // 重置所有狀態
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <div className="translate-content">
      <div className="dropdown-container">
        <select
          className="language-dropdown"
          value={selectedLanguage}
          onChange={handleLanguageChange}
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <img
          src={chevronUpIcon}
          alt="dropdown arrow"
          className="dropdown-arrow"
        />
      </div>

      <div className="target-content-container">
        <div
          className={`target-display-box ${isEditable ? "editable" : "non-editable"
            }`}
        >
          {content || <span className="tran-placeholder">轉換內容</span>}

          {isEditable && (
            <button
              className={`play-audio-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={handlePlayAudio}
              disabled={isPlaying || isLoading}
              aria-label={isLoading ? "載入中" : isPlaying ? "播放中" : "播放音訊"}
            >
              {isLoading ? (
                <img
                  src={loadingIcon}
                  className="loading-icon"
                  alt="載入中"
                />
              ) : (
                <img
                  src={speakerIcon}
                  className="play-icon"
                  alt="播放"
                />
              )}
            </button>
          )}
        </div>

        <button
          className={`copy-button-translate ${isCopied ? "copied" : ""}`}
          disabled={!isEditable || content.trim() === "" || isOriginalModified}
          onClick={handleCopy}
        >
          {isCopied ? "文字已複製！" : "複製全文"}
        </button>
      </div>

      <button
        className="tran-feedback-button"
        disabled={!isEditable || content.trim() === "" || isOriginalModified}
        onClick={onFeedbackOpen}
      >
        內容修正回饋
      </button>
    </div>
  );
};

export default TranslateTarget;