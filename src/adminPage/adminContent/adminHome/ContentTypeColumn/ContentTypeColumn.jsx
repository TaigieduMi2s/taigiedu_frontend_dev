import { useState, useRef, useEffect } from 'react';
import './ContentTypeColumn.css';
import TableHeaderCell from '../TableHeaderCell/TableHeaderCell.jsx';
import pencilIcon from '../../../../assets/adminPage/pencil.svg';
import eyeIcon from '../../../../assets/adminPage/eye.svg';
import eyeSlashIcon from '../../../../assets/adminPage/eye-slash.svg';
import trashIcon from '../../../../assets/adminPage/trash.svg';

/** 相容舊用法：items 傳字串陣列時，補成物件格式 */
const toItem = (raw) =>
  typeof raw === 'string'
    ? { id: null, name: raw, usageCount: 0, isActive: true }
    : { id: raw?.id ?? null, name: raw?.name ?? '', usageCount: Number(raw?.usageCount ?? 0), isActive: raw?.isActive !== false };

const Row = ({
  item,
  isEditing,
  editValue,
  onStartEdit,
  onChangeEdit,
  onCommitEdit,
  onCancelEdit,
  onToggleStatus,
  onDelete,
  readOnly = false,
  busy = false,
}) => {
  // 已停用的項目不開放改名，先啟用再改；沒有教材在使用才給刪除
  const canDelete = item.usageCount === 0;

  return (
    <div className={`ct-row${item.isActive ? '' : ' is-disabled'}`}>
      {isEditing ? (
        <>
          <input
            className="ct-input"
            value={editValue}
            onChange={(e) => onChangeEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            autoFocus
          />
          <button className="ct-submit" onClick={onCommitEdit} disabled={busy}>確認</button>
        </>
      ) : (
        <>
          <span className="ct-label">
            {item.name}
            {!item.isActive && <span className="ct-badge">已停用</span>}
          </span>
          {!readOnly && (
            <div className="ct-actions">
              {item.usageCount > 0 && (
                <span className="ct-usage" title={`目前有 ${item.usageCount} 筆教材使用`}>{item.usageCount}</span>
              )}
              {item.isActive ? (
                <button className="ct-icon-btn" onClick={onStartEdit} aria-label="編輯名稱" title="編輯名稱" disabled={busy}>
                  <img src={pencilIcon} className="ct-icon" alt="" />
                </button>
              ) : (
                <span className="ct-icon-placeholder" aria-hidden="true" />
              )}
              <button
                className="ct-icon-btn"
                onClick={onToggleStatus}
                aria-label={item.isActive ? '停用' : '啟用'}
                title={item.isActive ? '停用（前台不顯示，資料保留）' : '啟用（重新顯示於前台）'}
                disabled={busy}
              >
                <img src={item.isActive ? eyeSlashIcon : eyeIcon} className="ct-icon" alt="" />
              </button>
              <button
                className="ct-icon-btn danger"
                onClick={onDelete}
                aria-label="刪除"
                disabled={busy || !canDelete}
                title={canDelete ? '刪除（永久移除，無法復原）' : '仍有教材使用此項目，請改用「停用」'}
              >
                <img src={trashIcon} className="ct-icon" alt="" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function ContentTypeColumn({
  items = [],
  onAddItem,
  onRenameItem,
  onToggleItemStatus,
  onDeleteItem,
  readOnly = false,
}) {
  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState('');
  const [addingMode, setAddingMode] = useState(false);
  const [adding, setAdding] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef(null);

  const list = items.map(toItem);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAddingMode(false);
        setEditIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const startEdit = (idx) => {
    if (readOnly) return;
    setEditIndex(idx);
    setEditValue(list[idx]?.name ?? '');
  };

  const cancelEdit = () => {
    setEditIndex(-1);
    setEditValue('');
  };

  // 改名：交給父層打 API，成功才收起輸入框
  const commitEdit = async () => {
    if (editIndex < 0) return;
    const current = list[editIndex];
    const next = editValue.trim();
    if (!next || next === current.name) {
      cancelEdit();
      return;
    }
    if (list.some((it, i) => i !== editIndex && it.name === next)) {
      cancelEdit();
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onRenameItem?.(current, next);
      if (success !== false) cancelEdit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (item) => {
    setIsSubmitting(true);
    try {
      await onToggleItemStatus?.(item);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (item) => {
    setIsSubmitting(true);
    try {
      await onDeleteItem?.(item);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = async () => {
    const v = adding.trim();
    if (!v) {
      setAddingMode(false);
      return;
    }
    if (list.some((it) => it.name === v)) {
      setAddingMode(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onAddItem?.(v);
      if (success === false) return;
      setAdding('');
      setAddingMode(false);
    } catch (error) {
      console.error('新增失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ct-col" ref={containerRef}>
      <div className="ct-header">
        <TableHeaderCell label="內容類型" showArrow={false} bgColor="#a7f3d0" />
      </div>
      <div className="ct-list">
        {list.map((item, idx) => (
          <Row
            key={item.id ?? `${item.name}-${idx}`}
            item={item}
            isEditing={idx === editIndex}
            editValue={editValue}
            onStartEdit={() => startEdit(idx)}
            onChangeEdit={setEditValue}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onToggleStatus={() => toggleStatus(item)}
            onDelete={() => deleteItem(item)}
            readOnly={readOnly}
            busy={isSubmitting}
          />
        ))}
        {addingMode ? (
          <div className="ct-add-edit">
            <input
              className="ct-input"
              placeholder="新增項目"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
                if (e.key === 'Escape') setAddingMode(false);
              }}
              autoFocus
            />
            <button className="ct-submit" onClick={addItem} disabled={isSubmitting}>確認</button>
          </div>
        ) : !readOnly ? (
          <div className="ct-add-row" onClick={() => setAddingMode(true)}>
            <span className="ct-plus">＋</span>
            <span className="ct-add-label">新增項目</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
