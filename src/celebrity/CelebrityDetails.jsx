import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import './CelebrityDetails.css';
import nopic from "../assets/celebrity/nopic.png"; // 預設無圖片

// 可折疊的作品項目元件
const CollapsibleWorkItem = ({ series, items }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <li className="collapsible-work-item">
            <div
                className="work-series-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="work-series-title">{series}</span>
                <span className={`work-series-arrow ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                </span>
            </div>
            {isExpanded && (
                <ul className="work-series-items">
                    {items.map((item, index) => (
                        <li key={index} className="work-series-item">
                            <span className="work-item-text">{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

const CelebrityDetails = () => {
    const { showError } = useToast();
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');

    // 狀態管理
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [celebrityData, setCelebrityData] = useState(null);
    const [activeTab, setActiveTab] = useState('experience');
    const [activeWorkCategory, setActiveWorkCategory] = useState('all');

    useEffect(() => {
        if (name) {
            fetchCelebrityDetails(name);
        } else {
            setError('未提供名人姓名');
            setIsLoading(false);
        }
    }, [name]);

    // 從 API 獲取名人詳細資料
    const fetchCelebrityDetails = async (celebrityName) => {
        setIsLoading(true);
        setError(null);
        try {
            const parameters = {
                "name": celebrityName
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/celebrity/detail`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(parameters)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("作家詳細資料：", data);

            if (data && data.basicInfo) {
                // 根據 API 回傳格式處理資料
                const formattedData = {
                    basicInfo: {
                        name: data.basicInfo.name || celebrityName,
                        pron_poj: data.basicInfo.pron_poj || '',
                        pron_tl: data.basicInfo.pron_tl || '',
                        photo: data.basicInfo.photo ? `${import.meta.env.VITE_IMAGE_URL}/backend/static/celebrity/${data.basicInfo.photo}` : nopic,
                        illustration: data.basicInfo.illustration ? `${import.meta.env.VITE_IMAGE_URL}/backend/static/celebrity/${data.basicInfo.illustration}` : null,
                        born: data.basicInfo.born || '',
                        dead: data.basicInfo.dead || '',
                        highlights: data.basicInfo.highlights || [],
                        intro: data.basicInfo.intro || ''
                    },
                    experience: data.experience || [],
                    works: {
                        categories: data.works_categories || [],
                        items: data.works_items || {}
                    },
                    resources: data.resources || [],
                    metaverse: data.metaverse || [],
                    awards: data.awards || []
                };

                setCelebrityData(formattedData);

                // 設置第一個作品分類為預設選中
                if (formattedData.works.categories && formattedData.works.categories.length > 0) {
                    setActiveWorkCategory(formattedData.works.categories[0]);
                }
            } else {
                throw new Error("找不到該名人的資料");
            }
        } catch (error) {
            console.error("查詢失敗", error);
            setError(error.message);
            showError(`載入 ${celebrityName} 的詳細資料失敗，請稍後再試`);
            setCelebrityData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 處理頁籤切換
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // 處理作品分類切換
    const handleCategoryClick = (category) => {
        setActiveWorkCategory(category);
    };

    // 檢查標籤是否有資料的函數
    const hasData = (tabName) => {
        if (!celebrityData) return false;

        switch (tabName) {
            case 'experience':
                return Array.isArray(celebrityData.experience) && celebrityData.experience.length > 0;
            case 'works':
                return celebrityData.works.categories && celebrityData.works.categories.length > 0;
            case 'resources':
                return Array.isArray(celebrityData.resources) && celebrityData.resources.length > 0;
            case 'metaverse':
                return Array.isArray(celebrityData.metaverse) && celebrityData.metaverse.length > 0;
            case 'awards':
                return Array.isArray(celebrityData.awards) && celebrityData.awards.length > 0;
            default:
                return false;
        }
    };

    // 獲取可用的標籤列表
    const getAvailableTabs = () => {
        const allTabs = ['experience', 'works', 'resources', 'metaverse', 'awards'];
        return allTabs.filter(tab => hasData(tab));
    };

    // 設置第一個有資料的標籤為預設
    useEffect(() => {
        if (celebrityData) {
            const allTabs = ['experience', 'works', 'resources', 'metaverse', 'awards'];
            const availableTabs = allTabs.filter(tab => {
                switch (tab) {
                    case 'experience':
                        return Array.isArray(celebrityData.experience) && celebrityData.experience.length > 0;
                    case 'works':
                        return celebrityData.works.categories && celebrityData.works.categories.length > 0;
                    case 'resources':
                        return Array.isArray(celebrityData.resources) && celebrityData.resources.length > 0;
                    case 'metaverse':
                        return Array.isArray(celebrityData.metaverse) && celebrityData.metaverse.length > 0;
                    case 'awards':
                        return Array.isArray(celebrityData.awards) && celebrityData.awards.length > 0;
                    default:
                        return false;
                }
            });
            if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
                setActiveTab(availableTabs[0]);
            }
        }
    }, [celebrityData, activeTab]);

    // 渲染作品項目的函數
    const renderWorkItem = (work, index) => {
        // 檢查是否為帶有 series 和 items 的物件
        if (typeof work === 'object' && work.series && work.items) {
            return (
                <CollapsibleWorkItem
                    key={index}
                    series={work.series}
                    items={work.items}
                />
            );
        } else {
            // 一般的字串項目
            return <li key={index}>{work}</li>;
        }
    };

    // 渲染當前選擇的作品
    const renderWorks = () => {
        if (!celebrityData?.works) return null;

        const { categories, items } = celebrityData.works;

        if (activeWorkCategory === 'all') {
            // 顯示所有作品
            return (
                <>
                    {categories.map(category => (
                        <div key={category} className="work-category-section">
                            <h3 className="work-category-title">{category}</h3>
                            <ul className="work-list">
                                {Array.isArray(items[category]) ?
                                    items[category].map((work, index) => renderWorkItem(work, index)) :
                                    <li>暫無資料</li>
                                }
                            </ul>
                        </div>
                    ))}
                </>
            );
        } else {
            // 顯示選定分類的作品
            return (
                <div className="work-category-section">
                    <ul className="work-list">
                        {Array.isArray(items[activeWorkCategory]) ?
                            items[activeWorkCategory].map((work, index) => renderWorkItem(work, index)) :
                            <li>暫無資料</li>
                        }
                    </ul>
                </div>
            );
        }
    };

    // 渲染載入狀態
    if (isLoading) {
        return (
            <div className="celebrity-details-container">
                <div className="celebrity-loading">
                    <div className="loading-spinner"></div>
                    <p>載入名人詳細資料中...</p>
                </div>
            </div>
        );
    }

    // 渲染錯誤狀態
    if (error || !celebrityData) {
        return (
            <div className="celebrity-details-container">
                <div className="celebrity-loading">
                    <p>{error || '載入失敗'}</p>
                    <button onClick={() => fetchCelebrityDetails(name)} className="btn btn-primary mt-2">
                        重新載入
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="celebrity-details-container">
            {/* 標題區塊：名字+拼音 */}
            <div className="celebrity-details-header">
                <h1>
                    {celebrityData.basicInfo.name}
                    {celebrityData.basicInfo.pron_poj && (
                        <span className="celebrity-pron"> {celebrityData.basicInfo.pron_poj}</span>
                    )}
                </h1>
                <div className="celebrity-subtitle">
                    {celebrityData.basicInfo.born && celebrityData.basicInfo.dead ?
                        `${celebrityData.basicInfo.born}年-${celebrityData.basicInfo.dead}年` :
                        celebrityData.basicInfo.born ? `${celebrityData.basicInfo.born}年-` : ''
                    }
                </div>
                {/* 顯示 highlights */}
                {celebrityData.basicInfo.highlights && celebrityData.basicInfo.highlights.length > 0 && (
                    <div className="celebrity-highlights">
                        {celebrityData.basicInfo.highlights.map((highlight, index) => (
                            <span key={index} className="highlight-tag">#{highlight}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* 內容區塊：圖片+介紹 */}
            <div className="celebrity-details-content">
                <div className="celebrity-image-container">
                    <img
                        src={celebrityData.basicInfo.photo}
                        alt={celebrityData.basicInfo.name}
                        className="celebrity-detail-image"
                        onError={(e) => {
                            e.target.src = nopic;
                        }}
                    />
                </div>
                <div className="celebrity-intro">
                    <p>{celebrityData.basicInfo.intro}</p>
                </div>
            </div>

            {/* 頁籤區塊 */}
            <div className="celebrity-tabs">
                <div className="celebrity-tab-buttons">
                    {hasData('experience') && (
                        <button
                            className={`tab-button ${activeTab === 'experience' ? 'active' : ''}`}
                            onClick={() => handleTabClick('experience')}
                        >
                            經歷
                        </button>
                    )}
                    {hasData('works') && (
                        <button
                            className={`tab-button ${activeTab === 'works' ? 'active' : ''}`}
                            onClick={() => handleTabClick('works')}
                        >
                            作品
                        </button>
                    )}
                    {hasData('resources') && (
                        <button
                            className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
                            onClick={() => handleTabClick('resources')}
                        >
                            網路資源
                        </button>
                    )}
                    {hasData('metaverse') && (
                        <button
                            className={`tab-button ${activeTab === 'metaverse' ? 'active' : ''}`}
                            onClick={() => handleTabClick('metaverse')}
                        >
                            元宇宙
                        </button>
                    )}
                    {hasData('awards') && (
                        <button
                            className={`tab-button ${activeTab === 'awards' ? 'active' : ''}`}
                            onClick={() => handleTabClick('awards')}
                        >
                            得獎
                        </button>
                    )}
                </div>

                {/* 頁籤內容 */}
                <div className="celebrity-tab-content">
                    {/* 經歷頁籤 */}
                    {hasData('experience') && (
                        <div className={`tab-panel ${activeTab === 'experience' ? 'active' : ''}`}>
                            <ul className="experience-list">
                                {celebrityData.experience.map((exp, index) => (
                                    <li key={index}>{exp}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 作品頁籤 */}
                    {hasData('works') && (
                        <div className={`tab-panel ${activeTab === 'works' ? 'active' : ''}`}>
                            {/* 作品分類按鈕組 */}
                            <div className="work-category-filters">
                                <span className="work-category-label">作品類型:</span>
                                <button
                                    className={`category-pill ${activeWorkCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => handleCategoryClick('all')}
                                >
                                    ALL
                                </button>
                                {celebrityData.works.categories.map(category => (
                                    <button
                                        key={category}
                                        className={`category-pill ${activeWorkCategory === category ? 'active' : ''}`}
                                        onClick={() => handleCategoryClick(category)}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>

                            {/* 作品內容 */}
                            <div className="works-content">
                                {renderWorks()}
                            </div>
                        </div>
                    )}

                    {/* 網路資源頁籤 */}
                    {hasData('resources') && (
                        <div className={`tab-panel ${activeTab === 'resources' ? 'active' : ''}`}>
                            <div className="resource-cards-grid">
                                {celebrityData.resources.map((resource, index) => (
                                    <div
                                        className="resource-card"
                                        key={index}
                                        onClick={() => resource.url && window.open(resource.url, '_blank')}
                                        style={{ cursor: resource.url ? 'pointer' : 'default' }}
                                    >
                                        {resource.img && (
                                            <div className="resource-card-image-container">
                                                <img
                                                    src={resource.img}
                                                    alt={resource.title}
                                                    className="resource-card-image"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="resource-card-content">
                                            <h3 className="resource-card-title">{resource.title}</h3>
                                            {resource.description && (
                                                <p className="resource-card-subtitle">{resource.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 元宇宙頁籤 */}
                    {hasData('metaverse') && (
                        <div className={`tab-panel ${activeTab === 'metaverse' ? 'active' : ''}`}>
                            <ul>
                                {celebrityData.metaverse.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 得獎頁籤 */}
                    {hasData('awards') && (
                        <div className={`tab-panel ${activeTab === 'awards' ? 'active' : ''}`}>
                            <ul>
                                {celebrityData.awards.map((award, index) => (
                                    <li key={index}>{award}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CelebrityDetails;
