import { useState } from 'react';
import './FilePreview.css';

// 管理軌跡模擬資料（只保留第一筆 demo）
const mockManagementHistory = [
  {
    id: 1,
    type: "report",
    user: "Wynnie Chang",
    date: "2025/04/01",
    reason: "這篇文章是偷我的東西，侵犯我的著作權，請管理員處理"
  }
];

// 取得管理軌跡類型的標籤樣式和文字
const getHistoryTypeInfo = (type) => {
  switch (type) {
    case "report":
      return { label: "檢舉", className: "history-badge-report" };
    case "takedown":
      return { label: "下架", className: "history-badge-takedown" };
    case "restore":
      return { label: "取消下架", className: "history-badge-restore" };
    default:
      return { label: "未知", className: "history-badge-default" };
  }
};

export default function FilePreview({
  name = '檔案名稱',
  size = '-',
  type = '-',
  showTimeline = false,
  managementHistory = mockManagementHistory,
  onTakedown,
  onRestore,
  isTakenDown = false
}) {
  const [history, setHistory] = useState(managementHistory);

  // 判斷目前資源狀態（是否已下架）
  const isCurrentlyTakenDown = () => {
    if (history.length === 0) return isTakenDown;
    const lastAction = history[history.length - 1];
    return lastAction.type === "takedown";
  };

  return (
    <div className="admin-file-preview">
      {/* 管理員檢視提示 */}
      {showTimeline && (
        <div className="admin-view-banner">
          <span className="admin-view-dot"></span>
          您現在使用管理員權限檢視角度
        </div>
      )}

      {/* 管理軌跡時間軸 */}
      {showTimeline && history.length > 0 && (
        <div className="management-timeline">
          {history.map((entry) => {
            const typeInfo = getHistoryTypeInfo(entry.type);
            return (
              <div key={entry.id} className="timeline-entry">
                <span className={`history-badge ${typeInfo.className}`}>
                  {typeInfo.label}
                </span>
                <span className="timeline-user">{entry.user}</span>
                <span className="timeline-date">{entry.date}</span>
                <span className="timeline-reason">{entry.reason}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 檔案資訊 */}
      <div className="file-preview">
        <div className="file-info">
          <div className="file-name">{name}</div>
          <div className="file-meta">{type} · {size}</div>
        </div>
        <div className="file-actions">
          <button className="admin-btn small">下載</button>
          <button className="admin-btn small">預覽</button>
          {showTimeline && (
            <button
              className={`admin-btn small ${isCurrentlyTakenDown() ? 'restore' : 'takedown'}`}
              onClick={isCurrentlyTakenDown() ? onRestore : onTakedown}
            >
              {isCurrentlyTakenDown() ? '取消下架' : '下架'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
