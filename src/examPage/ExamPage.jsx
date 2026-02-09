import React, { useState, useRef, useEffect } from 'react';
import './ExamPage.css';
import searchIcon from '../assets/home/search_logo.svg';
// import questionMarkIcon from '../assets/question-mark.svg';
import foodImage from '../assets/culture/foodN.png';
import chevronUpIcon from '../assets/chevron-up.svg';

const ExamPage = () => {
    const [selectedType, setSelectedType] = useState("類型");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [examData, setExamData] = useState({});
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 動態創建 refs
    const sectionRefs = useRef({});

    // 組件掛載時獲取考試資料
    useEffect(() => {
        fetchExamData();
    }, []);

    // 處理下拉選單外部點擊
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.exam-custom-dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

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

                // 動態創建 refs
                categoryList.forEach(category => {
                    if (!sectionRefs.current[category]) {
                        sectionRefs.current[category] = React.createRef();
                    }
                });
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
        setSelectedType(selectedValue);
        setIsDropdownOpen(false); // 選擇後關閉下拉選單

        // 滾動到對應的標題
        if (selectedValue !== "類型" && sectionRefs.current[selectedValue]?.current) {
            sectionRefs.current[selectedValue].current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim() === "") return;

        // 搜尋邏輯會在 getFilteredData 中處理
    };

    // 獲取篩選後的資料
    const getFilteredData = () => {
        // 只根據搜尋關鍵字篩選，下拉選單不影響顯示內容
        if (query.trim() === "") {
            // 如果沒有搜尋關鍵字，顯示所有資料
            return examData;
        }

        // 根據搜尋關鍵字篩選
        const searchFilteredData = {};
        const searchTerm = query.toLowerCase().trim();

        Object.keys(examData).forEach(category => {
            const filteredItems = examData[category].filter(item => {
                // 搜尋項目的 title, subcategory 等欄位
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

    // 載入狀態
    if (isLoading) {
        return (
            <div className="exam-page">
                <div className="exam-header">
                    <div className="container px-4">
                        <div className="text-center">
                            <p>載入考試資料中...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 錯誤狀態
    if (error) {
        return (
            <div className="exam-page">
                <div className="exam-header">
                    <div className="container px-4">
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

    return (
        <div className="exam-page">
            <div className="exam-header">
                <div className="container px-4">
                    <div className="exam-header-content">
                        <div className="exam-custom-dropdown">
                            <div className="dropdown-container">
                                <div
                                    className="dropdown-header exam-type-dropdown"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {selectedType}
                                </div>
                                <img
                                    src={chevronUpIcon}
                                    alt="dropdown arrow"
                                    className="dropdown-arrow"
                                />
                            </div>
                            {isDropdownOpen && (
                                <div className="exam-dropdown-menu">
                                    <div
                                        className={`exam-dropdown-item ${selectedType === "類型" ? 'selected' : ''}`}
                                        onClick={() => handleTypeChange("類型")}
                                    >
                                        類型
                                    </div>
                                    {categories.map(category => (
                                        <div
                                            key={category}
                                            className={`exam-dropdown-item ${selectedType === category ? 'selected' : ''}`}
                                            onClick={() => handleTypeChange(category)}
                                        >
                                            {category}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>                        <form onSubmit={handleSearch} className="exam-search-container">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
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
            {Object.entries(filteredData).map(([category, items]) => (
                <div key={category} className="exam-section">
                    <div className="container px-4">
                        <h2
                            className="exam-category-title"
                            ref={ref => {
                                if (ref && !sectionRefs.current[category]) {
                                    sectionRefs.current[category] = { current: ref };
                                } else if (ref && sectionRefs.current[category]) {
                                    sectionRefs.current[category].current = ref;
                                }
                            }}
                        >
                            {category}
                        </h2>
                        <div className="row g-4">
                            {items.map(item => (
                                <div key={item.id}
                                    className="col-12 col-sm-6 col-md-4 col-lg-3"
                                    onClick={() => handleCardClick(item.url)}>
                                    <div className="exam-card">
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
                                        <h5 className="text-center mt-2">
                                            {item.subcategory && (
                                                <span className="text-muted small">
                                                    [{item.subcategory}]
                                                </span>
                                            )}
                                            {item.title}
                                        </h5>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
            {/* <div className="text-start mt-4 exam-report-issue">
                <img src={questionMarkIcon} className="question-icon" />
                如有任何問題，請點此回報問題
            </div> */}
        </div>
    );
};

export default ExamPage;