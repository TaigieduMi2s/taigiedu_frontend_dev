import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import searchIcon from "../assets/home/search_logo.svg";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import SearchResults from "../mainSearchPage/SearchResults";
import {
  getTopics,
  getSubTopics,
  getResources,
} from "../services/topicIntegrationMockApi";
import "./TopicIntegrationPage.css";

const PAGE_SIZE = 15;

// 議題融入 — 三層導覽（單一頁面元件，透過 query string 切換層級）
//   ?topic=            -> 第一層（議題索引）
//   ?topic=性別平等     -> 第二層（次分類 + 資源列表）
//   ?topic=性別平等&sub=生理性別 -> 第三層（僅資源列表）
const TopicIntegrationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const topic = searchParams.get("topic") || "";
  const subTopic = searchParams.get("sub") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  // 目前層級：1 = 索引、2 = 次分類、3 = 細部內容
  const level = !topic ? 1 : !subTopic ? 2 : 3;

  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [resources, setResources] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // keyword = 輸入框當下的值；submittedKeyword = 已送出查詢的值（實際帶入 API）
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 更新 query string 的統一入口（帶入的欄位為空字串時移除該參數）
  const updateParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  // ---- 導覽動作 ----
  const goToIndex = () => updateParams({ topic: "", sub: "", page: "" });

  const selectTopic = (nextTopic) => {
    if (!nextTopic) return;
    // 選新議題 -> 進第二層，並清掉次分類與頁碼
    updateParams({ topic: nextTopic, sub: "", page: "" });
  };

  const selectSubTopic = (nextSub) => {
    // 選次分類 -> 進第三層
    updateParams({ sub: nextSub, page: "" });
  };

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage > 1 ? String(nextPage) : "" });
  };

  // ---- 載入議題清單（第一層 + 下拉選單一）----
  useEffect(() => {
    getTopics()
      .then((res) => setTopics(res?.data || []))
      .catch((err) => console.error("載入議題清單失敗:", err));
  }, []);

  // ---- 議題改變 -> 載入次分類（第二個下拉 + chip 列）----
  useEffect(() => {
    if (!topic) {
      setSubTopics([]);
      return;
    }
    getSubTopics(topic)
      .then((res) => setSubTopics(res?.data || []))
      .catch((err) => console.error("載入次分類失敗:", err));
  }, [topic]);

  // ---- 載入資源列表（第二 / 三層）----
  useEffect(() => {
    if (!topic) {
      setResources([]);
      setTotalPages(1);
      setTotalItems(0);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getResources({ topic, subTopic, keyword: submittedKeyword, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        if (res?.status !== "success" || !Array.isArray(res.data)) {
          throw new Error("mock api response format invalid");
        }
        setResources(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalItems(res.total || 0);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("載入議題融入資源失敗:", err);
        setError("載入資料時發生錯誤，請稍後再試。");
        setResources([]);
        setTotalItems(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [topic, subTopic, page, submittedKeyword]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // 送出關鍵字並回到第一頁；兩者皆為上方 effect 的依賴，會自動重新查詢
    setSubmittedKeyword(keyword.trim());
    if (page !== 1) updateParams({ page: "" });
  };

  const topicOptions = useMemo(() => topics, [topics]);

  return (
    <div className="topic-integration-page">
      {/* 上方工具列：兩個下拉選單 + 搜尋框（sticky 由 page-filter-header 提供） */}
      <div className="ti-toolbar page-filter-header">
        <form className="ti-toolbar-content" onSubmit={handleSearchSubmit}>
          <div className="ti-select-wrap">
            <CustomSelect
              options={topicOptions}
              value={topic}
              onChange={selectTopic}
              placeholder="議題索引"
            />
          </div>

          <div className="ti-select-wrap">
            <CustomSelect
              options={subTopics}
              value={subTopic}
              onChange={selectSubTopic}
              placeholder="分類"
            />
          </div>

          <div className="ti-search-input-group">
            <input
              type="text"
              className="ti-search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="輸入自訂搜尋內容..."
            />
            <button type="submit" className="ti-search-btn" aria-label="搜尋">
              <img src={searchIcon} alt="搜尋" className="ti-search-icon" />
            </button>
          </div>
        </form>
      </div>

      <div className="ti-container">

      {/* ============ 第一層：議題索引 ============ */}
      {level === 1 && (
        <section className="ti-index">
          <h2 className="ti-index-title">議題索引</h2>
          <div className="ti-topic-grid">
            {topics.map((name) => (
              <button
                key={name}
                type="button"
                className="ti-topic-btn"
                onClick={() => selectTopic(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ 第二 / 三層：麵包屑 + (chip) + 表格 ============ */}
      {level >= 2 && (
        <section className="ti-detail">
          {/* 麵包屑 */}
          <nav className="ti-breadcrumb" aria-label="breadcrumb">
            <button type="button" className="ti-crumb-link" onClick={goToIndex}>
              議題索引
            </button>
            <span className="ti-crumb-sep">&gt;</span>
            {level === 2 ? (
              <span className="ti-crumb-current">{topic}</span>
            ) : (
              <>
                <button
                  type="button"
                  className="ti-crumb-link"
                  onClick={() => updateParams({ sub: "", page: "" })}
                >
                  {topic}
                </button>
                <span className="ti-crumb-sep">&gt;</span>
                <span className="ti-crumb-current">{subTopic}</span>
              </>
            )}
          </nav>

          {/* 次分類 chip 列（僅第二層顯示） */}
          {level === 2 && (
            <div className="ti-chip-group">
              {subTopics.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`ti-chip ${name === subTopic ? "is-active" : ""}`}
                  onClick={() => selectSubTopic(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* 資源列表：沿用主頁搜尋的搜尋結果外觀（分頁由本頁控制） */}
          <div className="ti-results">
            <SearchResults
              results={resources}
              isLoading={isLoading}
              error={error}
              keyword={submittedKeyword}
              totalItems={totalItems}
              summary={
                <>
                  共 <strong>{totalItems}</strong> 筆
                  {submittedKeyword ? `含有「${submittedKeyword}」的` : ""}資源
                </>
              }
              emptyMessage="查無符合的資源。"
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default TopicIntegrationPage;
