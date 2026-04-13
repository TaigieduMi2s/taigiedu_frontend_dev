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
          &times;
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
