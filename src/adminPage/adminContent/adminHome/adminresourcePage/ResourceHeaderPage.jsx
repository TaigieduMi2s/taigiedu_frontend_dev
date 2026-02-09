import React, { useEffect, useMemo, useState } from 'react';
import './ResourceHeaderPage.css';
import TableHeaderCell from '../TableHeaderCell/TableHeaderCell.jsx';
import HighSchoolColumn from '../HighSchoolColumn/HighSchoolColumn.jsx';
import MiddleSchoolColumn from '../MiddleSchoolColumn/MiddleSchoolColumn.jsx';
import ElementarySchoolColumn from '../ElementarySchoolColumn/ElementarySchoolColumn.jsx';
import ContentTypeColumn from '../ContentTypeColumn/ContentTypeColumn.jsx';

const STORAGE_KEY = 'resourceHeaderConfig';

const defaultConfig = {
  versions: {
    '高中': ['真平', '育達', '泰宇', '奇異果', '創新'],
    '國中': ['真平', '康軒', '奇異果', '師昀', '全華', '豪風', '長鴻'],
    '國小': ['真平', '康軒']
  },
  contentTypes: ['學習單', '簡報', '教案', '其他']
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultConfig;
    const safeVersions = {
      '高中': Array.isArray(parsed?.versions?.['高中']) && parsed.versions['高中'].length > 0 ? parsed.versions['高中'] : defaultConfig.versions['高中'],
      '國中': Array.isArray(parsed?.versions?.['國中']) && parsed.versions['國中'].length > 0 ? parsed.versions['國中'] : defaultConfig.versions['國中'],
      '國小': Array.isArray(parsed?.versions?.['國小']) && parsed.versions['國小'].length > 0 ? parsed.versions['國小'] : defaultConfig.versions['國小']
    };
    const safeTypes = Array.isArray(parsed.contentTypes) && parsed.contentTypes.length > 0 ? parsed.contentTypes : defaultConfig.contentTypes;
    return { versions: safeVersions, contentTypes: safeTypes };
  } catch {
    return defaultConfig;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

const EditableList = ({ title, items, onChange, accentClass, showArrow = true }) => {
  const [list, setList] = useState(items);
  const [adding, setAdding] = useState('');

  useEffect(() => { setList(items); }, [items]);

  const updateItem = (idx, value) => {
    const next = list.map((v, i) => (i === idx ? value : v));
    setList(next); onChange(next);
  };
  const removeItem = (idx) => {
    const next = list.filter((_, i) => i !== idx);
    setList(next); onChange(next);
  };
  const addItem = () => {
    const v = adding.trim();
    if (!v) return;
    if (list.includes(v)) return;
    const next = [...list, v];
    setList(next); onChange(next); setAdding('');
  };

  return (
    <div className={`resconf-col ${accentClass}`}>
      <div className="resconf-col-header">
        <TableHeaderCell label={title} showArrow={showArrow} />
      </div>
      <div className="resconf-list">
        {list.map((v, idx) => (
          <div className="resconf-item" key={`${v}-${idx}`}>
            <input value={v} onChange={(e) => updateItem(idx, e.target.value)} />
            <div className="resconf-actions">
              <button className="resconf-btn" onClick={() => removeItem(idx)}>刪除</button>
            </div>
          </div>
        ))}
      </div>
      <div className="resconf-add">
        <input placeholder="新增項目" value={adding} onChange={(e) => setAdding(e.target.value)} />
        <button className="resconf-btn primary" onClick={addItem}>新增</button>
      </div>
    </div>
  );
};

export default function ResourceHeaderPage() {
  const [baseline, setBaseline] = useState(loadConfig());
  const [config, setConfig] = useState(baseline);
  const [pending, setPending] = useState(false);

  const setStage = (stage, nextList) => {
    setConfig((prev) => ({ ...prev, versions: { ...prev.versions, [stage]: nextList } }));
  };
  const setTypes = (next) => setConfig((prev) => ({ ...prev, contentTypes: next }));

  const allStages = useMemo(() => ['高中', '國中', '國小'], []);

  const handleSave = () => {
    saveConfig(config);
    setBaseline(config);
    setPending(false);
    // 觸發前台與後台同步刷新（若打開中）
    try { window.dispatchEvent(new Event('resource-config-updated')); } catch {}
    alert('已儲存設定');
  };

  // 僅在設定與基準不同時才標記為「可儲存／可還原」
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(baseline);
    setPending(changed);
  }, [config, baseline]);

  return (
    <div className="resconf-page">
      <div className="resconf-breadcrumb">
        <span className="section">資源共享平台</span>
        <span className="sep">&gt;</span>
        <span className="section">編輯課本選單</span>
      </div>
      <div className="resconf-grid">
        <HighSchoolColumn
          items={config.versions['高中']}
          onChange={(next) => setStage('高中', next)}
        />
        <MiddleSchoolColumn
          items={config.versions['國中']}
          onChange={(next) => setStage('國中', next)}
        />
        <ElementarySchoolColumn
          items={config.versions['國小']}
          onChange={(next) => setStage('國小', next)}
        />
        <ContentTypeColumn
          items={config.contentTypes}
          onChange={setTypes}
        />
      </div>
      <div className="resconf-footer">
        <button className="resconf-btn" disabled={!pending} onClick={() => setConfig(baseline)}>還原</button>
        <button className="resconf-btn primary" disabled={!pending} onClick={handleSave}>儲存</button>
      </div>
    </div>
  );
}
