import React, { useState } from 'react';
import './HighSchoolColumn.css';
import TableHeaderCell from '../TableHeaderCell/TableHeaderCell.jsx';
import pencilIcon from '../../../../assets/adminPage/pencil.svg';

const Row = ({ value, isEditing, onStartEdit, onChange, onCommit }) => {
  return (
    <div className="hs-row">
      {isEditing ? (
        <input
          className="hs-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
        />
      ) : (
        <span className="hs-label">{value}</span>
      )}
      {!isEditing && (
        <button className="hs-icon-btn" onClick={onStartEdit} aria-label="edit">
          <img src={pencilIcon} className="hs-icon" alt="edit" />
        </button>
      )}
    </div>
  );
};

export default function HighSchoolColumn({ items = [], onChange }) {
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
    <div className="hs-col">
      <div className="hs-header">
        <TableHeaderCell label="高中" showArrow={true} bgColor="#FAD6AB" />
      </div>
      <div className="hs-list">
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
          <div className="hs-add-edit">
            <input
              className="hs-input"
              placeholder="新版本"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <button className="hs-submit" onClick={addItem}>送出</button>
          </div>
        ) : (
          <div className="hs-add-row" onClick={addNewRow}>
            <span className="hs-plus">＋</span>
            <span className="hs-add-label">新增項目</span>
          </div>
        )}
      </div>
    </div>
  );
}
