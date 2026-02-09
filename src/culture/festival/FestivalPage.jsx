import React, { useState, useEffect } from 'react';
import './FestivalPage.css';
import FestivalModal from './FestivalModal';
import festivalN from "../../assets/culture/festivalN.png"; // 預設無圖片
import { useToast } from '../../components/Toast'; // 引入 Toast 通知
import questionMark from "../../assets/question-mark.svg"; // 修正問題圖標引用方式

const FestivalPage = () => {
    const { showError } = useToast();
    const [selectedFestival, setSelectedFestival] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [festivals, setFestivals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 組件載入時獲取節慶列表
    useEffect(() => {
        // 從 API 獲取節慶列表
        const fetchFestivalList = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/culture/festival`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("節慶清單：", data);

                if (Array.isArray(data) && data.length > 0) {
                    // 將 API 數據轉換為前端需要的格式，使用索引作為唯一標識
                    const formattedFestivals = data.map((festival, index) => ({
                        key: index, // 使用索引作為唯一標識，代替 id
                        name: festival.name || '',
                        image: festival.image ? `${import.meta.env.VITE_IMAGE_URL}${festival.image}` : festivalN,
                        pron: festival.pron || '',
                        date: festival.date_mandarin || '',
                        intro: festival.intro_mandarin || '',
                        intro_taigi: festival.intro_taigi || ''
                    }));
                    setFestivals(formattedFestivals);
                } else if (Array.isArray(data) && data.length === 0) {
                    setFestivals([]);
                } else {
                    throw new Error("API 回傳格式不正確");
                }
            } catch (error) {
                console.error("取得清單失敗", error);
                setError(error.message);
                showError("載入節慶列表失敗，請稍後再試");
                // 設置空陣列以避免頁面崩潰
                setFestivals([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFestivalList();
    }, [showError]);

    // 重新載入函數供按鈕使用
    const handleReload = () => {
        setIsLoading(true);
        setError(null);

        const fetchData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/culture/festival`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("節慶清單：", data);

                if (Array.isArray(data) && data.length > 0) {
                    const formattedFestivals = data.map((festival, index) => ({
                        key: index,
                        name: festival.name || '',
                        image: festival.image ? `${import.meta.env.VITE_IMAGE_URL}${festival.image}` : festivalN,
                        pron: festival.pron || '',
                        date: festival.date_mandarin || '',
                        intro: festival.intro_mandarin || '',
                        intro_taigi: festival.intro_taigi || ''
                    }));
                    setFestivals(formattedFestivals);
                } else if (Array.isArray(data) && data.length === 0) {
                    setFestivals([]);
                } else {
                    throw new Error("API 回傳格式不正確");
                }
            } catch (error) {
                console.error("取得清單失敗", error);
                setError(error.message);
                showError("載入節慶列表失敗，請稍後再試");
                setFestivals([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    };
    const handleCardClick = (festival) => {
        setSelectedFestival(festival);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedFestival(null);
    };

    return (
        <div className="container py-4">
            {isLoading ? (
                <div className="festival-loading">
                    <div className="loading-spinner"></div>
                    <p>載入節慶列表中...</p>
                </div>
            ) : error ? (
                <div className="festival-loading">
                    <p>載入失敗，請重新整理頁面</p>
                    <button onClick={handleReload} className="btn btn-primary mt-2">
                        重新載入
                    </button>
                </div>
            ) : festivals.length === 0 ? (
                <div className="festival-loading">
                    <p>目前沒有節慶資料</p>
                </div>
            ) : (
                <div className="row g-4 pt-4">
                    {festivals.map(festival => (
                        <div key={festival.key}
                            className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-custom-5"
                            onClick={() => handleCardClick(festival)}>
                            <div className="festival-card">
                                <div className="image-container">
                                    <img
                                        src={festival.image}
                                        alt={festival.name}
                                        className="festival-image"
                                        onError={(e) => {
                                            e.target.src = festivalN;
                                        }}
                                    />
                                </div>
                                <h5 className="text-center mt-2">{festival.name}</h5>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* <div className="text-start mt-4 exam-report-issue">
                <img src={questionMarkIcon} className="question-icon" />
                如有任何問題，請點此回報問題
            </div> */}
            <FestivalModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                festival={selectedFestival}
            />
        </div>
    );
};

export default FestivalPage;