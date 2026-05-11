import React from 'react';
import { UnifiedModal, InfoRow } from '../../components/UnifiedModal/UnifiedModal';
import megaPhoneIcon from '../../assets/megaphone.svg';
import nofood from "../../assets/culture/foodN.png";
import './FoodModal.css';

const FoodModal = ({ isOpen, onClose, food }) => {
    if (!isOpen || !food) return null;

    const playAudio = async () => {
        try {
            const parameters = {
                tts_lang: 'tb',
                tts_data: food.pron
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/synthesize_speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parameters)
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const audioBase64 = await response.text();
            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
            await audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    return (
        <UnifiedModal isOpen={isOpen} onClose={onClose} className="food-modal">
            <div className="food-header-container">
                <div className="food-image-container">
                    <img
                        className="food-modal-image"
                        src={food.image}
                        alt={food.name}
                        onError={(e) => { e.target.src = nofood; }}
                    />
                </div>
                <div className="food-header-content">
                    <h2 className="food-modal-title-text">{food.name}</h2>
                    <div className="food-pronunciation-container">
                        <div className="food-pron-text">{food.pron}</div>
                        <button
                            className="food-play-btn"
                            onClick={playAudio}
                        >
                            <img src={megaPhoneIcon} alt="播放" style={{ width: '24px' }} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="food-modal-body">
                <InfoRow label="華文釋義">
                    {food.intro}
                </InfoRow>

                {food.intro_taigi && food.intro_taigi.trim() !== "" && (
                    <InfoRow label="台語釋義">
                        {food.intro_taigi}
                    </InfoRow>
                )}
            </div>
        </UnifiedModal>
    );
};

export default FoodModal; 