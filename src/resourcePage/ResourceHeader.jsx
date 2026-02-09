import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import "./ResourceHeader.css";
import MultiSelect from "../phrasePage/multiselect";
import chevronUpIcon from "../assets/chevron-up.svg";

const ResourceHeader = ({ onUploadOpen, isLoggedIn, onSearch }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState("階段");
  const [query, setQuery] = useState("");
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isMultiSelectEnabled, setIsMultiSelectEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]); // 多選下拉選單

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

  const handleGradeChange = (e) => {
    const grade = e.target.value;
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

  // 登出處理 - 使用 AuthContext 的 logout
  const handleLogout = async () => {
    await logout();
    showToast("已成功登出", "success");
  };

  return (
    <div className="resource-header">
      {/* 階段下拉選單 */}
      <div className="dropdown-container">
        <select
          className={`grade-dropdown ${isGradeOpen ? "open" : ""}`}
          onClick={() => setIsGradeOpen(!isGradeOpen)}
          value={selectedGrade}
          onChange={handleGradeChange}
        >
          <option hidden>階段</option>
          <option value="全部">全部</option>
          <option value="高中">高中</option>
          <option value="國中">國中</option>
          <option value="國小">國小</option>
        </select>
        <img
          src={chevronUpIcon}
          alt="dropdown arrow"
          className="dropdown-arrow"
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
          displayText="已選擇版本"
        />
      </div>

      {/* 內容類型多選下拉選單 */}
      <div className="multiselect-wrapper resource-multi">
        <MultiSelect
          options={contentTypeOptions}
          selectedOptions={selectedContentTypes}
          onChange={handleContentTypeChange}
          placeholder="內容類型"
          displayText="已選擇類型"
        />
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

      {/* 上傳/刪除我的資源按鈕 */}
      <div className="res-button-container">
        {/* 只在登入狀態下顯示登出按鈕 */}
        {isLoggedIn && (
          <button
            className="res-login-button logout-button"
            onClick={handleLogout}
          >
            登出
          </button>
        )}

        <button className="res-upload-button" onClick={handleUpload}>
          上傳我的資源
        </button>

        <button className="res-delete-button" onClick={handleDelete}>
          刪除我的資源
        </button>
      </div>
    </div>
  );
};

export default ResourceHeader;