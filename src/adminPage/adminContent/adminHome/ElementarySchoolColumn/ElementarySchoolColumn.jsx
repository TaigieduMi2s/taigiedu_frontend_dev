import React, { useState } from 'react';
import './ElementarySchoolColumn.css';
import TableHeaderCell from '../TableHeaderCell/TableHeaderCell.jsx';
import pencilIcon from '../../../../assets/adminPage/pencil.svg';

const Row = ({ value, isEditing, onStartEdit, onChange, onCommit }) => {
  return (
    <div className="es-row">
      {isEditing ? (
        <input
          className="es-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
        />
      ) : (
        <span className="es-label">{value}</span>
      )}
      {!isEditing && (
        <button className="es-icon-btn" onClick={onStartEdit} aria-label="edit">
          <img src={pencilIcon} className="es-icon" alt="edit" />
        </button>
      )}
    </div>
  );
};

export default function ElementarySchoolColumn({ items = [], onChange }) {
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
    <div className="es-col">
      <div className="es-header">
        <TableHeaderCell label="國小" showArrow={true} bgColor="#ecabac" />
      </div>
      <div className="es-list">
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
          <div className="es-add-edit">
            <input
              className="es-input"
              placeholder="新版本"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <button className="es-submit" onClick={addItem}>送出</button>
          </div>
        ) : (
          <div className="es-add-row" onClick={addNewRow}>
            <span className="es-plus">＋</span>
            <span className="es-add-label">新增項目</span>
          </div>
        )}
      </div>
    </div>
  );
}
