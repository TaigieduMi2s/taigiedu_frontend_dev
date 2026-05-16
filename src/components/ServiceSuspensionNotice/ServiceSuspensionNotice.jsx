import React, { useEffect, useMemo, useState } from 'react';
import './ServiceSuspensionNotice.css';
import blackboardBg from '../../assets/blackboard.png';
import bearGif from '../../assets/bear1.gif';
import { subscribeOutage } from '../../services/outageService';

const LS_KEY = 'ssn_dismissed_v2';
const DAY_MS = 24 * 60 * 60 * 1000;
const PREVIEW_LEAD_MS = 7 * DAY_MS;
const FINAL_REMINDER_MS = 1 * DAY_MS;

const KILL_SWITCH_ON = import.meta.env.VITE_ENABLE_SERVICE_SUSPENSION_NOTICE !== 'false';

function readDismissState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDismissState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

// 決定要不要顯示，以及目前是否屬於「最後一天提醒」階段。
function evaluate(outage, dismissState, now = new Date()) {
  if (!outage || !outage.active) return { show: false };
  const { startAt, endAt } = outage;
  if (!startAt || !endAt) return { show: false };

  const t = now.getTime();
  const start = startAt.getTime();
  const end = endAt.getTime();

  if (t > end) return { show: false };
  if (t < start - PREVIEW_LEAD_MS) return { show: false };

  // 維護期間：強制顯示且不可關閉（此時主後端已停擺，僅靠 Firebase 提示）。
  if (t >= start && t <= end) {
    return { show: true, blocking: true, finalReminder: false };
  }

  const sameAnnouncement =
    dismissState && dismissState.startAt === startAt.toISOString();
  const dismissed = !!(sameAnnouncement && dismissState.dismissed);
  const finalReminderShown =
    !!(sameAnnouncement && dismissState.finalReminderShown);

  // 開始前 24 小時內的「最後提醒」階段。
  const finalReminderWindow = t >= start - FINAL_REMINDER_MS && t < start;

  if (finalReminderWindow) {
    if (finalReminderShown) return { show: false };
    return { show: true, blocking: false, finalReminder: true };
  }

  // 開始前 7 天 ~ 24 小時的預告階段。
  if (!dismissed) {
    return { show: true, blocking: false, finalReminder: false };
  }

  return { show: false };
}

function formatPeriod(startAt, endAt) {
  if (!startAt || !endAt) return '';
  const fullFmt = new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeFmt = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const sameDay =
    startAt.getFullYear() === endAt.getFullYear() &&
    startAt.getMonth() === endAt.getMonth() &&
    startAt.getDate() === endAt.getDate();
  const endStr = sameDay ? timeFmt.format(endAt) : fullFmt.format(endAt);
  return `${fullFmt.format(startAt)} - ${endStr}`;
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2 2L18 18M18 2L2 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ModalCard = ({ onClose, isBlocking, title, content, period }) => (
  <div
    className={`ssn-card ${isBlocking ? 'ssn-card--blocking' : ''}`}
    style={{
      backgroundImage: `url(${blackboardBg})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }}
  >
    <div className="ssn-header">
      <h2 className="ssn-title">{title}</h2>
      {!isBlocking && (
        <button className="ssn-close-btn" onClick={onClose} aria-label="關閉">
          <CloseIcon />
        </button>
      )}
    </div>

    <div className="ssn-body">
      <div className="ssn-text-section">
        <div className="ssn-period-block">
          <span className="ssn-period-label">預計暫停時間</span>
          <span className="ssn-period-value">{period}</span>
        </div>
        <p className="ssn-description">{content}</p>
        <p className="ssn-signature">「Tshuì 水」團隊</p>
      </div>

      <div className="ssn-icon-section">
        <img src={bearGif} className="ssn-bear-icon" alt="bear" />
      </div>
    </div>
  </div>
);

const ServiceSuspensionNotice = () => {
  const [outage, setOutage] = useState(null);
  const [dismissState, setDismissState] = useState(() => readDismissState());

  useEffect(() => {
    if (!KILL_SWITCH_ON) return undefined;
    return subscribeOutage(setOutage);
  }, []);

  const decision = useMemo(
    () => evaluate(outage, dismissState),
    [outage, dismissState]
  );

  if (!KILL_SWITCH_ON) return null;
  if (!decision.show) return null;

  const handleClose = () => {
    const startIso = outage?.startAt?.toISOString();
    if (!startIso) return;
    const next = {
      startAt: startIso,
      dismissed: true,
      finalReminderShown:
        decision.finalReminder || dismissState?.finalReminderShown === true,
    };
    writeDismissState(next);
    setDismissState(next);
  };

  const period = formatPeriod(outage.startAt, outage.endAt);

  return (
    <div
      className={`ssn-overlay ${decision.blocking ? 'ssn-overlay--blocking' : ''}`}
      onClick={!decision.blocking ? handleClose : undefined}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <ModalCard
          onClose={handleClose}
          isBlocking={decision.blocking}
          title={outage.title || '網站暫停服務公告'}
          content={
            outage.content ||
            '由於伺服器系統維護，以上期間網站將暫停服務。造成不便，敬請見諒。'
          }
          period={period}
        />
      </div>
    </div>
  );
};

export default ServiceSuspensionNotice;
