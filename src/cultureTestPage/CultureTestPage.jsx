import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import './CultureTestPage.css';
import searchIcon from '../assets/home/search_logo.svg';
import chevronUp from '../assets/chevron-up.svg';
import noPics from '../assets/culture/festivalN.png';
import PageLoading from '../components/PageLoading/PageLoading';
import Pagination from '../mainSearchPage/Pagination';
import CategoryFilterSheet from '../components/CategoryFilterSheet/CategoryFilterSheet';
import { getTriggerLabel } from '../components/CategoryFilterSheet/categorySelection';
import useIsMobile from '../components/CategoryFilterSheet/useIsMobile';
import useAnchoredMenu, { getMenuPortalTarget } from '../components/AnchoredMenu/useAnchoredMenu';
import { fetchCultureItems, CATEGORY_TREE } from '../services/cultureTestMockApi';
import {
  buildListSearchParams,
  parsePage,
  parseQuery,
  parseSelectedItems,
} from '../utils/listFilterParams';

/**
 * 台語文化（test）
 *
 * 篩選與呈現方式比照「媒體與社群資源」（socialmediaPage）：
 *   - 頁首白底橫幅：分類下拉（第一層 + 第二層子選單，可複選）+ 關鍵字搜尋
 *   - 未篩選時依第一層分區預覽，每區顯示第一列並附「查看全部」
 *   - 有篩選或搜尋時攤平成完整列表 + 分頁
 *   - 內容為「圖片 + 主標」卡片，點擊開新分頁到該筆影音
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

const CultureTestPage = () => {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 分類篩選／關鍵字／頁碼一律以 query string 為準（規則見 utils/listFilterParams.js），
  // 重新整理或把網址分享出去都能回到同一個畫面。
  const [searchParams, setSearchParams] = useSearchParams();

  // 已選分類，格式 { 篩選第一層: [篩選第二層, ...] }；空陣列代表整個第一層被選取
  const selectedItems = useMemo(
    () => parseSelectedItems(searchParams, categoryOrder),
    [searchParams, categoryOrder]
  );
  // activeQuery = 已送出查詢的關鍵字（存在網址上）；query = 輸入框當下的值
  const activeQuery = parseQuery(searchParams);
  const currentPage = parsePage(searchParams);
  const [query, setQuery] = useState(activeQuery);

  // 寫回網址的統一入口；未帶到的欄位沿用目前值
  const updateListParams = useCallback((patch) => {
    setSearchParams(
      buildListSearchParams({ selectedItems, query: activeQuery, page: currentPage, ...patch })
    );
  }, [selectedItems, activeQuery, currentPage, setSearchParams]);

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

  const positionSubmenu = useCallback(() => {
    const anchorEl = submenuAnchorRef.current;
    if (!anchorEl) return;

    const MARGIN = 8;
    const rect = anchorEl.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 200);
    const maxHeight = Math.min(300, window.innerHeight - MARGIN * 2);

    // 右側放不下就翻到左邊；上下夾在畫面內
    let left = rect.right;
    if (left + minWidth > window.innerWidth - MARGIN) {
      left = Math.max(MARGIN, rect.left - minWidth);
    }
    const top = Math.max(MARGIN, Math.min(rect.top, window.innerHeight - MARGIN - maxHeight));

    setSubmenuStyle({ position: 'fixed', top, left, minWidth, maxHeight });
  }, []);

  const handleCategoryHover = (category, hasSubs, el) => {
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
    if (categories.length === 0) return '分類';

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

  // 依分類勾選與關鍵字過濾，維持第一層分組
  const filteredByCategory = useMemo(() => {
    const term = activeQuery.toLowerCase();
    const result = {};

    categoryOrder.forEach(category => {
      if (hasCategoryFilter && !selectedItems[category]) return;

      let items = itemsByCategory[category] || [];

      const subs = selectedItems[category];
      if (subs && subs.length > 0) {
        items = items.filter(item => subs.includes(item.subcategory));
      }

      if (term) {
        items = items.filter(item =>
          `${item.title} ${item.category} ${item.subcategory}`.toLowerCase().includes(term)
        );
      }

      if (items.length > 0) result[category] = items;
    });

    return result;
  }, [categoryOrder, itemsByCategory, selectedItems, hasCategoryFilter, activeQuery]);

  const visibleCategories = categoryOrder.filter(category => filteredByCategory[category]);

  // 未篩選也未搜尋 → 分區預覽；否則 → 完整列表 + 分頁
  const isFullList = hasCategoryFilter || hasQuery;

  const flatItems = visibleCategories.flatMap(category =>
    filteredByCategory[category].map(item => ({ item, category }))
  );
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

  const handleCardClick = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
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
                          submenuAnchorRef.current = null;
                          setOpenSubmenuCategory(null);
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

            {/* 關鍵字搜尋 */}
            <form onSubmit={handleSearch} className="ctp-search-container">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋..."
                className="ctp-search-input"
              />
              <button type="submit" className="ctp-search-btn" aria-label="搜尋">
                <img src={searchIcon} alt="搜尋" className="ctp-search-icon" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {isFullList ? (
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
                  <div className="row g-2 g-sm-4">
                    {group.items.map(item => renderCard(item, group.category))}
                  </div>
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
                <div className="row g-2 g-sm-4">
                  {items.slice(0, PREVIEW_COUNT).map(item => renderCard(item, category))}
                </div>
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
