import React from 'react';
import { UnifiedModal } from './UnifiedModal';
import './EventModal.css';

/**
 * 今日大事詳細資訊彈窗
 * 繼承自 UnifiedModal 並進行客製化
 */
export const EventModal = ({ isOpen, onClose, event, icon }) => {
  if (!event) return null;

  // 處理內容分段
  const paragraphs = event.content 
    ? event.content.split('\n').filter(p => p.trim() !== '') 
    : [];

  return (
    <UnifiedModal isOpen={isOpen} onClose={onClose} className="event-detail-modal">
      <div className="event-detail-container">
        {/* Header Section */}
        <div className="event-detail-header">
          <div className="event-icon-wrapper">
            <img src={icon} alt="今日大事" className="event-detail-icon" />
          </div>
          <div className="event-title-wrapper">
            <div className="event-detail-date">{event.date}</div>
            <h2 className="event-detail-title">{event.title}</h2>
          </div>
        </div>

        {/* Content Section */}
        <div className="event-detail-body">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, index) => (
              <p key={index} className="event-detail-paragraph">{p}</p>
            ))
          ) : (
            <p className="event-detail-paragraph">暫無詳細內容</p>
          )}
        </div>

        {/* Footer Section */}
        <div className="event-detail-footer">
          <div className="event-detail-quote-bar">
            <div className="footer-info">
              資料來源：{event.source || '台灣獨曆授權使用'}
            </div>
            <div className="footer-info">
              官方粉專：<a 
                href={event.sourceUrl || "https://www.facebook.com/indepcalendar/"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="source-link"
              >
                {event.sourceUrl || "https://www.facebook.com/indepcalendar/"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
};
