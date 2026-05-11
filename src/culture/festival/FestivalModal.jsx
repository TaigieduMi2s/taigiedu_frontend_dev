import React from 'react';
import { UnifiedModal, InfoRow } from '../../components/UnifiedModal/UnifiedModal';
import megaPhoneIcon from '../../assets/megaphone.svg';
import './FestivalModal.css';

const FestivalModal = ({ isOpen, onClose, festival }) => {
    if (!isOpen || !festival) return null;

    const playAudio = async () => {
        try {
            const parameters = {
                tts_lang: 'tb',
                tts_data: festival.name
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
        <UnifiedModal isOpen={isOpen} onClose={onClose} className="festival-modal">
            <div className="festival-header">
                <h2 className="festival-modal-name">{festival.name}</h2>
                <div className="festival-pronunciation-container">
                    <div className="festival-pron-text">{festival.pron}</div>
                    <button
                        className="festival-play-btn"
                        onClick={playAudio}
                    >
                        <img src={megaPhoneIcon} alt="播放" style={{ width: '24px' }} />
                    </button>
                </div>
            </div>

            <div className="festival-modal-body">
                <InfoRow label="活動日期">
                    {festival.date}
                </InfoRow>

                <InfoRow label="內容釋義">
                    {festival.content}
                </InfoRow>

                {festival.taigi_intro && (
                    <InfoRow label="台語釋義">
                        {festival.taigi_intro}
                    </InfoRow>
                )}

                {festival.author && (
                    <div style={{ textAlign: 'right', marginTop: '20px', color: '#666', fontSize: '14px' }}>
                        資料來源：{festival.author}
                    </div>
                )}
            </div>
        </UnifiedModal>
    );
};

export default FestivalModal;