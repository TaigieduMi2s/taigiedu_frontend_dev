import React from 'react';
import './ServiceSuspensionNotice.css';

// ── 停電停服時間設定 ──────────────────────────────────────────
const OUTAGE_START = new Date('2026-04-20T09:00:00');
const OUTAGE_END   = new Date('2026-04-30T09:00:00');

function getNoticeMode() {
  const now = new Date();
  if (now >= OUTAGE_START && now < OUTAGE_END) return 'blocking';
  if (now < OUTAGE_START) return 'preview';
  return 'none';
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
  <div className={`ssn-card ${isBlocking ? 'ssn-card--blocking' : ''}`}>
    {/* 標題區（白色背景） */}
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
          <span className="ssn-period-value">2026/04/20 AM9:00至</span>
          <span className="ssn-period-value">2026/04/30 AM9:00</span>
        </div>
        <p className="ssn-description">
          由於伺服器所在區域停電，以上期間，網站暫停服務。造成不便，敬請見諒。
        </p>
        <p className="ssn-signature">「Tshuì 水」團隊</p>
      </div>

      {/* 右側：警告圖示 */}
      <div className="ssn-icon-section">
        <WarningIcon />
      </div>
    </div>
  </div>
);

const ServiceSuspensionNotice = () => {
  const mode = getNoticeMode();
  const [dismissed, setDismissed] = React.useState(false);

  if (mode === 'none') return null;
  if (mode === 'preview' && dismissed) return null;

  const isBlocking = mode === 'blocking';

  return (
    <div
      className={`ssn-overlay ${isBlocking ? 'ssn-overlay--blocking' : ''}`}
      onClick={!isBlocking ? () => setDismissed(true) : undefined}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <ModalCard
          onClose={() => setDismissed(true)}
          isBlocking={isBlocking}
        />
      </div>
    </div>
  );
};

export default ServiceSuspensionNotice;
