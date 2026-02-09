import React, { useState, useEffect } from 'react';
import './CelebrityPage.css';
import CelebrityModal from './CelebrityModal';
import { useToast } from '../components/Toast';
import nopic from "../assets/celebrity/nopic.png"; // 預設無圖片

const CelebrityPage = () => {
    const { showError } = useToast();
    const [selectedCelebrity, setSelectedCelebrity] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [celebrities, setCelebrities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 組件載入時獲取名人列表
    useEffect(() => {
        fetchCelebrityList();
    }, []);

    // 從 API 獲取名人列表
    const fetchCelebrityList = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/celebrity/list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("作家清單：", data);

            if (Array.isArray(data) && data.length > 0) {
                // 將 API 數據轉換為前端需要的格式
                const formattedCelebrities = data.map((celebrity, index) => ({
                    id: index + 1,
                    name: celebrity.name,
                    image: celebrity.photo ? `${import.meta.env.VITE_IMAGE_URL}${celebrity.photo}` : { nopic },
                    illustration: celebrity.illustration ? `${import.meta.env.VITE_IMAGE_URL}${celebrity.illustration}` : null
                }));
                setCelebrities(formattedCelebrities);
            } else if (Array.isArray(data) && data.length === 0) {
                setCelebrities([]);
            } else {
                throw new Error("API 回傳格式不正確");
            }
        } catch (error) {
            console.error("取得清單失敗", error);
            setError(error.message);
            showError("載入名人列表失敗，請稍後再試");
            // 設置空陣列以避免頁面崩潰
            setCelebrities([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = (celebrity) => {
        // 只傳送名字到詳細頁面
        const detailUrl = new URL('/celebrity/detail', window.location.origin);
        detailUrl.searchParams.append('name', celebrity.name);

        // 直接使用 window.open
        window.open(detailUrl.toString(), '_blank', 'noopener,noreferrer');

        console.log("Opening URL:", detailUrl.toString());
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCelebrity(null);
    };

    return (
        <div className="container py-4">
            {isLoading ? (
                <div className="celebrity-loading">
                    <div className="loading-spinner"></div>
                    <p>載入名人列表中...</p>
                </div>
            ) : error ? (
                <div className="celebrity-loading">
                    <p>載入失敗，請重新整理頁面</p>
                    <button onClick={fetchCelebrityList} className="btn btn-primary mt-2">
                        重新載入
                    </button>
                </div>
            ) : celebrities.length === 0 ? (
                <div className="celebrity-loading">
                    <p>目前沒有名人資料</p>
                </div>
            ) : (
                <div className="row g-4 pt-4">
                    {celebrities.map(celebrity => (
                        <div key={celebrity.id}
                            className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-custom-5"
                            onClick={() => handleCardClick(celebrity)}>
                            <div className="celebrity-card">
                                <div className="image-container">
                                    <img
                                        src={celebrity.image}
                                        alt={celebrity.name}
                                        className="celebrity-image"
                                        onError={(e) => {
                                            e.target.src = nopic;
                                        }}
                                    />
                                </div>
                                <h5 className="text-center mt-2">{celebrity.name}</h5>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* <div className="text-start mt-4 exam-report-issue">
                <img src={questionMarkIcon} className="question-icon" />
                如有任何問題，請點此回報問題
            </div> */}
        </div>
    );
};

export default CelebrityPage;
