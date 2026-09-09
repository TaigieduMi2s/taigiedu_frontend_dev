import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import './SocialmediaPage.css';
import searchIcon from '../assets/home/search_logo.svg';
import chevronUp from '../assets/chevron-up.svg';
import noPics from "../assets/culture/festivalN.png";
import envConfig from "../config";
import PageLoading from "../components/PageLoading/PageLoading";
import Pagination from "../mainSearchPage/Pagination";
import CategoryFilterSheet from "../components/CategoryFilterSheet/CategoryFilterSheet";
import { getTriggerLabel } from "../components/CategoryFilterSheet/categorySelection";
import useIsMobile from "../components/CategoryFilterSheet/useIsMobile";
import useAnchoredMenu, { getMenuPortalTarget } from "../components/AnchoredMenu/useAnchoredMenu";
import ReportIssueLink from "../components/ReportIssue/ReportIssueLink";
import {
    buildListSearchParams,
    parsePage,
    parseQuery,
    parseSelectedItems,
} from "../utils/listFilterParams";

// 顯示規則：桌機版每列 4 筆、每頁最多 15 列；未篩選時每類別預覽第一列（4 筆）
const ITEMS_PER_ROW = 4;
const MAX_ROWS_PER_PAGE = 15;
const PAGE_SIZE = ITEMS_PER_ROW * MAX_ROWS_PER_PAGE;
const PREVIEW_COUNT = ITEMS_PER_ROW;

