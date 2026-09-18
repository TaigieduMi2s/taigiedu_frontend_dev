import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import '../mainSearchPage/SearchResults.css';
import './CultureTestPage.css';
import searchIcon from '../assets/home/search_logo.svg';
import chevronUp from '../assets/chevron-up.svg';
import noPics from '../assets/culture/festivalN.png';
import PageLoading from '../components/PageLoading/PageLoading';
import CustomSelect from '../components/CustomSelect/CustomSelect';
import Pagination from '../mainSearchPage/Pagination';
import CategoryFilterSheet from '../components/CategoryFilterSheet/CategoryFilterSheet';
import { getTriggerLabel } from '../components/CategoryFilterSheet/categorySelection';
import useIsMobile from '../components/CategoryFilterSheet/useIsMobile';
import useAnchoredMenu, { getMenuPortalTarget } from '../components/AnchoredMenu/useAnchoredMenu';
import { fetchCultureItems, CATEGORY_TREE, CONTENT_TYPES } from '../services/cultureTestMockApi';
import {
  buildListSearchParams,
  parsePage,
  parseQuery,
  parseSelectedItems,
  parseType,
} from '../utils/listFilterParams';

/**
 * 台語文化（test）
 *
 * 篩選與呈現方式比照「媒體與社群資源」（socialmediaPage）：
 *   - 頁首白底橫幅：膠囊狀搜尋列，版面參考國家文化記憶庫的搜尋頁（2026-09）
 *       預設「類型下拉（全部）+ 關鍵字 + 搜尋鈕」；
 *       選了影音或文本後，搜尋列多出第二個下拉「分類」（第一層 + 第二層子選單，可複選）
 *   - 類型切換時清空分類：兩種類型的分類不一定相同，選「全部」時不提供分類篩選
 *   - 「全部」：不分分類，上方「推薦影音」一列 4 筆、下方「推薦文本」5 筆，各自附「查看全部」切到該類型；不分頁
 *   - 影音／文本：未篩選時依第一層分區預覽並附「查看全部」；有篩選或搜尋時攤平成完整列表 + 分頁
 *   - 影音為「圖片 + 主標」卡片，點擊開新分頁到該筆影音
 *   - 文本比照主頁搜尋的結果列（標題／作者標籤／摘要），關鍵字會標示出來
 *
 * 分類範圍（2026-08 依 PM 指示調整）：**只收來源表第一層的「文化」這一支**，
 * 並取其後兩層當作篩選：
 *   篩選第一層 = 來源表第二層：戲曲 / 祭典 / 傳統工藝 / 地方,產業
 *   篩選第二層 = 來源表第三層（列舉細項）：歌仔戲 / 布袋戲 / …
 * 來源表第一層不出現在篩選與畫面上；其餘 A 分類（職業台語、文學、教育、
 * 新聞/訪談、藝術表現）本頁不收，詳見 services/cultureTestMockApi.js。
 *
 * ⚠️ 資料來自 services/cultureTestMockApi.js 假資料，尚未串接後端。
 */

// 顯示規則：桌機每列 4 筆、每頁最多 5 列；未篩選時每區預覽第一列
const ITEMS_PER_ROW = 4;
const MAX_ROWS_PER_PAGE = 5;
const PAGE_SIZE = ITEMS_PER_ROW * MAX_ROWS_PER_PAGE;
const PREVIEW_COUNT = ITEMS_PER_ROW;
const TEXT_PREVIEW_COUNT = 5;

const CONTENT_TYPE_VALUES = CONTENT_TYPES.map(type => type.value);

const isTextItem = item => item.type === 'text';

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 把文字中符合關鍵字的片段包成 <mark>（不分大小寫）；
// split 帶捕捉群組時，奇數索引就是比對到的片段
const highlightText = (text, term, className) => {
  if (!text || !term) return text;
  return text
    .split(new RegExp(`(${escapeRegExp(term)})`, 'gi'))
    .map((part, index) => (index % 2 === 1
      ? <mark key={index} className={className}>{part}</mark>
      : part));
};

// 搜尋列第一個下拉（value 空字串 = 全部）
const TYPE_OPTIONS = [{ value: '', label: '全部' }, ...CONTENT_TYPES];

