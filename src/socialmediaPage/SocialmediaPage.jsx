import React, { useState, useEffect, useRef } from 'react';
import './SocialmediaPage.css';
import searchIcon from '../assets/home/search_logo.svg';
import chevronUp from '../assets/chevron-up.svg';
// import questionMarkIcon from '../assets/question-mark.svg';
import noPics from "../assets/culture/festivalN.png";

const SocialmediaPage = () => {
    const [selectedType, setSelectedType] = useState("分類");  // 將 "類型" 改為 "分類"
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [query, setQuery] = useState("");

    // 儲存多選項目，格式為 { 主分類: [子項目1, 子項目2, ...] }
    const [selectedItems, setSelectedItems] = useState({});

    // 新增 API 相關狀態
    const [socialMediaData, setSocialMediaData] = useState({});
    const [menuItems, setMenuItems] = useState({});
    const [categoryOrder, setCategoryOrder] = useState([]);  // 新增：儲存類別順序
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 儲存每個分類的滾動位置引用
    const categoryRefs = useRef({});

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
                    image: item.image ? `https://dev.taigiedu.com${item.image}` : null
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

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.social-custom-dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // 更新顯示文字的統一函數
    const updateDisplayText = (selectedItemsObj) => {
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
    };

    // 處理多選邏輯
    const handleTypeChange = (type, subType = null) => {
        console.log('Before change:', { selectedType, selectedItems });

        if (!subType) {
            // 如果是無子選單的主類別
            if (!menuItems[type].hasSubMenu) {
                const newSelectedItems = { ...selectedItems };

                if (newSelectedItems[type]) {
                    // 已選擇，則移除
                    delete newSelectedItems[type];
                    setSelectedItems(newSelectedItems);
                    updateDisplayText(newSelectedItems);
                } else {
                    // 未選擇，則添加 (無子選單項目以空陣列表示已選擇)
                    newSelectedItems[type] = [];
                    setSelectedItems(newSelectedItems);
                    updateDisplayText(newSelectedItems);
                }

                // 保持下拉選單開啟，以支援多選功能
            } else {
                // 有子選單的主類別，不做選擇，只是顯示該類別，保持下拉選單開啟
                setSelectedType(type);
            }
        } else {
            // 子選單項目處理 -允許多個分類同時被選擇
            const newSelectedItems = { ...selectedItems };

            // 初始化該類別的數組，如果不存在
            if (!newSelectedItems[type]) {
                newSelectedItems[type] = [];
            }

            // 檢查項目是否已選擇
            const itemIndex = newSelectedItems[type].indexOf(subType);

            if (itemIndex > -1) {
                // 已選擇，則移除
                newSelectedItems[type].splice(itemIndex, 1);

                // 檢查該類別下是否還有項目
                if (newSelectedItems[type].length === 0) {
                    delete newSelectedItems[type];
                }
            } else {
                // 未選擇，則添加
                newSelectedItems[type].push(subType);
            }

            // 一次性更新狀態，防止多次渲染
            setSelectedItems(newSelectedItems);

            // 更新顯示文字
            updateDisplayText(newSelectedItems);
        }

        console.log('After change:', { type, subType });
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
                <div className="text-center py-5">
                    <p>載入中...</p>
                </div>
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

    return (
        <div className="socialmedia-page">
            <div className="socialmedia-header">
                <div className="container px-4">
                    <div className="socialmedia-header-content">
                        <div className="social-custom-dropdown">
                            <div className="dropdown-container">
                                <div
                                    className="dropdown-header social-type-dropdown"
                                    onClick={() => {
                                        console.log("dropdown-header clicked");
                                        setIsDropdownOpen(!isDropdownOpen);
                                    }}
                                >
                                    {selectedType}
                                </div>
                                <img
                                    src={chevronUp}
                                    alt="dropdown arrow"
                                    className="dropdown-arrow"
                                />
                            </div>
                            {isDropdownOpen && (
                                <div className="social-dropdown-menu">
                                    {/* 使用 categoryOrder 來控制顯示順序 */}
                                    {categoryOrder.map(type => {
                                        const menuItem = menuItems[type];
                                        if (!menuItem) return null;  // 如果 menuItem 不存在，跳過
                                        
                                        const { hasSubMenu, subItems } = menuItem;
                                        const hasSelectedChildren = selectedItems[type] && selectedItems[type].length > 0;

                                        return (
                                            <div key={type} className="social-dropdown-item-container">
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
                                                        <span className="social-submenu-arrow">›</span>
                                                        <div
                                                            className="social-submenu"
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
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSearch} className="social-search-container">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
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
            {/* 使用 categoryOrder 來控制顯示順序 */}
            {categoryOrder.map(category => {
                const items = filteredData[category];
                if (!items || items.length === 0) return null;  // 如果沒有項目，不顯示該分類
                
                return (
                    <div key={category} className="socialmedia-section" ref={categoryRefs.current[category]}>
                        <div className="container px-4">
                            <h2 className="social-category-title">{category || "（空白類別）"}</h2>
                            <div className="row g-4">
                                {items.map(item => (
                                    <div key={item.id}
                                        className="col-12 col-sm-6 col-md-4 col-lg-3"
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
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
            {/* <div className="text-start mt-4 socialmedia-report-issue">
                <img src={questionMarkIcon} className="question-icon" />
                如有任何問題，請點此回報問題
            </div> */}
        </div>
    );
};

export default SocialmediaPage;