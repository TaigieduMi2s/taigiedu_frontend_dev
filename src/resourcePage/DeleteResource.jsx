import React, { useState, useEffect } from "react";
import "./DeleteResource.css";
import ResourceCard from "./ResourceCard";
import ConfirmDialog from "./ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import deleteIcon from "../assets/resourcepage/delete-icon.svg";
import arrowLeftCircle from "../assets/resourcepage/arrow-left-circle.svg";
import { authenticatedFetch } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";


const DeleteResource = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  // 資源相關狀態
  const [allResources, setAllResources] = useState([]); // 所有資源
  const [userResources, setUserResources] = useState([]); // 篩選後的使用者資源
  const [displayedResources, setDisplayedResources] = useState([]); // 當前頁顯示的資源
  const [isLoading, setIsLoading] = useState(true);

  // 分頁相關狀態
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const VISIBLE_PAGES = 10;

  // 組件掛載時檢查登入狀態並載入資源
  useEffect(() => {
    // 檢查用戶是否登入
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const currentUserId = localStorage.getItem("userId");
    const currentUsername = localStorage.getItem("username");

    if (!isLoggedIn || !currentUserId) {
      showToast("您需要登入才能查看自己的資源", "warning");
      navigate("/login", { state: { redirectTo: "/delete-resource" } });
      return;
    }

    setUserId(currentUserId);
    setUsername(currentUsername);

    if (!isAuthLoading) {
      // 載入資源
      fetchResources(currentUserId, currentUsername);
    }
  }, [navigate, showToast, isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading && userId && username) {
      fetchResources(userId, username);
    }
  }, [isAuthLoading, userId, username]);

  // 當使用者資源變化時更新分頁
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(userResources.length / ITEMS_PER_PAGE));
    setTotalPages(totalPages);

    // 如果當前頁超出範圍，重置到第一頁
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [userResources, currentPage]);

  // 當頁碼或使用者資源變化時更新顯示的資源
  useEffect(() => {
    updateDisplayedResources();
  }, [currentPage, userResources]);

  // 獲取所有資源並篩選出使用者的資源
  const fetchResources = async (currentUserId, currentUsername) => {
    setIsLoading(true);
    try {
      const parameters = {
        stage: "",
        version: "",
        keyword: "",
        searchContent: "",
        page: 1,
        limit: 1000 // 獲取所有資源
      };

      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/api/resource/search`, {
        method: "POST",
        body: JSON.stringify(parameters)
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        if (result.data && Array.isArray(result.data.resources)) {
          const resourcesList = result.data.resources;
          setAllResources(resourcesList);

          // 篩選出當前使用者的資源
          const filtered = resourcesList.filter(resource => {
            const matchById = resource.uploader_id && resource.uploader_id.toString() === currentUserId;
            const matchByName = resource.uploader_name === currentUsername;
            return matchById || matchByName;
          });

          setUserResources(filtered);
        } else {
          setAllResources([]);
          setUserResources([]);
        }
      } else {
        showToast("載入資源時發生錯誤，請稍後再試", "error");
        setAllResources([]);
        setUserResources([]);
      }
    } catch (error) {
      showToast("網絡連接錯誤，請檢查您的網絡連接", "error");
      setAllResources([]);
      setUserResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新當前頁顯示的資源
  const updateDisplayedResources = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, userResources.length);

    const resourcesForCurrentPage = userResources.slice(startIndex, endIndex);
    setDisplayedResources(resourcesForCurrentPage);
  };

  // 分頁處理函數
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const getPageNumbers = () => {
    let start = Math.max(1, currentPage - 4);
    let end = Math.min(totalPages, start + VISIBLE_PAGES - 1);

    if (end === totalPages) {
      start = Math.max(1, end - VISIBLE_PAGES + 1);
    }
    if (start === 1) {
      end = Math.min(totalPages, VISIBLE_PAGES);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // 顯示確認刪除對話框
  const handleDeleteDialog = (resource) => {
    setSelectedResource(resource);
    setIsDialogOpen(true);
  };

  // 確認刪除資源
  const handleConfirm = () => {
    if (!selectedResource || !selectedResource.id) {
      showToast("無法識別要刪除的資源", "error");
      setIsDialogOpen(false);
      return;
    }

    // 獲取登入使用者的 userId（參數名稱是 username 但要送 userId）
    const currentUserId = localStorage.getItem("userId");

    if (!currentUserId) {
      showToast("無法取得使用者資訊，請重新登入", "error");
      setIsDialogOpen(false);
      return;
    }

    // 根據你提供的 API 格式設定參數（參數名稱是 username，但值是 userId）
    const parameters = {
      resourceId: parseInt(selectedResource.id, 10),
      username: parseInt(currentUserId, 10)  // 參數名稱是 username，但實際送 userId
    };

    // 使用 fetch API 發送刪除請求
    authenticatedFetch(`${import.meta.env.VITE_API_URL}/api/resource/delete`, {
      method: "POST",
      body: JSON.stringify(parameters)
    })
      .then(response => {
        return response.text();
      })
      .then(text => {
        try {
          const response = JSON.parse(text);

          if (response.status === "success") {
            showToast("資源已成功刪除", "success");

            // 刪除成功後重新載入頁面
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showToast("刪除資源失敗: " + (response.message || "未知錯誤"), "error");
          }
        } catch (e) {
          showToast("無法解析伺服器回應", "error");
        }
      })
      .catch(error => {
        showToast("網絡連接錯誤: " + error.message, "error");
      })
      .finally(() => {
        setIsDialogOpen(false);
      });
  };

  // 取消刪除
  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="delete-resource-page">
      <button className="delete-back-button" onClick={() => navigate("/resource")}>
        <img
          src={arrowLeftCircle}
          alt="Back"
          className="back-icon"
        />
        <span className="back-text">回到前頁</span>
      </button>

      <div className="file-separator">&nbsp;</div>
      <div className="delete-resource-title">我的已上傳資源</div>

      {/* 載入中狀態 */}
      {isLoading && (
        <div className="resource-loading">
          <div className="loading-spinner"></div>
          <p>載入資源中...</p>
        </div>
      )}

      {/* 顯示用戶無資源時的提示 */}
      {!isLoading && userResources.length === 0 && (
        <div className="no-resources-container">
          <div className="no-resources-message">
            <h3>您尚未上傳任何資源</h3>
            <p>上傳資源來分享您的知識吧！</p>
            <button
              className="upload-resource-button"
              onClick={() => navigate("/resource")}
            >
              去上傳資源
            </button>
          </div>
        </div>
      )}

      {/* 顯示資源列表 */}
      {!isLoading && userResources.length > 0 && (
        <div className="resource-container">
          <div className="resource-content-container">
            <div className="resource-content-wrapper">
              <div className="resource-content">
                {displayedResources.map((resource, index) => (
                  <div key={resource.id || index} className="delete-card-wrapper">
                    <ResourceCard
                      imageUrl={resource.imageUrl || "/src/assets/resourcepage/file_preview_demo.png"}
                      fileType={resource.fileType || "PDF"}
                      likes={resource.likes || 0}
                      downloads={resource.downloads || 0}
                      title={resource.title || "無標題資源"}
                      uploader={resource.uploader_name || "匿名上傳者"}
                      tags={resource.tags || []}
                      date={resource.date || ""}
                      isLiked={Boolean(resource.is_like)}
                      onCardClick={null} // 關閉跳轉
                    />
                    <div className="delete-overlay"></div>
                    <button className="delete-button" onClick={() => handleDeleteDialog(resource)}>
                      <img
                        src={deleteIcon}
                        alt="Delete"
                        className="delete-icon"
                      />
                      <span>刪除</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 分頁控制 */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <ul className="pagination">
                  <li className="page-item back-button">
                    <a
                      className={`page-link wide-link ${currentPage <= 1 ? 'invisible' : ''}`}
                      onClick={handlePreviousPage}
                    >
                      《 Back
                    </a>
                  </li>

                  {getPageNumbers().map(number => (
                    <li
                      key={number}
                      className={`page-item ${currentPage === number ? 'active' : ''}`}
                    >
                      <a
                        className="page-link"
                        onClick={() => handlePageChange(number)}
                      >
                        {number}
                      </a>
                    </li>
                  ))}

                  <li className="page-item next-button">
                    <a
                      className={`page-link wide-link ${currentPage >= totalPages ? 'invisible' : ''}`}
                      onClick={handleNextPage}
                    >
                      Next 》
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 確認對話框 */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        fileName={selectedResource?.title || ""}
      />
    </div>
  );
};

export default DeleteResource;