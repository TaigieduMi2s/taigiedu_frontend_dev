import React from "react";
import Card from "../components/Card/Card";
import "./ResourceCard.css";
import filePreviewDemo from "../assets/resourcepage/file_preview_demo.png"; // 預設圖片

/**
 * 台語教學資源共享平台的資源卡片。
 *
 * 內部已改為 `components/Card` 的 composition 積木組裝，**對外 props 介面完全沒變**
 * （`/resource`、`/delete-resource`、`/admin/resource` 三個呼叫端不需要任何修改）。
 *
 * 兩個刻意保留的相容細節，改動前請先看 ResourceCard.css 底部的「composition 相容層」：
 * 1. 根節點同時掛 `cc-card` 與 `resource-card`——`ResourceContent.css` 與 `AdminResourcePage.css`
 *    靠 `.resource-card` 這個名字覆寫尺寸與下架／被檢舉狀態，不能拿掉。
 * 2. 內層有兩個元素刻意保留舊 class 名，因為**專案外部有同名規則正在生效**，拿掉畫面就會變：
 *    - 預覽圖 `cc-preview card-header`：`index.html` 從 CDN 載入的 Bootstrap 5.1.1 也定義了
 *      `.card-header`，提供預覽圖下緣 1px 底線與上緣 3px 圓角。
 *    - 標題 `cc-title card-title`：`adminPage/adminMain.css` 的 `.card-title` 排在本檔之後，
 *      實際生效的字級／字重／顏色／下方 16px 間距其實來自那裡，不是本檔的 `.card-title`。
 *    其餘內層元素經實測沒有任何外部規則命中，已全部改為純 cc- 前綴。
 */
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
  onLikeClick, // 選填：傳入後右上角愛心可點擊收藏（不傳則維持純顯示，刪除頁／後台不受影響）
  isLikeLoading = false,
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

    if (normalizedPath.startsWith("api/")) {
      normalizedPath = normalizedPath.replace(/^api\//, "");
    }

    if (normalizedBase.endsWith("/backend") && normalizedPath.startsWith("backend/")) {
      normalizedPath = normalizedPath.replace(/^backend\//, "");
    }

    if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("api/")) {
      normalizedPath = normalizedPath.replace(/^api\//, "");
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
    <Card className="resource-card" onClick={handleCardClick}>
      {/* 卡片標頭區域，背景圖片 */}
      <Card.Preview className="card-header" imageUrl={getFullImageUrl(imageUrl)}>
        <Card.FileType>{fileType}</Card.FileType>
        {/* 顯示喜歡與下載數量 */}
        <Card.Stats
          likes={likes}
          downloads={downloads}
          isLiked={isLiked}
          onLikeClick={onLikeClick}
          likeDisabled={isLikeLoading}
        />
      </Card.Preview>

      {/* 卡片內容 */}
      <Card.Content>
        {/* 資源標題 */}
        <Card.Title className="card-title">{title}</Card.Title>
        {/* 上傳者名稱 */}
        <Card.Uploader name={uploader} />
        {/* 資源標籤 */}
        <Card.Tags tags={date ? [String(date).slice(0, 4), ...tags] : tags} />
      </Card.Content>
    </Card>
  );
};

export default ResourceCard;
