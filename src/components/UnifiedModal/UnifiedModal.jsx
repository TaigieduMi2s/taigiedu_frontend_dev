import React from 'react';
import './UnifiedModal.css';

/**
 * 統一彈窗容器 (Unified Modal Container)
 */
export const UnifiedModal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;

  // 點擊遮罩關閉
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="unified-modal-overlay active" onClick={handleOverlayClick}>
      <div className={`unified-modal-container ${className}`}>
        <button
          className="unified-modal-close"
          onClick={onClose}
          aria-label="關閉"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="unified-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * 統一資訊列 (Unified Info Row)
 * 用於顯示「標題：內容」的組合
 */
export const InfoRow = ({ label, children, className = '' }) => {
  if (!children) return null;
  
  return (
    <div className={`unified-info-row ${className}`}>
      <span className="unified-info-label">{label}</span>
      <div className="unified-info-text">
        {children}
      </div>
    </div>
  );
};
