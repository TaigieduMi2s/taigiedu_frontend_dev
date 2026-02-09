import React, { useState, useEffect } from 'react';
import './FoodPage.css';
import FoodModal from './FoodModal';
import nofood from "../../assets/culture/foodN.png"; // 預設無圖片
import { useToast } from '../../components/Toast'; // 引入 Toast 通知
import questionMark from "../../assets/question-mark.svg"; // 修正問題圖標引用方式

const FoodPage = () => {
    const { showError } = useToast();
    const [selectedFood, setSelectedFood] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [foods, setFoods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 組件載入時獲取食物列表
    useEffect(() => {
        fetchFoodList();
    }, []);

    // 從 API 獲取食物列表
    const fetchFoodList = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/culture/food`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("食物清單：", data);

            if (Array.isArray(data) && data.length > 0) {
                // 將 API 數據轉換為前端需要的格式，使用索引作為唯一標識
                const formattedFoods = data.map((food, index) => ({
                    key: index, // 使用索引作為唯一標識，代替 id
                    name: food.name || '',
                    image: food.image ? `${import.meta.env.VITE_IMAGE_URL}${food.image}` : nofood,
                    pron: food.pron || '',
                    intro: food.intro_mandarin || '',
                    intro_taigi: food.intro_taigi || ''
                }));
                setFoods(formattedFoods);
            } else if (Array.isArray(data) && data.length === 0) {
                setFoods([]);
            } else {
                throw new Error("API 回傳格式不正確");
            }
        } catch (error) {
            console.error("取得清單失敗", error);
            setError(error.message);
            showError("載入食物列表失敗，請稍後再試");
            // 設置空陣列以避免頁面崩潰
            setFoods([]);
        } finally {
            setIsLoading(false);
        }
    };
    const handleCardClick = (food) => {
        setSelectedFood(food);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedFood(null);
    };

    return (
        <div className="container py-4">
            {isLoading ? (
                <div className="food-loading">
                    <div className="loading-spinner"></div>
                    <p>載入食物列表中...</p>
                </div>
            ) : error ? (
                <div className="food-loading">
                    <p>載入失敗，請重新整理頁面</p>
                    <button onClick={fetchFoodList} className="btn btn-primary mt-2">
                        重新載入
                    </button>
                </div>
            ) : foods.length === 0 ? (
                <div className="food-loading">
                    <p>目前沒有食物資料</p>
                </div>
            ) : (
                <div className="row g-4 pt-4">
                    {foods.map(food => (
                        <div key={food.key}
                            className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-custom-5"
                            onClick={() => handleCardClick(food)}>
                            <div className="food-card">
                                <div className="image-container">
                                    <img
                                        src={food.image}
                                        alt={food.name}
                                        className="food-image"
                                        onError={(e) => {
                                            e.target.src = nofood;
                                        }}
                                    />
                                </div>
                                <h5 className="text-center mt-2">{food.name}</h5>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* <div className="text-start mt-4 exam-report-issue">
                <img src={questionMarkIcon} className="question-icon" />
                如有任何問題，請點此回報問題
            </div> */}
            <FoodModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                food={selectedFood}
            />
        </div>
    );
};

export default FoodPage;