import React from 'react';
import './FestivalModal.css';
import megaphoneIcon from '../../assets/megaphone.svg';

const FestivalModal = ({ isOpen, onClose, festival }) => {
  if (!isOpen || !festival) return null;

  const playAudio = async () => {
    try {
      // 準備 API 參數
      const parameters = {
        tts_lang: 'tb',    // 使用漢羅
        tts_data: festival.pron // 要合成的文字
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
    <div className="festival-modal-overlay">
      <div className="festival-modal-container">
        <div className="festival-modal-content">
          <div className="festival-modal-close">
            <div className="festival-close-button" onClick={onClose}>&times;</div>
          </div>
          <div className="festival-modal-detail">
            <div className="festival-header-content">
              <h2 className="festival-modal-title">{festival.name}</h2>
              <div className="festival-pronunciation-container">
                <div className="festival-pronunciation-text">{festival.pron}</div>
                <div className="festival-play-button" onClick={playAudio}>
                  <img src={megaphoneIcon} alt="播放發音" />
                </div>
              </div>
            </div>
            <div className="festival-modal-body">
              <div className="festival-content-container">
                {festival.date && (
                  <div className="festival-date-container">
                    <span className="festival-date-label">日期</span>
                    <div className="festival-date-text">
                      {festival.date}
                    </div>
                  </div>
                )}
                <div className="festival-interpretation-container">
                  <span className="festival-interpretation-label">說明</span>
                  <div className="festival-interpretation-text">
                    {festival.intro || festival.intro_taigi || '暫無說明'}
                  </div>
                </div>
                {festival.intro_taigi && festival.intro && (
                  <div className="festival-taigi-container">
                    <span className="festival-taigi-label">台語說明</span>
                    <div className="festival-taigi-text">
                      {festival.intro_taigi}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalModal; 