import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ExamPage.css';
import CustomSelect from '../components/CustomSelect/CustomSelect';
import PageLoading from '../components/PageLoading/PageLoading';
import Pagination from '../mainSearchPage/Pagination';
import searchIcon from '../assets/home/search_logo.svg';
import foodImage from '../assets/culture/foodN.png';
import ReportIssueLink from '../components/ReportIssue/ReportIssueLink';
import {
    buildListSearchParams,
    parsePage,
    parseQuery,
    parseSelectedItems,
} from '../utils/listFilterParams';

// 顯示規則：桌機版每列 4 筆、每頁最多 15 列；未篩選時每類別預覽第一列（4 筆）
const ITEMS_PER_ROW = 4;
const MAX_ROWS_PER_PAGE = 15;
const PAGE_SIZE = ITEMS_PER_ROW * MAX_ROWS_PER_PAGE;
const PREVIEW_COUNT = ITEMS_PER_ROW;

const ALL_TYPES = '類型';

const ExamPage = () => {
    const [examData, setExamData] = useState({});
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 類別篩選／關鍵字／頁碼一律以 query string 為準（規則見 utils/listFilterParams.js），
    // 重新整理或把網址分享出去都能回到同一個畫面。本頁只支援單選，取第一個 cat 參數即可。
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedType = Object.keys(parseSelectedItems(searchParams, categories))[0] ?? ALL_TYPES;
    const query = parseQuery(searchParams);
    const currentPage = parsePage(searchParams);

    // 寫回網址的統一入口；未帶到的欄位沿用目前值。
    // replace：關鍵字是邊打邊篩，逐字塞進 history 會讓上一頁按不完。
    const updateListParams = useCallback((patch, { replace = false } = {}) => {
        const { category = selectedType, ...rest } = patch;
        setSearchParams(
            buildListSearchParams({
                selectedItems: category === ALL_TYPES ? {} : { [category]: [] },
                query,
                page: currentPage,
                ...rest,
            }),
            { replace }
        );
    }, [selectedType, query, currentPage, setSearchParams]);

    // 組件掛載時獲取考試資料
    useEffect(() => {
        fetchExamData();
    }, []);

    // 從 API 獲取考試資料
    const fetchExamData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/exam_list`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("考試資料API回傳:", data);

            if (data && typeof data === 'object') {
                // 提取分類列表
                const categoryList = Object.keys(data);
                setCategories(categoryList);

                // 處理資料，為每個項目添加 id 和處理圖片
                const processedData = {};
                Object.entries(data).forEach(([category, items]) => {
                    if (Array.isArray(items)) {
                        processedData[category] = items.map((item, index) => ({
                            id: index + 1,
                            title: item.title || '',
                            url: item.url || '',
                            image: item.image ? `${import.meta.env.VITE_IMAGE_URL}${item.image}` : foodImage,
                            subcategory: item.subcategory || ''
                        }));
                    }
                });

                setExamData(processedData);
            } else {
                throw new Error("API回傳格式錯誤");
            }
        } catch (error) {
            console.error("獲取考試資料失敗:", error);
            setError(error.message);
            setExamData({});
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTypeChange = (selectedValue) => {
        updateListParams({ category: selectedValue, page: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // 搜尋邏輯會在 getFilteredData 中處理
    };

    // 依關鍵字篩選（維持「類別 -> 項目陣列」的結構）
    const getFilteredData = () => {
        if (query.trim() === "") {
            return examData;
        }

        const searchFilteredData = {};
        const searchTerm = query.toLowerCase().trim();

        Object.keys(examData).forEach(category => {
            const filteredItems = examData[category].filter(item => {
                const searchFields = [
                    item.title,
                    item.subcategory,
                    category
                ].filter(Boolean).join(' ').toLowerCase();

                return searchFields.includes(searchTerm);
            });

            if (filteredItems.length > 0) {
                searchFilteredData[category] = filteredItems;
            }
        });

        return searchFilteredData;
    };

    const handleCardClick = (url) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    const handlePageChange = (pageNumber) => {
        updateListParams({ page: pageNumber });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 單張卡片（外觀比照「媒體與社群資源」：圖片 + 置中標題）
    const renderCard = (item, category) => (
        <div
            key={`${category}-${item.id}`}
            className="exam-card"
            onClick={() => handleCardClick(item.url)}
        >
            <div className="exam-image-container">
                <img
                    src={item.image}
                    alt={item.title}
                    className="exam-image"
                    onError={(e) => {
                        e.target.src = foodImage;
                    }}
                />
            </div>
            <h5 className="text-center mt-2">{item.title}</h5>
        </div>
    );

    // 載入狀態
    if (isLoading) {
        return (
            <div className="exam-page">
                <PageLoading text="載入考試資料中..." />
            </div>
        );
    }

    // 錯誤狀態
    if (error) {
        return (
            <div className="exam-page">
                <div className="exam-header page-filter-header">
                    <div className="exam-header-container">
                        <div className="text-center">
                            <p>載入失敗：{error}</p>
                            <button onClick={fetchExamData} className="btn btn-primary mt-2">
                                重新載入
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredData = getFilteredData();
    const isCategorySelected = selectedType !== ALL_TYPES;
    const hasQuery = query.trim() !== '';
    // 未套用類別篩選與關鍵字搜尋時 → 依類別分區預覽；否則 → 完整列表 + 分頁
    const isFullList = isCategorySelected || hasQuery;

    // 完整列表模式：攤平（保留類別順序）後分頁
    const activeCategories = isCategorySelected
        ? (filteredData[selectedType] ? [selectedType] : [])
        : Object.keys(filteredData);

    const flatItems = activeCategories.flatMap(category =>
        filteredData[category].map(item => ({ item, category }))
    );
    const totalItems = flatItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageItems = flatItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // 同一頁中依類別分段，讓每段仍能顯示類別名稱
    const pageGroups = [];
    pageItems.forEach(({ item, category }) => {
        const last = pageGroups[pageGroups.length - 1];
        if (last && last.category === category) {
            last.items.push(item);
        } else {
            pageGroups.push({ category, items: [item] });
        }
    });

    return (
        <div className="exam-page">
            <div className="exam-header page-filter-header">
                <div className="exam-header-container">
                    <div className="exam-header-content">
                        <div className="exam-type-select">
                            <CustomSelect
                                options={[ALL_TYPES, ...categories]}
                                value={selectedType}
                                onChange={handleTypeChange}
                                placeholder={ALL_TYPES}
                            />
                        </div>
                        <form onSubmit={handleSearch} className="exam-search-container">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => updateListParams(
                                    { query: e.target.value, page: 1 },
                                    { replace: true }
                                )}
                                placeholder="搜尋..."
                                className="exam-search-input"
                            />
                            <img
                                src={searchIcon}
                                className="exam-search-icon"
                                onClick={handleSearch}
                            />
                        </form></div></div>
            </div>

            {isFullList ? (
                /* ─── 完整列表（含分頁）─── */
                <div className="exam-sections">
                    <div className="exam-list-toolbar">
                        <div className="exam-list-summary">
                            共 {totalItems} 筆｜第 {safePage}／{totalPages} 頁
                        </div>
                        {isCategorySelected && (
                            <button
                                type="button"
                                className="exam-back-button"
                                onClick={() => handleTypeChange(ALL_TYPES)}
                            >
                                返回全部類別
                            </button>
                        )}
                    </div>

                    {totalItems === 0 ? (
                        <div className="exam-empty">沒有符合條件的資料</div>
                    ) : (
                        pageGroups.map((group, index) => (
                            <section key={`${group.category}-${index}`} className="exam-section">
                                <div className="exam-section-header">
                                    <h2 className="exam-category-title">{group.category}</h2>
                                </div>
                                <div className="exam-grid">
                                    {group.items.map(item => renderCard(item, group.category))}
                                </div>
                            </section>
                        ))
                    )}

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={safePage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            maxVisible={4}
                        />
                    )}
                </div>
            ) : (
                /* ─── 依類別分區預覽（每類別顯示第一列）─── */
                <div className="exam-sections">
                    {Object.entries(filteredData).map(([category, items]) => (
                        <section key={category} className="exam-section">
                            <div className="exam-section-header">
                                <h2 className="exam-category-title">
                                    {category}
                                    <span className="exam-category-count">共 {items.length} 筆</span>
                                </h2>
                                <button
                                    type="button"
                                    className="exam-viewall-button"
                                    onClick={() => handleTypeChange(category)}
                                >
                                    查看全部 ›
                                </button>
                            </div>
                            <div className="exam-grid">
                                {items.slice(0, PREVIEW_COUNT).map(item => renderCard(item, category))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
            <ReportIssueLink pageKey="exam" className="exam-report-issue" />
        </div>
    );
};

export default ExamPage;
