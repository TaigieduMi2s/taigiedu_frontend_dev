import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { authenticatedFetch } from "../services/authService";
import "./FilePreview.css";
import likesIconFilled from "../assets/resourcepage/Union (Stroke)(black).svg";
import likesIconOutline from "../assets/resourcepage/heart-outline-black.svg";
import downloadsIcon from "../assets/resourcepage/Subtract(black).svg";
import readAllIcon from "../assets/resourcepage/Vector (Stroke).svg";
import reportIcon from "../assets/report1.svg";
import defaultPreviewImage from "../assets/resourcepage/file_preview_demo.png";

const FilePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportReason, setReportReason] = useState("不雅內容");
  const [resourceData, setResourceData] = useState({
    imageUrl: "",
    fileType: "",
    title: "",
    uploader: "",
    date: "",
    fileUrl: "",
    resourceId: "",
    tags: []
  });

  // 檢舉理由選項
  const reportReasons = [
    "不雅內容",
    "涉及著作權疑慮",
    "政治不中立",
    "非台語文相關",
    "重複上傳",
    "廣告內容",
    "推廣管制商品",
    "涉及隱私",
    "涉及詐騙、詐欺或假冒"
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://dev.taigiedu.com/backend";
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

  // 從 URL 查詢參數取得資料
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);

      // 解析標籤
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(decodeURIComponent(searchParams.get("tags") || "[]"));
      } catch (e) {
        console.error("解析標籤錯誤:", e);
        parsedTags = [];
      }

      // 處理圖片和檔案 URL 的函數
      const getFullUrl = (url, isImage = false) => {
        if (!url) {
          return isImage ? defaultPreviewImage : "";
        }
        // 如果是本地預設圖片路徑，使用 import 的圖片
        if (url === "/src/assets/resourcepage/file_preview_demo.png") {
          return defaultPreviewImage;
        }
        // 如果已經是完整的 HTTP/HTTPS URL，直接返回
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        // 否則添加 base URL
        return joinUrl(apiBaseUrl, url);
      };

      // 設置資源數據
      setResourceData({
        imageUrl: getFullUrl(searchParams.get("imageUrl"), true),
        fileType: searchParams.get("fileType") || "PDF",
        title: searchParams.get("title") || "無標題資源",
        uploader: searchParams.get("uploader") || "匿名上傳者",
        date: searchParams.get("date") || "未知日期",
        fileUrl: getFullUrl(searchParams.get("fileUrl")),
        resourceId: searchParams.get("id") || "",
        tags: parsedTags
      });

      // 設置計數器
      setLikesCount(parseInt(searchParams.get("likes") || "0", 10));
      setDownloadsCount(parseInt(searchParams.get("downloads") || "0", 10));

      const isLikeParam = searchParams.get("is_like");
      const likeStorage = JSON.parse(localStorage.getItem("resourceLikeStates") || "{}");
      const cachedLike = likeStorage[searchParams.get("id")];

      if (isLikeParam === "true" || isLikeParam === "1" || isLikeParam === "false" || isLikeParam === "0") {
        setIsLiked(isLikeParam === "true" || isLikeParam === "1");
      } else if (typeof cachedLike === "boolean") {
        setIsLiked(cachedLike);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("解析 URL 參數時發生錯誤:", error);
      setIsLoading(false);
    }
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="file-preview-loading">
        <div className="loading-spinner"></div>
        <p>載入資源預覽中...</p>
      </div>
    );
  }

  const handleViewDownloadPage = () => {
    if (!resourceData.fileUrl) {
      showToast("無法查看此資源，檔案連結不可用", "error");
      return;
    }

    navigate("/download", {
      state: {
        fileName: resourceData.title,
        pdfUrl: resourceData.fileUrl, // 這裡的 fileUrl 已經是完整的 URL
      },
    });
  };

  const handleDownload = async () => {
    if (!resourceData.fileUrl) {
      showToast("無法下載此資源，檔案連結不可用", "error");
      return;
    }

    try {
      // 如果有資源 ID，記錄下載
      if (resourceData.resourceId) {
        await authenticatedFetch(`${apiBaseUrl}/api/resource/download/${resourceData.resourceId}`, {
          method: "GET",
        });
      }

      // 使用 fetch 下載檔案並保持在當前頁面
      const response = await fetch(resourceData.fileUrl);
      const blob = await response.blob();

      // 創建下載連結
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${resourceData.title}.${resourceData.fileType.toLowerCase()}`);
      link.style.display = 'none';

      // 執行下載
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理 URL 物件
      window.URL.revokeObjectURL(downloadUrl);

      // 更新下載計數
      setDownloadsCount(prev => prev + 1);
      showToast("資源下載已開始", "success");
    } catch (error) {
      console.error("下載資源錯誤:", error);
      showToast("下載過程中發生錯誤，請稍後再試", "error");
    }
  };

  const handleLike = async () => {
    if (!resourceData.resourceId) {
      showToast("無法點讚此資源", "error");
      return;
    }

    try {
      if (isLikeLoading) return;
      setIsLikeLoading(true);

      // 準備點讚請求參數
      const parameters = {
        id: parseInt(resourceData.resourceId, 10)  // 確保 ID 是整數
      };

      // 發送點讚請求
      const response = await authenticatedFetch(`${apiBaseUrl}/api/resource/like`, {
        method: "POST",
        body: JSON.stringify(parameters)
      });

      const result = await response.json();
      console.log("點讚回應:", result);

      // 處理回應結果
      if (response.ok && (result?.status === "success" || result?.data?.success)) {
        const apiIsLiked = typeof result?.data?.is_like === "boolean" ? result.data.is_like : !isLiked;
        setIsLiked(apiIsLiked);

        const likeStorage = JSON.parse(localStorage.getItem("resourceLikeStates") || "{}");
        likeStorage[resourceData.resourceId] = apiIsLiked;
        localStorage.setItem("resourceLikeStates", JSON.stringify(likeStorage));

        if (typeof result?.data?.likes === "number") {
          setLikesCount(result.data.likes);
        } else {
          setLikesCount(prev => Math.max(0, prev + (apiIsLiked ? 1 : -1)));
        }

        const nextLikes = typeof result?.data?.likes === "number"
          ? result.data.likes
          : Math.max(0, likesCount + (apiIsLiked ? 1 : -1));

        const nextParams = new URLSearchParams(location.search);
        nextParams.set("is_like", apiIsLiked ? "true" : "false");
        nextParams.set("likes", String(nextLikes));
        window.history.replaceState(null, "", `${window.location.pathname}?${nextParams.toString()}`);

        showToast(apiIsLiked ? "已成功點讚此資源" : "已取消點讚", "success");
      } else {
        showToast(result?.data?.message || result.message || "點讚失敗，請稍後再試", "error");
      }
    } catch (error) {
      console.error("點讚操作錯誤:", error);
      showToast("網絡連接錯誤，請稍後再試", "error");
    } finally {
      setIsLikeLoading(false);
    }
  };

  // 檢舉功能 - 開啟 modal
  const handleReport = () => {
    setShowReportModal(true);
  };

  // 確認檢舉
  const handleConfirmReport = async () => {
    if (!resourceData.resourceId) {
      showToast("無法檢舉此資源", "error");
      return;
    }

    try {
      if (isReportLoading) return;
      setIsReportLoading(true);

      const payload = {
        id: String(resourceData.resourceId),
        username: user?.name || user?.username || user?.email || "匿名使用者",
        report_reason: reportReason,
        supplement: "",
        created_at: new Date().toISOString()
      };

      const response = await authenticatedFetch(`${apiBaseUrl}/api/resource/report`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && (result.success || result.status === "success")) {
        setShowReportModal(false);
        showToast(result.message || "檢舉已提交，感謝您的回報", "success");
      } else {
        showToast(result.message || "檢舉失敗，請稍後再試", "error");
      }
    } catch (error) {
      console.error("檢舉送出錯誤:", error);
      showToast("網絡連接錯誤，請稍後再試", "error");
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <div className="file-preview-page">
      <div className="file-preview-header">
        <h1 className="file-title">{resourceData.title}</h1>

        <div className="file-separator">&nbsp;</div>

        <div className="file-info">
          <span>{resourceData.date}</span>

          <div className="file-likes">
            <img
              src={isLiked ? likesIconFilled : likesIconOutline}
              alt={isLiked ? "Liked" : "Not liked"}
              className="file-likes-icon"
            />
            <span>{likesCount}</span>
          </div>
          <div className="file-downloads">
            <img
              src={downloadsIcon}
              alt="Downloads"
              className="file-downloads-icon"
            />
            <span>{downloadsCount}</span>
          </div>
        </div>

        <div className="file-uploader">AUTHOR：{resourceData.uploader}</div>

        <div className="file-tags">
          {resourceData.tags.map((tag, index) => (
            <span key={index} className="file-tag">
              {tag}
            </span>
          ))}
        </div>

        <button className="file-download-button" onClick={handleDownload}>
          下載資源
        </button>

        <button
          className={`file-like-button ${isLiked ? 'liked' : ''} ${isLikeLoading ? 'is-loading' : ''}`}
          onClick={handleLike}
          disabled={isLikeLoading}
        >
          {isLikeLoading ? '處理中...' : (isLiked ? '已點讚' : '點讚資源')}
        </button>
      </div>

      <div className="file-preview-image">
        <img src={resourceData.imageUrl} alt={resourceData.title} />
      </div>

      {/* 檢舉按鈕 - 右下角 */}
      <button className="file-report-button" onClick={handleReport}>
        <img src={reportIcon} alt="檢舉" className="report-icon" />
        <span>檢舉資源</span>
      </button>

      <div className="file-bottom-fixed" onClick={handleViewDownloadPage}>
        <img src={readAllIcon} alt="閱讀全部" />
        閱讀全部
      </div>

      {/* 檢舉 Modal */}
      {showReportModal && (
        <div className="report-modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <button className="report-modal-close" onClick={() => setShowReportModal(false)}>
              ×
            </button>
            <div className="report-modal-title">
              <span className="required">*</span>檢舉理由：
            </div>
            <div className="report-modal-options">
              {reportReasons.map((reason) => (
                <label key={reason} className="report-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <button
              className={`report-modal-submit ${isReportLoading ? 'is-loading' : ''}`}
              onClick={handleConfirmReport}
              disabled={isReportLoading}
            >
              {isReportLoading ? '送出中...' : '確定'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;