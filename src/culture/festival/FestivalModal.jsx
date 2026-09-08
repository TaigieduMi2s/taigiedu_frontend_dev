import React from 'react';
import { UnifiedModal, InfoRow } from '../../components/UnifiedModal/UnifiedModal';
import megaPhoneIcon from '../../assets/megaphone.svg';
import nofestival from "../../assets/culture/festivalN.png";
import { resolveFileUrl } from '../../services/uploadService';
import './FestivalModal.css';

const getFullAudioUrl = (path, type) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    
    const cleanPath = path.trim().replace(/\s/g, '');
    if (cleanPath.length > 100 && /^[A-Za-z0-9+/=]+$/.test(cleanPath)) {
        let mimeType = 'webm';
        if (cleanPath.startsWith('GkXf')) {
            mimeType = 'webm';
        } else if (cleanPath.startsWith('UklG')) {
            mimeType = 'wav';
        } else if (cleanPath.startsWith('SUQz') || cleanPath.startsWith('//O') || cleanPath.startsWith('//M')) {
            mimeType = 'mpeg';
        }
        return `data:audio/${mimeType};base64,${cleanPath}`;
    }
    
    if (path.includes('/')) {
        return resolveFileUrl(path);
    }
    
    const filename = path.split('/').filter(Boolean).pop();
    const apiUrl = import.meta.env.VITE_API_URL || '/backend';
    return `${apiUrl}/static/${type}/${filename}`;
};

/**
 * 節慶日期顯示字串 (TAIGIE-256)
 *
 * 後端 /culture/festival 回傳三個相關欄位：
 * - date          ：'MM-DD'，也可能是逗號分隔的多個日期（例：冬至 '12-21,12-22,12-23'）
 * - islunar       ：1 = 農曆、0 = 國曆
 * - date_mandarin ：後端組好的字串（例：'農曆 01-01'）
 *
 * 優先用 date + islunar 自己組成「農曆1月1日」這種讀得順的格式，
 * 沒有 islunar 或組不出來時才退回後端的 date_mandarin。
 * 未設定日期的節慶（母親節、迎媽祖、搶孤等非固定日期，見 TAIGIE-257）回傳空字串，
 * 畫面上就不顯示日期這一列。
 */
const formatFestivalDate = ({ date, islunar, dateMandarin } = {}) => {
    const hasLunarFlag = islunar !== undefined && islunar !== null && islunar !== '';
    if (!hasLunarFlag) return (dateMandarin || '').trim();

    const isSolar = String(islunar) === '0' || String(islunar) === 'false';
    const prefix = isSolar ? '國曆' : '農曆';

    const parts = String(date || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [month, day] = part.split('-').map(Number);
            return month && day ? `${month}月${day}日` : '';
        })
        .filter(Boolean);

    if (parts.length > 0) return `${prefix}${parts.join('、')}`;
    return (dateMandarin || '').trim();
};

const FestivalModal = ({ isOpen, onClose, festival }) => {
    if (!isOpen || !festival) return null;

    const playAudio = async () => {
        try {
            if (festival.audio_data) {
                const url = getFullAudioUrl(festival.audio_data, 'festival');
                if (url) {
                    const audio = new Audio(url);
                    await audio.play();
                    return;
                }
            }

            const parameters = {
                tts_lang: 'tb',
                tts_data: festival.pron || festival.name
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
            <div className="festival-header-container">
                <div className="festival-image-container">
                    <img
                        className="festival-modal-image"
                        src={festival.image}
                        alt={festival.name}
                        onError={(e) => { e.target.src = nofestival; }}
                    />
                </div>
                <div className="festival-header-content">
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
            </div>

            <div className="festival-modal-body">
                {/* 有設定日期才顯示（非固定日期的節慶可以不填，見 TAIGIE-257） */}
                <InfoRow label="日期">
                    {formatFestivalDate(festival)}
                </InfoRow>

                <InfoRow label="華文釋義">
                    {festival.intro}
                </InfoRow>

                {festival.intro_taigi && festival.intro_taigi.trim() !== "" && (
                    <InfoRow label="台語釋義">
                        {festival.intro_taigi}
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