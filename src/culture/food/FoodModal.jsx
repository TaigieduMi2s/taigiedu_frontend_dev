import React from 'react';
import { UnifiedModal, InfoRow } from '../../components/UnifiedModal/UnifiedModal';
import megaPhoneIcon from '../../assets/megaphone.svg';
import nofood from "../../assets/culture/foodN.png"; 

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
            <div className="food-header-container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div className="food-image-container" style={{ flex: '0 0 200px' }}>
                    <img
                        src={food.image}
                        alt={food.name}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => { e.target.src = nofood; }}
                    />
                </div>
                <div className="food-header-content" style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)' }}>{food.name}</h2>
                    <div className="food-pronunciation-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{food.pron}</div>
                        <button 
                            onClick={playAudio} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                            <img src={megaPhoneIcon} alt="播放" style={{ width: '24px' }} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="food-modal-body" style={{ marginTop: '20px' }}>
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