const SocialmediaPage = () => {
    const [selectedType, setSelectedType] = useState("分類");  // 將 "類型" 改為 "分類"
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // 分類篩選／關鍵字／頁碼一律以 query string 為準（規則見 utils/listFilterParams.js），
    // 重新整理或把網址分享出去都能回到同一個畫面。
    const [searchParams, setSearchParams] = useSearchParams();

    // 新增 API 相關狀態
    const [socialMediaData, setSocialMediaData] = useState({});
    const [menuItems, setMenuItems] = useState({});
    const [categoryOrder, setCategoryOrder] = useState([]);  // 新增：儲存類別順序
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 由網址還原的畫面狀態：selectedItems 格式為 { 主分類: [子項目1, 子項目2, ...] }
    const selectedItems = useMemo(
        () => parseSelectedItems(searchParams, categoryOrder),
        [searchParams, categoryOrder]
    );
    const query = parseQuery(searchParams);
    const currentPage = parsePage(searchParams);

    // 寫回網址的統一入口；未帶到的欄位沿用目前值。
    // replace：關鍵字是邊打邊篩，逐字塞進 history 會讓上一頁按不完。
    const updateListParams = useCallback((patch, { replace = false } = {}) => {
        setSearchParams(
            buildListSearchParams({ selectedItems, query, page: currentPage, ...patch }),
            { replace }
        );
    }, [selectedItems, query, currentPage, setSearchParams]);

    // 儲存每個分類的滾動位置引用
    const categoryRefs = useRef({});

    // 手機版改用 bottom sheet（選擇先存 draft、按確認才套用）
    const isMobile = useIsMobile();

    // 桌機下拉：以觸發欄位為定位基準（與認證考試的 CustomSelect 同一套）
    const dropdownTriggerRef = useRef(null);
    const dropdownMenuRef = useRef(null);
    const { menuStyle, updatePosition } = useAnchoredMenu(
        dropdownTriggerRef,
        !isMobile && isDropdownOpen,
        { gap: 8, matchTriggerWidth: false }
    );

    // 第二層子選單：主選單會內部捲動，子選單改用 fixed + JS 定位才不會被裁切或超出畫面
    const [openSubmenuType, setOpenSubmenuType] = useState(null);
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

    const handleCategoryHover = (type, hasSubMenu, el) => {
        if (!hasSubMenu) {
            submenuAnchorRef.current = null;
            setOpenSubmenuType(null);
            return;
        }
        submenuAnchorRef.current = el;
        setOpenSubmenuType(type);
        positionSubmenu();
    };

    // 子選單開啟期間跟著捲動／縮放重新定位
    useEffect(() => {
        if (!openSubmenuType) return undefined;
        const onReposition = () => positionSubmenu();
        window.addEventListener('scroll', onReposition, true);
        window.addEventListener('resize', onReposition);
        return () => {
            window.removeEventListener('scroll', onReposition, true);
            window.removeEventListener('resize', onReposition);
        };
    }, [openSubmenuType, positionSubmenu]);

    // 主選單收合時一併關閉子選單
    useEffect(() => {
        if (!isDropdownOpen) {
            submenuAnchorRef.current = null;
            setOpenSubmenuType(null);
        }
    }, [isDropdownOpen]);

    // bottom sheet 的分類結構：{ name, label, subs }
    const filterGroups = useMemo(
        () => categoryOrder
            .filter(category => menuItems[category])
            .map(category => ({
                name: category,
                label: category || "（空白類別）",
                subs: menuItems[category].subItems || [],
            })),
        [categoryOrder, menuItems]
    );

    // 從 API 獲取社交媒體資料
    const fetchSocialMediaData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/media`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const apiResponse = await response.json();
            console.log('Social Media API Response:', apiResponse);
            
            // 解構 API 回應，支援新格式和舊格式
            const { category_order, data } = apiResponse;
            const actualData = data || apiResponse;  // 向後相容：如果沒有 data 欄位，使用整個回應
            
            // 決定類別順序：使用 category_order 或 fallback 到 Object.keys()
            const orderedCategories = category_order || Object.keys(actualData);
            
            // 將 API 回傳的資料格式化為適合顯示的格式
            const formattedData = {};
            const dynamicMenuItems = {};
            
            // 使用 orderedCategories 來迭代，確保順序正確
            orderedCategories.forEach(category => {
                // 如果該類別在 data 中不存在，跳過（顯示空白）
                if (!actualData[category]) {
                    return;
                }
                
                // 為圖片添加前綴
                const formattedItems = actualData[category].map(item => ({
                    ...item,
                    image: item.image ? `${envConfig.imageUrl}${item.image}` : null
                }));
                
                // 保持類別名稱不變（包括空字串）
                formattedData[category] = formattedItems;
                
                // 檢查是否有子分類
                const subCategories = [...new Set(actualData[category]
                    .filter(item => item.subcategory && item.subcategory.trim() !== "")
                    .map(item => item.subcategory))];
                
                if (subCategories.length > 0) {
                    dynamicMenuItems[category] = {
                        hasSubMenu: true,
                        subItems: subCategories
                    };
                } else {
                    dynamicMenuItems[category] = { hasSubMenu: false };
                }
            });

            setSocialMediaData(formattedData);
            setMenuItems(dynamicMenuItems);
            setCategoryOrder(orderedCategories.filter(cat => actualData[cat]));  // 只保存存在的類別
            
            // 為每個分類創建 ref
            const refs = {};
            orderedCategories.forEach(category => {
                if (actualData[category]) {
                    refs[category] = React.createRef();
                }
            });
            categoryRefs.current = refs;

        } catch (error) {
            console.error('Error fetching social media data:', error);
            setError('載入社交媒體資料時發生錯誤');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSocialMediaData();
    }, []);


    // 桌機下拉：點擊面板外關閉（手機版改由 bottom sheet 的遮罩處理）
    React.useEffect(() => {
        if (isMobile) return undefined;
        const handleClickOutside = (event) => {
            if (!isDropdownOpen) return;
            // 選單已 portal 到 #root，觸發器與選單都要排除
            if (event.target.closest('.social-custom-dropdown')) return;
            if (dropdownMenuRef.current?.contains(event.target)) return;
            setIsDropdownOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, isMobile]);

    // 桌機／手機切換時關閉面板，避免殘留另一種型態的開啟狀態
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [isMobile]);

    // 更新顯示文字的統一函數
    const updateDisplayText = useCallback((selectedItemsObj) => {
        const totalCategories = Object.keys(selectedItemsObj).length;

        if (totalCategories === 0) {
            setSelectedType("分類");
            return;
        }

        // 計算總共選擇的項目數量
        let totalSelectedCount = 0;
        const categoryDetails = [];

        Object.keys(selectedItemsObj).forEach(category => {
            const subItems = selectedItemsObj[category];
            const displayCategory = category || "（空白類別）";  // 處理空字串顯示
            if (subItems.length === 0) {
                // 無子選單的主分類
                totalSelectedCount += 1;
                categoryDetails.push(displayCategory);
            } else {
                // 有子選單的分類
                totalSelectedCount += subItems.length;
                if (subItems.length === 1) {
                    categoryDetails.push(`${displayCategory} > ${subItems[0]}`);
                } else {
                    categoryDetails.push(`${displayCategory} > ${subItems.length} 個選項`);
                }
            }
        });

        // 根據總選擇數量決定顯示方式
        if (totalSelectedCount === 1) {
            // 只有一個項目被選擇，顯示完整名稱
            setSelectedType(categoryDetails[0]);
        } else if (totalCategories === 1) {
            // 只有一個分類，但有多個子項目
            setSelectedType(categoryDetails[0]);
        } else {
            // 多個分類被選擇，顯示總數
            setSelectedType(`${totalSelectedCount} 個選項`);
        }
    }, []);

    // 下拉按鈕文字跟著已選條件走（含重新整理後由網址還原的條件）
    useEffect(() => {
        updateDisplayText(selectedItems);
    }, [selectedItems, updateDisplayText]);

    // 處理多選邏輯
    const handleTypeChange = (type, subType = null) => {
        if (!subType) {
            // 如果是無子選單的主類別
            if (!menuItems[type].hasSubMenu) {
                const newSelectedItems = { ...selectedItems };

                if (newSelectedItems[type]) {
                    // 已選擇，則移除
                    delete newSelectedItems[type];
                } else {
                    // 未選擇，則添加 (無子選單項目以空陣列表示已選擇)
                    newSelectedItems[type] = [];
                }

                updateListParams({ selectedItems: newSelectedItems, page: 1 });

                // 保持下拉選單開啟，以支援多選功能
            } else {
                // 有子選單的主類別，不做選擇，只是顯示該類別，保持下拉選單開啟
                setSelectedType(type);
            }
        } else {
            // 子選單項目處理 -允許多個分類同時被選擇
            const newSelectedItems = { ...selectedItems };
            const current = newSelectedItems[type] || [];

            // 已選擇則移除，未選擇則添加；該類別下沒有項目時整個拿掉
            const updated = current.includes(subType)
                ? current.filter(item => item !== subType)
                : [...current, subType];

            if (updated.length === 0) delete newSelectedItems[type];
            else newSelectedItems[type] = updated;

            updateListParams({ selectedItems: newSelectedItems, page: 1 });
        }
    };

    // 檢查項目是否被選擇
    const isItemSelected = (type, subType) => {
        return selectedItems[type] && selectedItems[type].includes(subType);
    }

    // 獲取要顯示的項目（根據選擇的分類、子分類和搜尋關鍵字進行過濾）
    const getFilteredItems = () => {
        let filteredData = {};

        // 首先根據下拉選單篩選
        if (Object.keys(selectedItems).length === 0) {
            // 如果沒有選擇任何分類，使用所有資料
            filteredData = socialMediaData;
        } else {
            // 根據選擇的分類篩選
            Object.keys(selectedItems).forEach(mainCategory => {
                const selectedSubItems = selectedItems[mainCategory];

                if (socialMediaData[mainCategory]) {
                    if (selectedSubItems.length === 0) {
                        // 如果選擇了主分類但沒有子項目，顯示該分類的所有項目
                        filteredData[mainCategory] = socialMediaData[mainCategory];
                    } else {
                        // 根據選擇的子分類過濾項目
                        const filteredItems = socialMediaData[mainCategory].filter(item =>
                            selectedSubItems.includes(item.subcategory) ||
                            (selectedSubItems.includes("") && (!item.subcategory || item.subcategory.trim() === ""))
                        );

                        if (filteredItems.length > 0) {
                            filteredData[mainCategory] = filteredItems;
                        }
                    }
                }
            });
        }

        // 然後根據搜尋關鍵字進一步篩選
        if (query.trim() !== "") {
            const searchFilteredData = {};
            const searchTerm = query.toLowerCase().trim();

            Object.keys(filteredData).forEach(category => {
                const filteredItems = filteredData[category].filter(item => {
                    // 搜尋項目的 title, description, name 等欄位
                    const searchFields = [
                        item.title,
                        item.description,
                        item.name,
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
        }

        return filteredData;
    };

    const handleCardClick = (url) => {
        window.open(url, '_blank');
    };

    // 「查看全部」：切換為該類別的完整列表
    const handleViewAll = (category) => {
        updateListParams({ selectedItems: { [category]: [] }, page: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 清除分類篩選，回到分區預覽
    const handleClearFilter = () => {
        updateListParams({ selectedItems: {}, page: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageChange = (pageNumber) => {
        updateListParams({ page: pageNumber });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ---- 手機版 bottom sheet ----
    // 確認：套用 draft 並同步觸發器文字（桌機下拉仍讀 selectedType）
    const handleSheetConfirm = (nextSelectedItems) => {
        updateListParams({ selectedItems: nextSelectedItems, page: 1 });
        setIsDropdownOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 單張卡片
    const renderCard = (item, category) => (
        <div key={`${category}-${item.id}`}
            className="col-6 col-md-4 col-lg-3"
            onClick={() => handleCardClick(item.url)}>
            <div className="socialmedia-card">
                <div className="social-image-container">
                    <img
                        src={item.image || noPics}
                        alt={item.title}
                        className="socialmedia-image"
                        onError={(e) => {
                            e.target.src = noPics;
                        }}
                    />
                </div>
                <h5 className="text-center mt-2">{item.title}</h5>
            </div>
        </div>
    );

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim() === "") return;

        // 重新載入頁面時會觸發篩選邏輯
        // 這裡不需要額外的邏輯，因為顯示邏輯會在 render 時處理
    };

    // 如果正在載入，顯示載入中訊息
    if (isLoading) {
        return (
            <div className="socialmedia-container">
                <PageLoading text="載入媒體與社群資源中..." />
            </div>
        );
    }

    // 如果發生錯誤，顯示錯誤訊息
    if (error) {
        return (
            <div className="socialmedia-container">
                <div className="text-center py-5">
                    <p className="text-danger">{error}</p>
                    <button
                        className="btn btn-primary mt-3"
                        onClick={fetchSocialMediaData}
                    >
                        重新載入
                    </button>
                </div>
            </div>
        );
    }

    const filteredData = getFilteredItems();
    const hasCategoryFilter = Object.keys(selectedItems).length > 0;
    const hasQuery = query.trim() !== '';
    // 未套用分類篩選與關鍵字搜尋時 → 依類別分區預覽；否則 → 完整列表 + 分頁
    const isFullList = hasCategoryFilter || hasQuery;

    // 完整列表模式：依類別順序攤平後分頁
    const flatItems = categoryOrder.flatMap(category =>
        (filteredData[category] || []).map(item => ({ item, category }))
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
        <div className="socialmedia-page">
            <div className="socialmedia-header page-filter-header">
                <div className="container px-4">
                    <div className="socialmedia-header-content">
                        <div className="social-custom-dropdown" ref={dropdownTriggerRef}>
                            <div className="dropdown-container">
                                <div
                                    className={`dropdown-header social-type-dropdown ${
                                        isMobile && Object.keys(selectedItems).length === 0
                                            ? 'is-placeholder'
                                            : ''
                                    }`}
                                    role="button"
                                    tabIndex={0}
                                    aria-haspopup={isMobile ? 'dialog' : 'listbox'}
                                    aria-expanded={isDropdownOpen}
                                    onClick={() => {
                                        if (!isDropdownOpen) updatePosition();
                                        setIsDropdownOpen(!isDropdownOpen);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            if (!isDropdownOpen) updatePosition();
                                            setIsDropdownOpen(!isDropdownOpen);
                                        }
                                    }}
                                >
                                    {isMobile
                                        ? getTriggerLabel(filterGroups, selectedItems)
                                        : selectedType}
                                </div>
                                <img
                                    src={chevronUp}
                                    alt="dropdown arrow"
                                    className="dropdown-arrow"
                                />
                            </div>
                            {!isMobile && isDropdownOpen && menuStyle && createPortal(
                                <div className="social-dropdown-menu" ref={dropdownMenuRef} style={menuStyle}>
                                    {/* 使用 categoryOrder 來控制顯示順序 */}
                                    {categoryOrder.map(type => {
                                        const menuItem = menuItems[type];
                                        if (!menuItem) return null;  // 如果 menuItem 不存在，跳過
                                        
                                        const { hasSubMenu, subItems } = menuItem;
                                        const hasSelectedChildren = selectedItems[type] && selectedItems[type].length > 0;

                                        return (
                                            <div
                                                key={type}
                                                className="social-dropdown-item-container"
                                                onMouseEnter={(e) => handleCategoryHover(type, hasSubMenu, e.currentTarget)}
                                                onMouseLeave={() => {
                                                    if (openSubmenuType !== type) return;
                                                    submenuAnchorRef.current = null;
                                                    setOpenSubmenuType(null);
                                                }}
                                            >
                                                {!hasSubMenu ? (
                                                    <div
                                                        className={`social-dropdown-item ${selectedItems[type] ? 'selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTypeChange(type);
                                                        }}
                                                    >
                                                        <span className="checkbox-indicator">
                                                            {selectedItems[type] ? '✓' : ''}
                                                        </span>
                                                        {type || "（空白類別）"}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`social-dropdown-item with-submenu ${hasSelectedChildren ? 'has-selected-children' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // 只改變顯示的主類別名稱，不觸發選擇
                                                            if (selectedType !== type) {
                                                                setSelectedType(type);
                                                            }
                                                        }}
                                                    >
                                                        <span className="checkbox-indicator"></span>
                                                        <span>{type || "（空白類別）"}</span>
                                                        <span className="social-submenu-arrow hidden-mobile">›</span>
                                                        {openSubmenuType === type && submenuStyle && (
                                                        <div
                                                            className="social-submenu"
                                                            style={submenuStyle}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {subItems.map(subItem => (
                                                                <div
                                                                    key={subItem}
                                                                    className={`social-submenu-item ${isItemSelected(type, subItem) ? 'selected' : ''}`}
                                                                    onMouseDown={(e) => { // 改用 onMouseDown 代替 onClick，反應更靈敏
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleTypeChange(type, subItem);
                                                                    }}
                                                                >
                                                                    {subItem}
                                                                    {isItemSelected(type, subItem) && (
                                                                        <span className="checkmark">✓</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>,
                                getMenuPortalTarget()
                            )}
                        </div>

                        <form onSubmit={handleSearch} className="social-search-container">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => updateListParams(
                                    { query: e.target.value, page: 1 },
                                    { replace: true }
                                )}
                                placeholder="搜尋..."
                                className="social-search-input"
                            />
                            <img
                                src={searchIcon}
                                className="social-search-icon"
                                onClick={handleSearch}
                            />
                        </form>
                    </div>
                </div>
            </div>
            {isFullList ? (
                /* ─── 完整列表（含分頁）─── */
                <>
                    <div className="container px-4">
                        <div className="social-list-toolbar">
                            <div className="social-list-summary">
                                共 {totalItems} 筆｜第 {safePage}／{totalPages} 頁
                            </div>
                            {hasCategoryFilter && (
                                <button
                                    type="button"
                                    className="social-back-button"
                                    onClick={handleClearFilter}
                                >
                                    返回全部類別
                                </button>
                            )}
                        </div>
                    </div>

                    {totalItems === 0 ? (
                        <div className="container px-4">
                            <div className="social-empty">沒有符合條件的資料</div>
                        </div>
                    ) : (
                        pageGroups.map((group, index) => (
                            <div key={`${group.category}-${index}`} className="socialmedia-section">
                                <div className="container px-4">
                                    <h2 className="social-category-title">{group.category || "（空白類別）"}</h2>
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
                /* ─── 依類別分區預覽（每類別顯示第一列）─── */
                categoryOrder.map(category => {
                    const items = filteredData[category];
                    if (!items || items.length === 0) return null;  // 如果沒有項目，不顯示該分類

                    return (
                        <div key={category} className="socialmedia-section" ref={categoryRefs.current[category]}>
                            <div className="container px-4">
                                <div className="social-section-header">
                                    <h2 className="social-category-title">
                                        {category || "（空白類別）"}
                                        <span className="social-category-count">共 {items.length} 筆</span>
                                    </h2>
                                    <button
                                        type="button"
                                        className="social-viewall-button"
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
            <div className="container px-4">
                <ReportIssueLink pageKey="socialmedia" className="socialmedia-report-issue" />
            </div>

            {/* ─── 手機版分類 bottom sheet ─── */}
            <CategoryFilterSheet
                open={isMobile && isDropdownOpen}
                groups={filterGroups}
                value={selectedItems}
                onConfirm={handleSheetConfirm}
                onDismiss={() => setIsDropdownOpen(false)}
            />
        </div>
    );
};

export default SocialmediaPage;