import React, { useEffect, useState } from 'react';
import './ServiceSuspensionNotice.css';
import blackboardBg from '../../assets/blackboard.png';
import bearGif from '../../assets/bear1.gif';

// ── 停電停服時間設定 ──────────────────────────────────────────
// 使用者要求修改為 5月10日(星期日)上午8時至下午17時。
const OUTAGE_START = new Date('2026-05-10T08:00:00'); 
const OUTAGE_END   = new Date('2026-05-10T17:00:00'); 

// 此開關用於控制是否啟用公告功能。
const IS_NOTICE_ACTIVE = true; 

const LS_KEY = 'ssn_dismissed_v1';

function getNoticeMode() {
  // ── 演練模式：強制開啟 blocking 狀態 ──────────────────────────
  return 'blocking'; 
}

// 警告三角圖示 (SVG inline)
const WarningIcon = () => (
  <svg
    className="ssn-warning-icon"
    viewBox="0 0 120 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M60 8L112 98H8L60 8Z"
      fill="#FF8C00"
      stroke="#E07000"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <rect x="55" y="42" width="10" height="30" rx="5" fill="white" />
    <circle cx="60" cy="82" r="6" fill="white" />
  </svg>
);

// 關閉按鈕圖示
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2 2L18 18M18 2L2 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ModalCard = ({ onClose, isBlocking }) => (
  <div 
    className={`ssn-card ${isBlocking ? 'ssn-card--blocking' : ''}`}
    style={{ 
      backgroundImage: `url(${blackboardBg})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center'
    }}
  >
    {/* 標題區 */}
    <div className="ssn-header">
      <h2 className="ssn-title">網站暫停服務公告</h2>
      {!isBlocking && (
        <button className="ssn-close-btn" onClick={onClose} aria-label="關閉">
          <CloseIcon />
        </button>
      )}
    </div>

    {/* 內容區（漸層背景） */}
    <div className="ssn-body">
      {/* 左側：日期與說明 */}
      <div className="ssn-text-section">
        <div className="ssn-period-block">
          <span className="ssn-period-label">預計暫停時間</span>
          <span className="ssn-period-value">5月10日 (日) 08:00 - 17:00</span>
        </div>
        <p className="ssn-description">
          由於伺服器系統維護，以上期間網站將暫停服務。造成不便，敬請見諒。
        </p>
        <p className="ssn-signature">「Tshuì 水」團隊</p>
      </div>

      {/* 右側：黑熊圖示 */}
      <div className="ssn-icon-section">
        <img src={bearGif} className="ssn-bear-icon" alt="bear" />
      </div>
    </div>
  </div>
);

const ServiceSuspensionNotice = () => {
  const mode = getNoticeMode();
  const [dismissed, setDismissed] = useState(false);

  // 初始化時檢查 Local Storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(LS_KEY) === 'true';
      setDismissed(isDismissed);
    }
  }, []);

  const handleClose = () => {
    setDismissed(true);
    localStorage.setItem(LS_KEY, 'true');
  };

  if (mode === 'none') return null;
  
  // 如果是 blocking 模式，忽略 dismissed 狀態（強行顯示）
  const isBlocking = mode === 'blocking';
  if (mode === 'preview' && dismissed) return null;

  return (
    <div
      className={`ssn-overlay ${isBlocking ? 'ssn-overlay--blocking' : ''}`}
      onClick={!isBlocking ? handleClose : undefined}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <ModalCard
          onClose={handleClose}
          isBlocking={isBlocking}
        />
      </div>
    </div>
  );
};

export default ServiceSuspensionNotice;