const CultureTestPage = () => {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 分類篩選／關鍵字／頁碼一律以 query string 為準（規則見 utils/listFilterParams.js），
  // 重新整理或把網址分享出去都能回到同一個畫面。
  const [searchParams, setSearchParams] = useSearchParams();

  // 資料類型：'' = 全部、'video' = 影音、'text' = 文本
  const activeType = parseType(searchParams, CONTENT_TYPE_VALUES);
  // 已選分類，格式 { 篩選第一層: [篩選第二層, ...] }；空陣列代表整個第一層被選取。
  // 「全部」沒有分類下拉，網址上就算殘留 cat／sub 也一律忽略
  const selectedItems = useMemo(
    () => (activeType ? parseSelectedItems(searchParams, categoryOrder) : {}),
    [activeType, searchParams, categoryOrder]
  );
  // activeQuery = 已送出查詢的關鍵字（存在網址上）；query = 輸入框當下的值
  const activeQuery = parseQuery(searchParams);
  const currentPage = parsePage(searchParams);
  const [query, setQuery] = useState(activeQuery);

  // 寫回網址的統一入口；未帶到的欄位沿用目前值
  const updateListParams = useCallback((patch) => {
    setSearchParams(
      buildListSearchParams({
        type: activeType,
        selectedItems,
        query: activeQuery,
        page: currentPage,
        ...patch,
      })
    );
  }, [activeType, selectedItems, activeQuery, currentPage, setSearchParams]);

  // 手機版改用 bottom sheet（選擇先存 draft、按確認才套用），由元件自行處理
  const isMobile = useIsMobile();

  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // 桌機下拉：以觸發欄位為定位基準（與認證考試的 CustomSelect 同一套）
  const { menuStyle, updatePosition } = useAnchoredMenu(
    dropdownRef,
    !isMobile && isFilterOpen,
    { gap: 8, matchTriggerWidth: false }
  );

  // 第二層子選單：主選單會內部捲動，子選單改用 fixed + JS 定位才不會被裁切或超出畫面
  const [openSubmenuCategory, setOpenSubmenuCategory] = useState(null);
  const [submenuStyle, setSubmenuStyle] = useState(null);
  const submenuAnchorRef = useRef(null);
  // 離開項目後延遲關閉，滑鼠斜向移往子選單時短暫經過縫隙也不會立刻消失
  const submenuCloseTimerRef = useRef(null);
  const SUBMENU_CLOSE_DELAY = 200;

  const clearSubmenuCloseTimer = () => {
    clearTimeout(submenuCloseTimerRef.current);
    submenuCloseTimerRef.current = null;
  };

  const positionSubmenu = useCallback(() => {
    const anchorEl = submenuAnchorRef.current;
    if (!anchorEl) return;

    const MARGIN = 8;
    const rect = anchorEl.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 200);
    const maxHeight = Math.min(300, window.innerHeight - MARGIN * 2);

    // 水平方向貼齊「主選單」外框而非項目本身：Windows 的主選單捲軸（約 17px）位在項目右側，
    // 滑鼠往右移必定經過捲軸（不屬於該項目）而觸發 mouseleave，靠 SUBMENU_CLOSE_DELAY 撐過這段；
    // 子選單放在捲軸外側則不會蓋住捲軸。
    // 另外往內重疊 SUBMENU_OVERLAP px，避免縮放比例造成的小數像素縫隙。
    const menuRect = dropdownMenuRef.current?.getBoundingClientRect() ?? rect;
    const SUBMENU_OVERLAP = 2;

    // 右側放不下就翻到左邊；上下夾在畫面內
    let left = menuRect.right - SUBMENU_OVERLAP;
    if (left + minWidth > window.innerWidth - MARGIN) {
      left = Math.max(MARGIN, menuRect.left - minWidth + SUBMENU_OVERLAP);
    }
    const top = Math.max(MARGIN, Math.min(rect.top, window.innerHeight - MARGIN - maxHeight));

    setSubmenuStyle({ position: 'fixed', top, left, minWidth, maxHeight });
  }, []);

  const handleCategoryHover = (category, hasSubs, el) => {
    clearSubmenuCloseTimer();
    if (!hasSubs) {
      submenuAnchorRef.current = null;
      setOpenSubmenuCategory(null);
      return;
    }
    submenuAnchorRef.current = el;
    setOpenSubmenuCategory(category);
    positionSubmenu();
  };

  // 子選單開啟期間跟著捲動／縮放重新定位
  useEffect(() => {
    if (!openSubmenuCategory) return undefined;
    const onReposition = () => positionSubmenu();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [openSubmenuCategory, positionSubmenu]);

  // 主選單收合時一併關閉子選單
  useEffect(() => {
    if (!isFilterOpen) {
      clearSubmenuCloseTimer();
      submenuAnchorRef.current = null;
      setOpenSubmenuCategory(null);
    }
  }, [isFilterOpen]);

  // 篩選第一層 -> 篩選第二層清單
  const subCategoriesOf = useMemo(() => {
    const map = {};
    CATEGORY_TREE.forEach(node => { map[node.name] = node.children; });
    return map;
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchCultureItems();
      const order = res?.category_order || Object.keys(res?.data || {});
      setItemsByCategory(res?.data || {});
      setCategoryOrder(order.filter(name => res?.data?.[name]));
    } catch (err) {
      console.error('載入台語文化資料失敗:', err);
      setError('載入台語文化資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 網址上的關鍵字改變（送出搜尋、上一頁／下一頁）時，同步回輸入框
  useEffect(() => {
    setQuery(activeQuery);
  }, [activeQuery]);

  // 桌機下拉：點擊面板外關閉（手機版改由 bottom sheet 的遮罩處理）
  useEffect(() => {
    if (isMobile) return undefined;
    const handleClickOutside = (event) => {
      if (!isFilterOpen) return;
      // 選單已 portal 到 #root，觸發器與選單都要排除
      if (dropdownRef.current?.contains(event.target)) return;
      if (dropdownMenuRef.current?.contains(event.target)) return;
      setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen, isMobile]);

  // 桌機／手機切換時關閉面板，避免殘留另一種型態的開啟狀態
  useEffect(() => {
    setIsFilterOpen(false);
  }, [isMobile]);

  // ---- 選取狀態的純函式（桌機直接套用到 selectedItems，手機套用到 draftSelected）----

  // 無子選單的第一層：整層選取／取消
  const withCategoryToggled = (source, category) => {
    const next = { ...source };
    if (next[category]) delete next[category];
    else next[category] = [];
    return next;
  };

  // 有子選單的第一層：點父項＝該層全選／全不選
  const withAllSubsToggled = (source, category, subs) => {
    const next = { ...source };
    const current = next[category] || [];
    const isAll = subs.length > 0 && subs.every(sub => current.includes(sub));
    if (isAll) delete next[category];
    else next[category] = [...subs];
    return next;
  };

  const withSubToggled = (source, category, sub) => {
    const next = { ...source };
    const current = next[category] || [];
    const updated = current.includes(sub)
      ? current.filter(name => name !== sub)
      : [...current, sub];
    if (updated.length === 0) delete next[category];
    else next[category] = updated;
    return next;
  };

  // 勾選條件一改就回到第 1 頁（頁碼同樣存在網址上）
  const applySelection = (next) => updateListParams({ selectedItems: next, page: 1 });

  const toggleCategory = (category) =>
    applySelection(withCategoryToggled(selectedItems, category));

  const toggleAllSubCategories = (category) =>
    applySelection(withAllSubsToggled(selectedItems, category, subCategoriesOf[category] || []));

  const toggleSubCategory = (category, sub) =>
    applySelection(withSubToggled(selectedItems, category, sub));

  const isSubSelected = (category, sub) => (selectedItems[category] || []).includes(sub);

  // bottom sheet 的分類結構：{ name, label, subs }
  const filterGroups = useMemo(
    () => categoryOrder.map(category => ({
      name: category,
      label: category,
      subs: subCategoriesOf[category] || [],
    })),
    [categoryOrder, subCategoriesOf]
  );

  // 桌機下拉按鈕上的文字
  const dropdownLabel = useMemo(() => {
    const categories = Object.keys(selectedItems);
    if (categories.length === 0) return '全部分類';

    const total = categories.reduce(
      (sum, category) => sum + Math.max(1, selectedItems[category].length),
      0
    );

    if (categories.length === 1) {
      const [category] = categories;
      const subs = selectedItems[category];
      if (subs.length === 0) return category;
      if (subs.length === 1) return `${category} > ${subs[0]}`;
      return `${category} > ${subs.length} 個選項`;
    }
    return `${total} 個選項`;
  }, [selectedItems]);

  // 手機版觸發器文字：未選 -> placeholder、1 項 -> 該項名稱、多項 -> 首項 +N
  const triggerLabel = isMobile
    ? getTriggerLabel(filterGroups, selectedItems)
    : dropdownLabel;
  const isTriggerPlaceholder = isMobile && Object.keys(selectedItems).length === 0;

  const dismissSheet = () => setIsFilterOpen(false);

  const confirmSheet = (next) => {
    applySelection(next);
    setIsFilterOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasCategoryFilter = Object.keys(selectedItems).length > 0;
  const hasQuery = activeQuery !== '';

  // 依資料類型、分類勾選與關鍵字過濾，維持第一層分組
  const filteredByCategory = useMemo(() => {
    const term = activeQuery.toLowerCase();
    const result = {};

    categoryOrder.forEach(category => {
      if (hasCategoryFilter && !selectedItems[category]) return;

      let items = itemsByCategory[category] || [];

      if (activeType) {
        items = items.filter(item => item.type === activeType);
      }

      const subs = selectedItems[category];
      if (subs && subs.length > 0) {
        items = items.filter(item => subs.includes(item.subcategory));
      }

      if (term) {
        // 文本多比對作者與摘要（搜尋結果列上看得到的文字都要搜得到）
        items = items.filter(item =>
          [item.title, item.category, item.subcategory, item.author, item.summary]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term)
        );
      }

      if (items.length > 0) result[category] = items;
    });

    return result;
  }, [categoryOrder, itemsByCategory, selectedItems, hasCategoryFilter, activeQuery, activeType]);

  const visibleCategories = categoryOrder.filter(category => filteredByCategory[category]);

  // 「全部」：不分分類，上方一列推薦影音、下方文本結果列
  const isMixedView = activeType === '';
  // 單一類型時：未篩選也未搜尋 → 分區預覽；否則 → 完整列表 + 分頁
  const isFullList = hasCategoryFilter || hasQuery;

  const flatItems = visibleCategories.flatMap(category =>
    filteredByCategory[category].map(item => ({ item, category }))
  );
  // 「全部」只做預覽（推薦影音／推薦文本），完整列表與分頁交給單一類型
  const mixedVideos = isMixedView ? flatItems.filter(({ item }) => !isTextItem(item)) : [];
  const mixedTexts = isMixedView ? flatItems.filter(({ item }) => isTextItem(item)) : [];
  const totalItems = flatItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = flatItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageGroups = [];
  pageItems.forEach(({ item, category }) => {
    const last = pageGroups[pageGroups.length - 1];
    if (last && last.category === category) last.items.push(item);
    else pageGroups.push({ category, items: [item] });
  });

  const handleSearch = (event) => {
    event.preventDefault();
    updateListParams({ query: query.trim(), page: 1 });
  };

  // 切換類型時保留關鍵字、清空分類並回到第 1 頁（兩種類型的分類不一定相同）
  const handleTypeChange = (type) => {
    if (type === activeType) return;
    setIsFilterOpen(false);
    updateListParams({ type, selectedItems: {}, page: 1 });
  };

  const handleCardClick = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 推薦影音／推薦文本的「查看全部」：切到該類型，保留關鍵字
  const handleViewAllOfType = (type) => {
    handleTypeChange(type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAll = (category) => {
    applySelection({ [category]: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilter = () => {
    applySelection({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (pageNumber) => {
    updateListParams({ page: pageNumber });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCard = (item, category) => (
    <div
      key={`${category}-${item.id}`}
      className="col-6 col-md-4 col-lg-3"
      onClick={() => handleCardClick(item.url)}
    >
      <div className="ctp-card">
        <div className="ctp-card-image-wrap">
          <img
            src={item.image || noPics}
            alt={item.title}
            className="ctp-card-image"
            onError={(e) => { e.target.src = noPics; }}
          />
        </div>
        <h5 className="ctp-card-title">{item.title}</h5>
      </div>
    </div>
  );

  // 文本：比照主頁搜尋的結果列（mainSearchPage/SearchResults），在來源標籤上方多一行標題。
  // 樣式直接沿用 SearchResults.css 的 sr-* class，本頁只補標題與關鍵字標示。
  const renderTextResult = (item, category) => (
    <li key={`${category}-${item.id}`} className="sr-item ctp-text-result">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="sr-item-link"
      >
        <h3 className="ctp-text-result-title">
          {highlightText(item.title, activeQuery, 'ctp-hl')}
        </h3>
        {/* 來源資訊列：主頁搜尋放資料來源，本頁放作者 */}
        <div className="sr-item-source">
          {item.author && (
            <span className="sr-source-tag">
              {highlightText(item.author, activeQuery, 'ctp-hl')}
            </span>
          )}
          <svg
            className="sr-external-icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M7.5 1H11m0 0v3.5M11 1L5.5 6.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="sr-item-snippet">
          {highlightText(item.summary, activeQuery, 'ctp-hl')}
        </div>
      </a>
    </li>
  );

  // 「全部」的區塊標題：名稱 + 共 N 筆 + 查看全部（切到該類型）
  const renderMixedHeader = (title, count, type) => (
    <div className="ctp-section-header">
      <h2 className="ctp-category-title">
        {title}
        <span className="ctp-category-count">共 {count} 筆</span>
      </h2>
      <button
        type="button"
        className="ctp-viewall-button"
        onClick={() => handleViewAllOfType(type)}
      >
        查看全部 ›
      </button>
    </div>
  );

  // 單一類型的分區內容：影音為卡片牆、文本為結果列
  const renderItems = (items, category) => (activeType === 'text' ? (
    <ol className="sr-list ctp-text-results">
      {items.map(item => renderTextResult(item, category))}
    </ol>
  ) : (
    <div className="row g-2 g-sm-4">
      {items.map(item => renderCard(item, category))}
    </div>
  ));

  if (isLoading) {
    return (
      <div className="culture-test-page">
        <PageLoading text="載入台語文化資料中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="culture-test-page">
        <div className="text-center py-5">
          <p className="text-danger">{error}</p>
          <button className="btn btn-primary mt-3" onClick={loadData}>重新載入</button>
        </div>
      </div>
    );
  }

  return (
    <div className="culture-test-page">
      <div className="ctp-header page-filter-header">
        <div className="container px-4">
          <div className="ctp-header-content">
            {/* 膠囊狀搜尋列：類型下拉（+ 選了類型後的分類下拉）+ 關鍵字 + 搜尋鈕 */}
            <div className="ctp-searchbar">
              <CustomSelect
                className="ctp-type-select"
                options={TYPE_OPTIONS}
                value={activeType}
                onChange={handleTypeChange}
              />

              <span className="ctp-searchbar-divider" aria-hidden="true" />

              {activeType && (
                <>
                  {/* 分類篩選：桌機為下拉選單，手機為 bottom sheet */}
                  <div className="ctp-dropdown" ref={dropdownRef}>
                    <div className="ctp-dropdown-container">
                      <div
                        className={`ctp-dropdown-header ${isTriggerPlaceholder ? 'is-placeholder' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-haspopup={isMobile ? 'dialog' : 'listbox'}
                        aria-expanded={isFilterOpen}
                        onClick={() => {
                          if (!isFilterOpen) updatePosition();
                          setIsFilterOpen(!isFilterOpen);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!isFilterOpen) updatePosition();
                            setIsFilterOpen(!isFilterOpen);
                          }
                        }}
                      >
                        {triggerLabel}
                      </div>
                      <img src={chevronUp} alt="" className="ctp-dropdown-arrow" />
                    </div>

                    {!isMobile && isFilterOpen && menuStyle && createPortal(
                      <div className="ctp-dropdown-menu" ref={dropdownMenuRef} style={menuStyle}>
                        {categoryOrder.map(category => {
                          const subs = subCategoriesOf[category] || [];
                          const selected = selectedItems[category];
                          const hasSelectedChildren = selected && selected.length > 0;
                          const isAllSelected =
                            subs.length > 0 && subs.every(sub => isSubSelected(category, sub));

                          // 無第三層的分類：直接當成可勾選項目（目前四類都有第三層，保留作防呆）
                          if (subs.length === 0) {
                            return (
                              <div key={category} className="ctp-dropdown-row">
                                <div
                                  className={`ctp-dropdown-item ${selected ? 'selected' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); toggleCategory(category); }}
                                >
                                  <span className="ctp-checkbox">{selected ? '✓' : ''}</span>
                                  {category}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={category}
                              className="ctp-dropdown-row"
                              onMouseEnter={(e) => handleCategoryHover(category, true, e.currentTarget)}
                              onMouseLeave={() => {
                                if (openSubmenuCategory !== category) return;
                                clearSubmenuCloseTimer();
                                submenuCloseTimerRef.current = setTimeout(() => {
                                  submenuAnchorRef.current = null;
                                  setOpenSubmenuCategory(null);
                                }, SUBMENU_CLOSE_DELAY);
                              }}
                            >
                              <div
                                className={`ctp-dropdown-item with-submenu ${hasSelectedChildren ? 'has-selected-children' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleAllSubCategories(category); }}
                              >
                                <span className="ctp-checkbox">{isAllSelected ? '✓' : ''}</span>
                                <span className="ctp-dropdown-label">{category}</span>
                                <span className="ctp-submenu-arrow">›</span>
                              </div>

                              {openSubmenuCategory === category && submenuStyle && (
                                <div
                                  className="ctp-submenu"
                                  style={submenuStyle}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {subs.map(sub => (
                                    <div
                                      key={sub}
                                      className={`ctp-submenu-item ${isSubSelected(category, sub) ? 'selected' : ''}`}
                                      onClick={() => toggleSubCategory(category, sub)}
                                    >
                                      <span className="ctp-checkbox">
                                        {isSubSelected(category, sub) ? '✓' : ''}
                                      </span>
                                      {sub}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>,
                      getMenuPortalTarget()
                    )}
                  </div>

                  <span className="ctp-searchbar-divider" aria-hidden="true" />
                </>
              )}

              {/* 關鍵字搜尋 */}
              <form onSubmit={handleSearch} className="ctp-search-container">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  // 手機版搜尋列還要塞兩個下拉，完整提示字會被截斷
                  placeholder={isMobile ? '搜尋關鍵字' : '請輸入您有興趣的關鍵字'}
                  className="ctp-search-input"
                  aria-label="關鍵字"
                />
                <button type="submit" className="ctp-search-btn" aria-label="搜尋">
                  <img src={searchIcon} alt="" className="ctp-search-icon" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {isMixedView ? (
        /* ─── 全部：推薦影音一列 + 推薦文本（不分頁）─── */
        <div className="ctp-mixed-view">
          <div className="container px-4">
            {totalItems === 0 && (
              <div className="ctp-empty">沒有符合條件的資料</div>
            )}

            {mixedVideos.length > 0 && (
              <div className="ctp-mixed-block">
                {renderMixedHeader('推薦影音', mixedVideos.length, 'video')}
                <div className="row g-2 g-sm-4">
                  {mixedVideos.slice(0, PREVIEW_COUNT).map(({ item, category }) => renderCard(item, category))}
                </div>
              </div>
            )}

            {mixedTexts.length > 0 && (
              <div className="ctp-mixed-block">
                {renderMixedHeader('推薦文本', mixedTexts.length, 'text')}
                <ol className="sr-list ctp-text-results">
                  {mixedTexts.slice(0, TEXT_PREVIEW_COUNT).map(({ item, category }) => renderTextResult(item, category))}
                </ol>
              </div>
            )}
          </div>
        </div>
      ) : isFullList ? (
        /* ─── 完整列表（含分頁）─── */
        <>
          <div className="container px-4">
            <div className="ctp-list-toolbar">
              <div className="ctp-list-summary">
                共 {totalItems} 筆｜第 {safePage}／{totalPages} 頁
              </div>
              {hasCategoryFilter && (
                <button type="button" className="ctp-back-button" onClick={handleClearFilter}>
                  返回全部類別
                </button>
              )}
            </div>
          </div>

          {totalItems === 0 ? (
            <div className="container px-4">
              <div className="ctp-empty">沒有符合條件的資料</div>
            </div>
          ) : (
            pageGroups.map((group, index) => (
              <div key={`${group.category}-${index}`} className="ctp-section">
                <div className="container px-4">
                  <h2 className="ctp-category-title">{group.category}</h2>
                  {renderItems(group.items, group.category)}
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="container px-4">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxVisible={4}
              />
            </div>
          )}
        </>
      ) : (
        /* ─── 依第一層分區預覽（每區顯示第一列）─── */
        visibleCategories.map(category => {
          const items = filteredByCategory[category];
          return (
            <div key={category} className="ctp-section">
              <div className="container px-4">
                <div className="ctp-section-header">
                  <h2 className="ctp-category-title">
                    {category}
                    <span className="ctp-category-count">共 {items.length} 筆</span>
                  </h2>
                  <button
                    type="button"
                    className="ctp-viewall-button"
                    onClick={() => handleViewAll(category)}
                  >
                    查看全部 ›
                  </button>
                </div>
                {renderItems(
                  items.slice(0, activeType === 'text' ? TEXT_PREVIEW_COUNT : PREVIEW_COUNT),
                  category
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ─── 手機版分類 bottom sheet ─── */}
      <CategoryFilterSheet
        open={isMobile && isFilterOpen}
        groups={filterGroups}
        value={selectedItems}
        onConfirm={confirmSheet}
        onDismiss={dismissSheet}
      />

    </div>
  );
};

export default CultureTestPage;
