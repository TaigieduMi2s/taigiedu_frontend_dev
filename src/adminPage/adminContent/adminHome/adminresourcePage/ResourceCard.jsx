import './ResourceCard.css';

export default function ResourceCard({ title = '標題', category = '類別', owner = '建立者', createdAt = '-' }) {
  return (
    <div className="admin-resource-card">
      <div className="card-title">{title}</div>
      <div className="card-meta">
        <span>{category}</span>
        <span>·</span>
        <span>{owner}</span>
        <span>·</span>
        <span>{createdAt}</span>
      </div>
      <div className="card-actions">
        <button className="admin-btn small">編輯</button>
        <button className="admin-btn small">刪除</button>
      </div>
    </div>
  );
}
