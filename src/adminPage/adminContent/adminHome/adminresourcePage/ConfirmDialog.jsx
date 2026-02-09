import './ConfirmDialog.css';

export default function ConfirmDialog({ open = false, title = '確認刪除', message = '此操作無法復原', onConfirm = () => {}, onCancel = () => {} }) {
  if (!open) return null;
  return (
    <div className="confirm-backdrop">
      <div className="confirm-dialog">
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="admin-btn">取消</button>
          <button className="admin-btn primary" onClick={onConfirm}>確認</button>
        </div>
      </div>
    </div>
  );
}
