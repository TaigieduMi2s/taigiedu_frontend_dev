import React, { useState } from "react";
import { useToast } from "../components/Toast";
import "./TranslatePage.css";
import arrowRightIcon from "../assets/arrow-right.svg";
import loadingImage from "../assets/record_loading.svg";

import TranslateOriginal from "./TranslateOriginal";
import TranslateTarget from "./TranslateTarget";
import TranslateFeedback from "./TranslateFeedback";

// 支援的語言選項
const languageOptions = {
  台文漢字: ["台羅", "華文", "白話字"],
  華文: ["台羅", "台文漢字", "白話字"],
  台羅: ["白話字"],
  白話字: ["台羅"],
};

// API 支援的直接轉換模式
const directConversionModes = {
  "台文漢字_台羅": "tbn2tl",
  "台文漢字_華文": "tbn2zh",
  "台羅_白話字": "tl2poj",
  "白話字_台羅": "poj2tl",
  "華文_台文漢字": "zh2tbn"
};

// 需要中間轉換的路徑（多步驟轉換）
const conversionPaths = {
  "台文漢字_白話字": [
    { from: "台文漢字", to: "台羅", mode: "tbn2tl" },
    { from: "台羅", to: "白話字", mode: "tl2poj" }
  ],
  "華文_台羅": [
    { from: "華文", to: "台文漢字", mode: "zh2tbn" },
    { from: "台文漢字", to: "台羅", mode: "tbn2tl" }
  ],
  "華文_白話字": [
    { from: "華文", to: "台文漢字", mode: "zh2tbn" },
    { from: "台文漢字", to: "台羅", mode: "tbn2tl" },
    { from: "台羅", to: "白話字", mode: "tl2poj" }
  ]
};

const TranslatePage = () => {
  const { showToast } = useToast();
  const [isEditable, setIsEditable] = useState(false);
  const [originalContent, setOriginalContent] = useState(""); // 原文內容
  const [translatedContent, setTranslatedContent] = useState(""); // 翻譯後的內容
  const [originalLanguage, setOriginalLanguage] = useState("華文"); // 原始語言
  const [targetLanguage, setTargetLanguage] = useState(languageOptions["華文"][0]); // 目標語言
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false); // 控制回饋頁面
  const [loading, setLoading] = useState(false); // 控制翻譯請求的 loading 狀態
  const [isOriginalModified, setIsOriginalModified] = useState(false); // 追蹤原文是否被修改

  // 當原始語言變更時，更新目標語言選項
  const handleOriginalLanguageChange = (language) => {
    setOriginalLanguage(language);
    // 選擇該語言可用轉換選項中的第一個
    if (languageOptions[language] && languageOptions[language].length > 0) {
      setTargetLanguage(languageOptions[language][0]);
    } else {
      setTargetLanguage("");
    }
  };

  // 執行單次API轉換
  const performSingleConversion = async (mode, textToConvert) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/convert_taibun`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taibun_mode: mode,
        taibun_data: textToConvert,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.text();
  };

  const handleTranslate = async () => {
    if (!originalContent.trim() || !originalLanguage || !targetLanguage) {
      return;
    }

    // 如果源語言和目標語言相同
    if (originalLanguage === targetLanguage) {
      showToast(`${originalLanguage}轉${originalLanguage}，同語言轉換`, 'warning');
      setTranslatedContent(originalContent);
      setIsEditable(true);
      setIsOriginalModified(false); // 翻譯後重置修改狀態
      return;
    }

    setLoading(true);

    try {
      let result = originalContent;
      const conversionKey = `${originalLanguage}_${targetLanguage}`;

      // 檢查是否有直接轉換模式
      if (directConversionModes[conversionKey]) {
        // 單步轉換
        result = await performSingleConversion(directConversionModes[conversionKey], originalContent);
      }
      // 檢查是否有多步轉換路徑
      else if (conversionPaths[conversionKey]) {
        // 多步轉換
        let currentText = originalContent;
        const steps = conversionPaths[conversionKey];

        for (const step of steps) {
          currentText = await performSingleConversion(step.mode, currentText);
        }

        result = currentText;
      }
      // 不支援的轉換
      else {
        showToast(`不支援 ${originalLanguage} 到 ${targetLanguage} 的轉換`, 'error');
        setLoading(false);
        return;
      }

      setTranslatedContent(result);
      setIsEditable(true);
      setIsOriginalModified(false); // 翻譯後重置修改狀態
    } catch (error) {
      console.error("翻譯失敗:", error);
      showToast("翻譯過程發生錯誤，請稍後再試", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackOpen = () => {
    setIsFeedbackOpen(true);
  };

  const handleFeedbackClose = () => {
    setIsFeedbackOpen(false);
  };

  const handleFeedbackContentUpdate = (updatedContent) => {
    setTranslatedContent(updatedContent); // 更新翻譯內容
  };

  return (
    <div className="translate-page">
      {/* 原始輸入區 */}
      <TranslateOriginal
        setOriginalContent={setOriginalContent}
        setOriginalLanguage={handleOriginalLanguageChange}
        onContentChange={() => setIsOriginalModified(true)} // 當內容改變時設置為已修改
      />

      {/* 翻譯按鈕 */}
      <button
        className="translate-button"
        onClick={handleTranslate}
        disabled={
          loading ||
          originalContent.trim() === "" ||
          originalLanguage === "" || // 必須選擇原始語言
          targetLanguage === "" // 必須選擇目標語言
        }
      >
        {loading ? (
          <>
            翻譯中
            <img
              src={loadingImage}
              alt="loading"
              className="translate-arrow loading-icon"
            />
          </>
        ) : (
          <div className="translate-content-wrapper">
            翻譯
            <img
              src={arrowRightIcon}
              alt="translate arrow"
              className="translate-arrow"
            />
          </div>
        )}
      </button>

      {/* 翻譯後顯示區 */}
      <TranslateTarget
        isEditable={isEditable}
        content={translatedContent}
        setTargetLanguage={setTargetLanguage}
        targetLanguage={targetLanguage}
        availableLanguages={languageOptions[originalLanguage] || []} // 根據原始語言過濾可選擇的目標語言
        onFeedbackOpen={handleFeedbackOpen} // 傳遞開啟回饋頁面的函數
      />

      {/* 回饋頁面 */}
      <TranslateFeedback
        isOpen={isFeedbackOpen}
        onClose={handleFeedbackClose}
        originalContent={originalContent}
        originalLanguage={originalLanguage}
        translatedContent={translatedContent}
        translatedLanguage={targetLanguage}
        onContentUpdate={handleFeedbackContentUpdate}
      />
    </div>
  );
};

export default TranslatePage;