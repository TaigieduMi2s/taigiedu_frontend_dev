import React from "react";
import "./ResourceCard.css";
import loveIconFilled from "../assets/Union (Stroke).svg";
import loveIconOutline from "../assets/resourcepage/heart-outline.svg";
import downloadIcon from "../assets/arrow-down-circle.svg";
import filePreviewDemo from "../assets/resourcepage/file_preview_demo.png"; // 預設圖片

const ResourceCard = ({
  imageUrl,
  fileType,
  likes,
  downloads,
  title,
  uploader, // 這可能是從 uploader_name 傳入的
  tags = [],
  date,
  isLiked = false,
  onCardClick, // 控制點擊事件的 prop
}) => {
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(); // 如果傳入了自定義點擊方法，則執行它
    }
  };

  // 處理圖片 URL，如果是相對路徑則添加 base URL
  const joinUrl = (base, path) => {
    const normalizedBase = String(base || "").replace(/\/+$/, "");
    let normalizedPath = String(path || "").replace(/^\/+/, "");

    normalizedPath = normalizedPath.replace(/\/{2,}/g, "/");

    if (normalizedPath.startsWith("backend/")) {
      normalizedPath = normalizedPath.replace(/^backend\//, "");
    }

    if (normalizedBase.endsWith("/backend") && normalizedPath.startsWith("backend/")) {
      normalizedPath = normalizedPath.replace(/^backend\//, "");
    }

    return `${normalizedBase}/${normalizedPath}`;
  };

  const getFullImageUrl = (url) => {
    if (!url || url === "/src/assets/resourcepage/file_preview_demo.png") {
      return filePreviewDemo;
    }
    // 如果 URL 已經是完整的 HTTP/HTTPS URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // 否則添加 base URL
    return joinUrl(import.meta.env.VITE_API_URL, url);
  };

  return (
    <div className="resource-card" onClick={handleCardClick}>
      {/* 卡片標頭區域，背景圖片 */}
      <div
        className="card-header"
        style={{ backgroundImage: `url(${getFullImageUrl(imageUrl)})` }}
      >
        <div className="file-type">{fileType}</div>
        <div className="stats">
          {/* 顯示喜歡數量 */}
          <div className="likes">
            <img
              src={isLiked ? loveIconFilled : loveIconOutline}
              alt={isLiked ? "Liked" : "Not liked"}
              className="likes-icon"
            />
            <span>{likes}</span>
          </div>
          {/* 顯示下載數量 */}
          <div className="downloads">
            <img
              src={downloadIcon}
              alt="Downloads"
              className="downloads-icon"
            />
            <span>{downloads}</span>
          </div>
        </div>
      </div>

      {/* 卡片內容 */}
      <div className="card-content">
        {/* 資源標題 */}
        <h3 className="card-title">{title}</h3>
        {/* 上傳者名稱 */}
        <p className="card-uploader">上傳者：{uploader}</p>
        {/* 資源標籤 */}
        <div className="card-tags">
          {tags.map((tag, index) => (
            <span key={index} className="card-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;