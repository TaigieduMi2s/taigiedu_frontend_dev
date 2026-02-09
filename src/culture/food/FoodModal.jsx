import React from 'react';
import './FoodModal.css';
import megaphoneIcon from '../../assets/megaphone.svg';
import nofood from "../../assets/culture/foodN.png"; // 導入預設無圖片

const FoodModal = ({ isOpen, onClose, food }) => {
    if (!isOpen || !food) return null;
    const playAudio = async () => {
        try {
            // 準備 API 參數
            const parameters = {
                tts_lang: 'tb',    // 使用漢羅
                tts_data: food.pron // 要合成的文字
            };

            console.log('Sending TTS request:', parameters);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/synthesize_speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parameters)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const synthesized_audio_base64 = await response.text();
            console.log('Received audio data length:', synthesized_audio_base64.length);

            // 建立並播放音訊
            const audio = new Audio(`data:audio/wav;base64,${synthesized_audio_base64}`);
            await audio.play();

        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    return (
        <div className="food-modal-overlay">
            <div className="food-modal-container">
                <div className="food-modal-content">
                    <div className="food-modal-close">
                        <div className="food-close-button" onClick={onClose}>&times;</div>
                    </div>
                    <div className="food-modal-detail">
                        <div className="food-modal-header">
                            <div className="food-header-container">
                                <div className="food-image-container">
                                    <img
                                        src={food.image}
                                        alt={food.name}
                                        className="food-modal-image"
                                        onError={(e) => {
                                            e.target.src = nofood;
                                        }}
                                    />
                                </div>
                                <div className="food-header-content">
                                    <h2 className="food-modal-title">{food.name}</h2>
                                    <div className="food-pronunciation-container">
                                        <div className="food-pronunciation-text">{food.pron}</div>
                                        <div className="food-play-button" onClick={playAudio}>
                                            <img src={megaphoneIcon} alt="播放發音" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="food-modal-body">
                            <div className="food-row-container">
                                <div className="food-interpretation-container">
                                    <span className="food-interpretation-label">華文釋義</span>
                                    <div className="food-interpretation-text">
                                        {food.intro}
                                    </div>
                                </div>
                            </div>

                            {food.intro_taigi && food.intro_taigi.trim() !== "" && (
                                <div className="food-row-container mt-3">
                                    <div className="food-interpretation-container">
                                        <span className="food-interpretation-label">台語釋義</span>
                                        <div className="food-interpretation-text">
                                            {food.intro_taigi}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodModal; 