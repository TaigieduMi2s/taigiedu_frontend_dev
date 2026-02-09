import React, { useState, useEffect } from "react";
import loadingImage from "/src/assets/record_loading.svg"; // 處理中圖示
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { authenticatedFetch, getAccessToken, refreshToken } from "../services/authService";
import "./UploadResource.css";

const UploadResource = ({ isOpen, onClose, onUploadSuccess }) => {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [fileName, setFileName] = useState(""); // 儲存檔案名稱
  const [isProcessing, setIsProcessing] = useState(false); // 控制處理中的狀態
  const [isSuccess, setIsSuccess] = useState(false); // 上傳成功狀態
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    version: "",
    versionOther: "",
    book: "",
    contentType: "",
    contentTypeOther: "",
    file: null,
  });
  const [versionMapping, setVersionMapping] = useState({}); // 儲存年級與版本的映射

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

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/api/resource/versions`);
        const result = await response.json();
        if (response.ok) {
          setVersionMapping(result);
        } else {
          console.error("無法取得版本列表:", result);
        }
      } catch (error) {
        console.error("取得版本列表時發生錯誤:", error);
      }
    };

    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // 如果年級改變，重置版本
      if (name === "grade") {
        newData.version = "";
        newData.versionOther = "";
      }
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]; // 確認檔案存在
    if (file) {
      setFormData((prev) => ({ ...prev, file: file }));
      setFileName(file.name); // 更新檔案名稱
    } else {
      setFormData((prev) => ({ ...prev, file: null })); // 清空檔案
      setFileName("尚未選擇檔案"); // 預設值
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file) {
      showToast("請上傳檔案！", "error");
      return;
    }

    // 檢查用戶是否已登入
    if (!isAuthenticated || !user?.id) {
      showToast("請先登入後再上傳資源", "error");
      return;
    }

    setIsProcessing(true);

    try {
      // 準備 FormData
      const apiFormData = new FormData();

      // 上傳者資訊 - 從 auth context 獲取用戶資訊
      apiFormData.append("uploader_id", user.id);
      apiFormData.append("uploader_name", user.name || user.email?.split('@')[0] || "使用者");

      // 資源資訊
      apiFormData.append("title", formData.name);
      apiFormData.append("grade", formData.grade);

      // 處理版本，如果是其他則使用自定義輸入
      const version = formData.version === "其他" ? formData.versionOther : formData.version;
      apiFormData.append("version", version);

      apiFormData.append("book", formData.book);

      // 處理內容類型，如果是其他則使用自定義輸入
      const contentType = formData.contentType === "其他" ? formData.contentTypeOther : formData.contentType;
      apiFormData.append("contentType", contentType);

      // 從檔案擴展名獲取檔案類型
      const fileType = formData.file.name.split('.').pop().toLowerCase();
      apiFormData.append("fileType", fileType);

      // 初始統計
      apiFormData.append("likes", 0);
      apiFormData.append("downloads", 0);

      // 標籤 (可以從其他字段構建，這裡用名稱和版本作為示例)
      apiFormData.append("tags", `${formData.grade},${version},${contentType}`);

      // 主檔案
      apiFormData.append("file", formData.file);

      // 取得 Access Token 並建立帶有 OAuth2 驗證的請求
      let token = getAccessToken();

      // 建立發送請求的函數
      const sendUploadRequest = async (accessToken) => {
        const headers = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return fetch(`${import.meta.env.VITE_API_URL}/api/resource/upload`, {
          method: "POST",
          headers,
          body: apiFormData,
          credentials: 'include', // 確保 cookie 被傳送
        });
      };

      // 發送 API 請求
      let response = await sendUploadRequest(token);
      let result = await response.json();

      // 處理 401 錯誤或 Missing Authorization Header，嘗試刷新 token 並重試
      if (response.status === 401 ||
        result.message?.includes("Missing Authorization Header") ||
        result.error?.message?.includes("Missing Authorization Header")) {
        console.log("Token 可能已失效，嘗試刷新...");
        const refreshResult = await refreshToken();

        if (refreshResult.success) {
          // 重試上傳請求
          token = getAccessToken();
          response = await sendUploadRequest(token);
          result = await response.json();
        } else {
          // Token 刷新失敗，視為驗證錯誤
          showToast("登入狀態已失效，請重新登入", "error");
          console.error("Token 刷新失敗:", refreshResult.message);
          setIsProcessing(false);
          return;
        }
      }

      // 再次檢查是否有 Missing Authorization Header 錯誤
      const authErrorMessage = result.message || result.error?.message || "";
      if (authErrorMessage.includes("Missing Authorization Header")) {
        showToast("驗證失敗：缺少認證標頭，請重新登入", "error");
        console.error("上傳失敗 - 缺少認證標頭:", result);
        setIsProcessing(false);
        return;
      }

      if (response.ok && result.status === "success") {
        setIsSuccess(true);
        showToast(result.data.message || "資源上傳成功！", "success");

        // 延遲關閉視窗，讓用戶看到成功訊息
        setTimeout(() => {
          handleClose();
          // 調用 onUploadSuccess 通知父組件重新載入資料
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }, 2000);
      } else {
        showToast(result.message || "上傳失敗，請檢查輸入內容後重試", "error");
        console.error("上傳失敗:", result);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("上傳過程中發生錯誤:", error);
      showToast("發生網路錯誤，請稍後再試", "error");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      grade: "",
      version: "",
      versionOther: "",
      book: "",
      contentType: "",
      contentTypeOther: "",
      file: null,
    }); // 清空表單數據
    setFileName(""); // 清空檔案名稱
    setIsProcessing(false); // 重置處理狀態
    setIsSuccess(false); // 重置成功狀態
    onClose(); // 調用父組件的 onClose 關閉模態框
  };

  if (!isOpen) return null;

  return (
    <div className="upload-resource-overlay">
      <div className="upload-resource-container">
        <div className="upload-resource-header">
          <div>上傳資源</div>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <form className="upload-resource-form" onSubmit={handleSubmit}>
          {/* 資源名稱 */}
          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>名稱
            </span>
            <input
              type="text"
              name="name"
              placeholder="字數最多28字"
              maxLength="28"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isProcessing || isSuccess}
            />
          </label>

          {/* 階段 */}
          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>階段
            </span>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="grade"
                  value="高中"
                  onChange={handleInputChange}
                  required
                  disabled={isProcessing || isSuccess}
                />
                高中
              </label>
              <label>
                <input
                  type="radio"
                  name="grade"
                  value="國中"
                  onChange={handleInputChange}
                  disabled={isProcessing || isSuccess}
                />
                國中
              </label>
              <label>
                <input
                  type="radio"
                  name="grade"
                  value="國小"
                  onChange={handleInputChange}
                  disabled={isProcessing || isSuccess}
                />
                國小
              </label>
            </div>
          </label>

          {/* 版本 */}
          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>版本
            </span>
            <div className="radio-group">
              {(versionMapping[formData.grade] || []).map((version) => (
                <label key={version}>
                  <input
                    type="radio"
                    name="version"
                    value={version}
                    checked={formData.version === version}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing || isSuccess}
                  />
                  {version}
                </label>
              ))}
              <label>
                <input
                  type="radio"
                  name="version"
                  value="其他"
                  checked={formData.version === "其他"}
                  onChange={handleInputChange}
                  disabled={!formData.grade || isProcessing || isSuccess}
                />
                其他
                <input
                  type="text"
                  name="versionOther"
                  value={
                    formData.version === "其他" ? formData.versionOther : ""
                  } // 確保 hooks 行為穩定
                  onChange={handleInputChange}
                  disabled={formData.version !== "其他" || isProcessing || isSuccess}
                />
              </label>
            </div>
          </label>

          {/* 冊別 */}
          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>冊別
            </span>
            <p>※例如： 113 上冊</p>
            <input
              type="text"
              name="book"
              value={formData.book}
              onChange={handleInputChange}
              required
              disabled={isProcessing || isSuccess}
            />
          </label>

          {/* 內容類型 */}
          <label className="form-label">
            <span className="form-label-title">
              <span className="form-label-required">*</span>內容類型
            </span>
            <div className="radio-group">
              {["學習單", "簡報", "教案"].map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="contentType"
                    value={type}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing || isSuccess}
                  />
                  {type}
                </label>
              ))}
              <label>
                <input
                  type="radio"
                  name="contentType"
                  value="其他"
                  onChange={handleInputChange}
                  disabled={isProcessing || isSuccess}
                />
                其他
                <input
                  type="text"
                  name="contentTypeOther"
                  value={formData.contentTypeOther}
                  onChange={handleInputChange}
                  disabled={formData.contentType !== "其他" || isProcessing || isSuccess}
                />
              </label>
            </div>
          </label>

          {/* 上傳檔案 */}
          <label className="form-label">
            <input
              className="file-upload"
              type="file"
              name="file"
              accept=".pdf, .doc, .docx, .ppt, .pptx"
              onChange={handleFileChange}
              required
              disabled={isProcessing || isSuccess}
            />
            <div className="upload-button-wrapper">
              <span
                type="button"
                className={`upload-button ${fileName ? "uploaded" : ""}`}
              >
                {fileName ? "已上傳檔案！" : "上傳檔案"}
              </span>
              <span className="file-name">{fileName || "尚未選擇檔案"}</span>
            </div>

            <p>※限 PDF, PPT, DOC 可上傳，限制 100MB。</p>
          </label>

          {/* 提交按鈕 */}
          <div className="upload-resource-footer">
            <button
              type="submit"
              className={`submit-button ${isProcessing
                ? "processing"
                : isSuccess
                  ? "success-button"
                  : formData.name &&
                    formData.grade &&
                    formData.version &&
                    formData.book &&
                    formData.contentType &&
                    formData.file
                    ? "enabled"
                    : "disabled"
                }`}
              disabled={isProcessing || isSuccess} // 處理中或成功時禁用按鈕
            >
              {isProcessing ? (
                <>
                  <span>處理中</span>
                  <img
                    src={loadingImage} // 自定義圖片
                    alt="Processing"
                    className="loading-icon"
                  />
                </>
              ) : isSuccess ? (
                "上傳成功！"
              ) : (
                "送出"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadResource;