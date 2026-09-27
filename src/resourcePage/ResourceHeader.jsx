import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import "./ResourceHeader.css";
import MultiSelect from "../phrasePage/multiselect";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import useIsMobile from "../components/CategoryFilterSheet/useIsMobile";

const ResourceHeader = ({ onUploadOpen, isLoggedIn, onSearch }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState("階段");
  const [query, setQuery] = useState("");
  const [isMultiSelectEnabled, setIsMultiSelectEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]); // 多選下拉選單
  // 手機版：階段／版本／內容類型平常收合，只留「搜尋框 + 篩選鈕」一列，避免 sticky 篩選列吃掉近半個畫面
  const isMobile = useIsMobile();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // 從本機設定讀取（由後台 ResourceHeaderPage 控制），並有預設值
  const STORAGE_KEY = 'resourceHeaderConfig';
  const loadConfig = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  };
  const config = loadConfig();
  const fallbackContentTypes = ["學習單", "簡報", "教案", "其他"];
  const contentTypeOptions = Array.isArray(config?.contentTypes) && config.contentTypes.length > 0 ? config.contentTypes : fallbackContentTypes;
  const [selectedContentTypes, setSelectedContentTypes] = useState([...contentTypeOptions]); // 預設全選內容類型

  // 定義版本選項映射
  const defaultVersions = {
    國小: ["真平", "康軒"],
    國中: ["真平", "康軒", "奇異果", "師昀", "全華", "豪風", "長鴻"],
    高中: ["真平", "育達", "泰宇", "奇異果", "創新"],
  };
  const gradeToVersions = {
    國小: config?.versions?.['國小'] || defaultVersions.國小,
    國中: config?.versions?.['國中'] || defaultVersions.國中,
    高中: config?.versions?.['高中'] || defaultVersions.高中,
  };

  const getVersionOptions = (grade) => {
    if (grade === "全部") {
      return allVersions;
    }
    return gradeToVersions[grade] || [];
  };

  const allVersions = Array.from(new Set([...(gradeToVersions.國小 || []), ...(gradeToVersions.國中 || []), ...(gradeToVersions.高中 || [])]));

  // 手機版「篩選」鈕上的數字：與預設值（不限階段、版本全選、類型全選）不同的條件數
  const activeFilterCount =
    (selectedGrade !== "階段" && selectedGrade !== "全部" ? 1 : 0) +
    (isMultiSelectEnabled && selectedCategories.length < getVersionOptions(selectedGrade).length ? 1 : 0) +
    (selectedContentTypes.length < contentTypeOptions.length ? 1 : 0);

  const handleCategoryChange = (selected) => {
    setSelectedCategories(selected);
  };

  const handleContentTypeChange = (selected) => {
    setSelectedContentTypes(selected);
  };

  // 若後台調整了設定，動態刷新當前選項
  useEffect(() => {
    const onCfg = () => {
      const latest = loadConfig();
      const latestTypes = Array.isArray(latest?.contentTypes) && latest.contentTypes.length > 0 ? latest.contentTypes : fallbackContentTypes;
      setSelectedContentTypes([...latestTypes]);
      // 若目前選的階段不是「階段」，同步更新版本清單
      if (selectedGrade === '全部') setSelectedCategories(Array.from(new Set([...(latest?.versions?.['國小'] || []), ...(latest?.versions?.['國中'] || []), ...(latest?.versions?.['高中'] || [])])));
      else if (selectedGrade !== '階段') setSelectedCategories([...(latest?.versions?.[selectedGrade] || defaultVersions[selectedGrade] || [])]);
    };
    window.addEventListener('resource-config-updated', onCfg);
    return () => window.removeEventListener('resource-config-updated', onCfg);
  }, [selectedGrade]);

  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    // Set all versions for the selected grade
    if (grade === "全部") {
      setSelectedCategories([...allVersions]);
    } else if (grade !== "階段") {
      setSelectedCategories([...gradeToVersions[grade]]);
    } else {
      setSelectedCategories([]);
    }
    setIsMultiSelectEnabled(grade !== "階段");
  };

  const handleSearch = (e) => {
    e.preventDefault(); // 防止頁面重整

    // 構建搜索參數
    const searchParams = {
      stage: selectedGrade === "階段" || selectedGrade === "全部" ? "" : selectedGrade,
      version: selectedCategories.length > 0 ? selectedCategories : "", // 直接傳遞陣列
      contentType: selectedContentTypes.length > 0 ? selectedContentTypes : "", // 新增內容類型參數
      keyword: query.trim(),
      searchContent: ""
    };

    console.log("執行搜索:", searchParams);

    // 調用父組件的搜索函數
    if (onSearch) {
      onSearch(searchParams);
    }

    // 手機版送出後收合篩選面板，把畫面還給搜尋結果
    setIsFilterPanelOpen(false);
  };

  // 上傳資源處理
  const handleUpload = () => {
    if (!isLoggedIn) {
      showToast("請先登入後再上傳資源", "warning");
      navigate("/login", { state: { redirectTo: "/resource" } });
      return;
    }
    onUploadOpen();
  };

  // 刪除資源處理
  const handleDelete = () => {
    if (!isLoggedIn) {
      showToast("請先登入後再刪除資源", "warning");
      navigate("/login", { state: { redirectTo: "/resource" } });
      return;
    }
    navigate("/delete-resource");
  };



  const actionButtons = (
    <div className={`res-button-container ${isMobile ? "res-mobile-actions" : ""}`}>
      <button className="res-upload-button" onClick={handleUpload}>
        上傳我的資源
      </button>

      <button className="res-delete-button" onClick={handleDelete}>
        刪除我的資源
      </button>
    </div>
  );

  return (
    <>
      <div className={`resource-header page-filter-header is-bleed ${isFilterPanelOpen ? "is-filter-open" : ""}`}>
        {/* 篩選條件：桌機為 display: contents（照舊與搜尋框排在同一列），手機為可收合面板 */}
        <div className="res-filter-panel" id="res-filter-panel">
          {/* 階段下拉選單 */}
          <div className="grade-select">
            <CustomSelect
              options={["全部", "高中", "國中", "國小"]}
              value={selectedGrade === "階段" ? null : selectedGrade}
              onChange={handleGradeChange}
              placeholder="階段"
            />
          </div>

          <div
            className={`multiselect-wrapper ${isMultiSelectEnabled ? "enabled" : "disabled"
              } resource-multi`}
          >
            <MultiSelect
              key={selectedGrade}
              options={getVersionOptions(selectedGrade)}
              selectedOptions={selectedCategories}
              onChange={handleCategoryChange}
              placeholder="版本"
              displayText={isMobile ? "版本" : "已選擇版本"}
            />
          </div>

          {/* 內容類型多選下拉選單 */}
          <div className="multiselect-wrapper resource-multi">
            <MultiSelect
              options={contentTypeOptions}
              selectedOptions={selectedContentTypes}
              onChange={handleContentTypeChange}
              placeholder={isMobile ? "類型" : "內容類型"}
              displayText={isMobile ? "類型" : "已選擇類型"}
            />
          </div>

          {/* 手機版篩選條件改完要按這顆才套用（桌機照舊按搜尋鈕） */}
          {isMobile && (
            <button type="button" className="res-filter-apply" onClick={handleSearch}>
              套用篩選
            </button>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="res-search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋..."
            className="res-search-input"
          />
          <img
            src="search_logo.svg"
            className="res-search-icon"
            onClick={handleSearch} // 點擊圖片觸發搜尋跳轉
          />
        </form>

        {isMobile && (
          <button
            type="button"
            className={`res-filter-toggle ${isFilterPanelOpen ? "is-open" : ""}`}
            aria-expanded={isFilterPanelOpen}
            aria-controls="res-filter-panel"
            onClick={() => setIsFilterPanelOpen(open => !open)}
          >
            <svg className="res-filter-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            篩選
            {activeFilterCount > 0 && (
              <span className="res-filter-badge">{activeFilterCount}</span>
            )}
          </button>
        )}

        {/* 上傳/刪除我的資源按鈕（手機版移到 sticky 篩選列之外，隨內容捲走） */}
        {!isMobile && actionButtons}
      </div>

      {isMobile && actionButtons}
    </>
  );
};

export default ResourceHeader;