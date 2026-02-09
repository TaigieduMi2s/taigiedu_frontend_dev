import React, { useState } from 'react';
import './ContentTypeColumn.css';
import TableHeaderCell from '../TableHeaderCell/TableHeaderCell.jsx';
import pencilIcon from '../../../../assets/adminPage/pencil.svg';

const Row = ({ value, isEditing, onStartEdit, onChange, onCommit }) => {
  return (
    <div className="ct-row">
      {isEditing ? (
        <input
          className="ct-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
        />
      ) : (
        <span className="ct-label">{value}</span>
      )}
      {!isEditing && (
        <button className="ct-icon-btn" onClick={onStartEdit} aria-label="edit">
          <img src={pencilIcon} className="ct-icon" alt="edit" />
        </button>
      )}
    </div>
  );
};

export default function ContentTypeColumn({ items = [], onChange }) {
  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState('');
  const [addingMode, setAddingMode] = useState(false);
  const [adding, setAdding] = useState('');

  const startEdit = (idx) => {
    setEditIndex(idx);
    setEditValue(items[idx] ?? '');
  };
  const commitEdit = () => {
    if (editIndex < 0) return;
    const next = items.map((v, i) => (i === editIndex ? (editValue || v) : v));
    onChange?.(next);
    setEditIndex(-1);
    setEditValue('');
  };

  const addItem = () => {
    const v = adding.trim();
    if (!v) return;
    if (items.includes(v)) return;
    const next = [...items, v];
    onChange?.(next);
    setAdding('');
    setAddingMode(false);
  };

  const addNewRow = () => {
    setAddingMode(true);
  };

  return (
    <div className="ct-col">
      <div className="ct-header">
        <TableHeaderCell label="內容類型" showArrow={false} bgColor="#a7f3d0" />
      </div>
      <div className="ct-list">
        {items.map((v, idx) => (
          <Row
            key={`${v}-${idx}`}
            value={idx === editIndex ? editValue : v}
            isEditing={idx === editIndex}
            onStartEdit={() => startEdit(idx)}
            onChange={(val) => setEditValue(val)}
            onCommit={commitEdit}
          />
        ))}
        {addingMode ? (
          <div className="ct-add-edit">
            <input
              className="ct-input"
              placeholder="新增項目"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <button className="ct-submit" onClick={addItem}>送出</button>
          </div>
        ) : (
          <div className="ct-add-row" onClick={addNewRow}>
            <span className="ct-plus">＋</span>
            <span className="ct-add-label">新增項目</span>
          </div>
        )}
      </div>
    </div>
  );
}
