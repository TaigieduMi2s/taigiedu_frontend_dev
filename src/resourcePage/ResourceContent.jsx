import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./ResourceContent.css";
import ResourceCard from "./ResourceCard";
import { useToast } from "../components/Toast";
import { authenticatedFetch } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

// 添加 renderCard 到組件參數中
const ResourceContent = ({ searchParams, onCardClick, renderCard, onResourcesLoaded }) => {
  const { showToast } = useToast();
  const { isLoading: isAuthLoading } = useAuth();
  const [allResources, setAllResources] = useState([]); // 存儲所有資源
  const [displayedResources, setDisplayedResources] = useState([]); // 當前頁顯示的資源
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSearchParams, setLastSearchParams] = useState(null); // 存儲上次搜索參數

  // 分頁設置
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const VISIBLE_PAGES = 10;

  const [searchParamsFromRouter, setSearchParamsFromRouter] = useSearchParams();
  const pageFromUrl = parseInt(searchParamsFromRouter.get("page") || "1", 10);

  // 當搜索參數變更時重新獲取數據
  useEffect(() => {
    // 檢查搜索參數是否變化
    const isParamsChanged = JSON.stringify(searchParams) !== JSON.stringify(lastSearchParams);
    if (isParamsChanged) {
      console.log("搜索參數已變更，重新獲取資源");
      // 如果不是初次讀取（lastSearchParams 不為 null），且搜尋條件變了，則重置頁碼到 1
      if (lastSearchParams !== null && pageFromUrl !== 1) {
        const newParams = new URLSearchParams(searchParamsFromRouter);
        newParams.set("page", "1");
        setSearchParamsFromRouter(newParams);
      } else if (!isAuthLoading) {
        fetchResources();
      }
      setLastSearchParams(searchParams);
    }
  }, [searchParams, isAuthLoading]);

  // 同步 URL 中的頁碼到 currentPage 狀態
  useEffect(() => {
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl, currentPage]);

  // 監聽後台更新事件，重新抓取前台資源
  useEffect(() => {
    const onUpdated = () => {
      if (!isAuthLoading) {
        // 保持目前搜尋條件，僅重新拉資料
        fetchResources();
      }
    };
    window.addEventListener('resource-updated', onUpdated);
    return () => window.removeEventListener('resource-updated', onUpdated);
  }, [isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading && lastSearchParams) {
      fetchResources();
    }
  }, [isAuthLoading, lastSearchParams]);

  // 當頁碼變更時更新顯示的資源
  useEffect(() => {
    if (allResources.length > 0) {
      updateDisplayedResources();
    }
  }, [currentPage, allResources]);

  // 更新當前頁顯示的資源
  const updateDisplayedResources = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allResources.length);

    if (startIndex < allResources.length && startIndex >= 0) {
      const resourcesForCurrentPage = allResources.slice(startIndex, endIndex);
      setDisplayedResources(resourcesForCurrentPage);
    } else if (allResources.length > 0) {
      // 只有在有資源的情況下，且頁碼超出範圍時才重置
      const newParams = new URLSearchParams(searchParamsFromRouter);
      newParams.set("page", "1");
      setSearchParamsFromRouter(newParams);
    }
  };

  // 獲取資源數據
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      // 處理版本參數 - 可以是字串或陣列
      let versionParam = searchParams?.version || "";

      // 如果是逗號分隔的字串，將其轉換為陣列
      if (typeof versionParam === 'string' && versionParam.includes(',')) {
        versionParam = versionParam.split(',').map(v => v.trim()).filter(v => v);
      }

      const parameters = {
        stage: searchParams?.stage || "",
        version: versionParam,
        keyword: searchParams?.keyword || "",
        searchContent: searchParams?.searchContent || "",
        page: 1, // 始終獲取第一頁
        limit: 1000 // 設置較大的限制以獲取更多結果
      };

      console.log("搜索參數:", parameters);

      const response = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/api/resource/search`, {
        method: "POST",
        body: JSON.stringify(parameters)
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        console.log("搜索結果:", result);

        if (result.data && Array.isArray(result.data.resources)) {
          const resourcesList = [...result.data.resources].reverse();
          setAllResources(resourcesList);
          setTotalItems(resourcesList.length);

          // 計算總頁數
          const calculatedTotalPages = Math.ceil(resourcesList.length / ITEMS_PER_PAGE);
          setTotalPages(Math.max(1, calculatedTotalPages)); // 確保至少有1頁

          // 調用回調函數以通知父組件資源已載入完成
          if (onResourcesLoaded) {
            onResourcesLoaded(resourcesList);
          }
        } else {
          console.error("返回的資源數據結構不正確:", result);
          setAllResources([]);
          setDisplayedResources([]);
          setTotalItems(0);
          setTotalPages(1);

          // 也要通知父組件資源為空
          if (onResourcesLoaded) {
            onResourcesLoaded([]);
          }
        }
      } else {
        console.error("搜索請求失敗:", result);
        showToast("搜索資源時發生錯誤，請稍後再試", "error");
        setAllResources([]);
        setDisplayedResources([]);
        setTotalItems(0);
        setTotalPages(1);

        if (onResourcesLoaded) {
          onResourcesLoaded([]);
        }
      }
    } catch (error) {
      console.error("搜索請求錯誤:", error);
      showToast("網絡連接錯誤，請檢查您的網絡連接", "error");
      setAllResources([]);
      setDisplayedResources([]);
      setTotalItems(0);
      setTotalPages(1);

      if (onResourcesLoaded) {
        onResourcesLoaded([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 分頁處理函數
  const handlePageChange = (pageNumber) => {
    const newParams = new URLSearchParams(searchParamsFromRouter);
    newParams.set("page", pageNumber.toString());
    setSearchParamsFromRouter(newParams);
    window.scrollTo(0, 0); // 滾動到頁面頂部
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
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
  // 只更新 return 部分的 JSX 結構


  return (
    <>
      <div className="resource-container">
        <div className="resource-content-container"> {/* 新增的置中容器 */}
          {isLoading ? (
            <div className="resource-loading">
              <div className="loading-spinner"></div>
              <p>載入資源中...</p>
            </div>
          ) : allResources.length === 0 ? (
            <div className="resource-empty">
              <p>沒有找到符合條件的資源</p>
            </div>
          ) : (
            // 包裝元素來確保固定高度
            <div className="resource-content-wrapper">
              <div className="resource-content">
                {displayedResources.map((resource, index) => {
                  // 如果提供了自定義渲染函數，則使用它
                  if (renderCard) {
                    return renderCard(resource, index);
                  }

                  // 否則使用默認的卡片渲染
                  return (
                    <ResourceCard
                      key={resource.id || index}
                      imageUrl={resource.imageUrl || "/src/assets/resourcepage/file_preview_demo.png"}
                      fileType={resource.fileType || "PDF"}
                      likes={resource.likes || 0}
                      downloads={resource.downloads || 0}
                      title={resource.title || "無標題資源"}
                      uploader={resource.uploader_name || "匿名上傳者"}
                      tags={resource.tags || []}
                      date={resource.date || ""}
                      isLiked={Boolean(resource.is_like)}
                      onCardClick={() => onCardClick && onCardClick(resource)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && allResources.length > 0 && (
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
    </>
  );
};

export default ResourceContent;