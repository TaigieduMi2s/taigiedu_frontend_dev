import React, { useState } from 'react';
import './MiddleSchoolColumn.css';
import TableHeaderCell from '../TableHeaderCell/TableHeaderCell.jsx';
import pencilIcon from '../../../../assets/adminPage/pencil.svg';

const Row = ({ value, isEditing, onStartEdit, onChange, onCommit }) => {
  return (
    <div className="ms-row">
      {isEditing ? (
        <input
          className="ms-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
        />
      ) : (
        <span className="ms-label">{value}</span>
      )}
      {!isEditing && (
        <button className="ms-icon-btn" onClick={onStartEdit} aria-label="edit">
          <img src={pencilIcon} className="ms-icon" alt="edit" />
        </button>
      )}
    </div>
  );
};

export default function MiddleSchoolColumn({ items = [], onChange }) {
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
    <div className="ms-col">
      <div className="ms-header">
        <TableHeaderCell label="國中" showArrow={true} bgColor="#CEAAF2" />
      </div>
      <div className="ms-list">
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
          <div className="ms-add-edit">
            <input
              className="ms-input"
              placeholder="新版本"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <button className="ms-submit" onClick={addItem}>送出</button>
          </div>
        ) : (
          <div className="ms-add-row" onClick={addNewRow}>
            <span className="ms-plus">＋</span>
            <span className="ms-add-label">新增項目</span>
          </div>
        )}
      </div>
    </div>
  );
}
