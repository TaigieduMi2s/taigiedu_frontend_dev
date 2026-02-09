import { useMemo, useState } from 'react';
import './AdminResourcePage.css';
import '../../../../resourcePage/ResourceHeader.css';
// 使用前台的 ResourceCard 以符合視覺樣式
import ResourceCard from '../../../../resourcePage/ResourceCard.jsx';
import MultiSelect from '../../../../phrasePage/multiselect';
import chevronUpIcon from '../../../../assets/chevron-up.svg';
import Pagination from '../../../../mainSearchPage/Pagination.jsx';
import shieldIcon from '../../../../assets/adminPage/shield-exclamation.svg';
import defaultPreviewImage from '../../../../assets/resourcepage/file_preview_demo.png';

// Mock Data：之後會用 API 取代
const baseResources = [
  { id: 'r1', stage: '國小', version: '康軒', contentType: '學習單', imageUrl: '', fileType: 'PDF', likes: 100, downloads: 29, title: '112海一版四年級上學期國語學習單', uploader: 'Wynnie', tags: ['國小', '康軒', '上冊'], status: '目前項目' },
  { id: 'r2', stage: '國中', version: '翰林', contentType: '其他', imageUrl: '', fileType: 'MP3', likes: 88, downloads: 45, title: '海豬救援隊 - 片頭曲', uploader: 'Wynnie', tags: ['音檔'], status: '目前項目' },
  { id: 'r3', stage: '國小', version: '康軒', contentType: '教案', imageUrl: '', fileType: 'MP4', likes: 64, downloads: 12, title: '台語文化課第1集（教案影片）', uploader: 'Admin', tags: ['影片'], status: '待審核' },
  { id: 'r4', stage: '高中', version: '龍騰', contentType: '學習單', imageUrl: '', fileType: 'PDF', likes: 20, downloads: 5, title: '校園活動同意書(範本)', uploader: 'Editor', tags: ['文件'], status: '被檢舉' },
  { id: 'r5', stage: '國小', version: '康軒', contentType: '學習單', imageUrl: '', fileType: 'PDF', likes: 101, downloads: 30, title: '台語俗語學習單(上)', uploader: 'Teacher', tags: ['教材'], status: '目前項目' },
  { id: 'r6', stage: '國小', version: '康軒', contentType: '其他', imageUrl: '', fileType: 'JPG', likes: 40, downloads: 1, title: '台灣文化展海報', uploader: 'Designer', tags: ['海報'], status: '目前項目' },
  { id: 'r7', stage: '國中', version: '南一', contentType: '其他', imageUrl: '', fileType: 'WAV', likes: 24, downloads: 8, title: '台語發音練習 - 母音', uploader: 'Admin', tags: ['練習'], status: '目前項目' },
  { id: 'r8', stage: '國中', version: '翰林', contentType: '學習單', imageUrl: '', fileType: 'PDF', likes: 9, downloads: 2, title: '後台操作學習單 v1.2', uploader: 'Editor', tags: ['手冊'], status: '目前項目' },
];

// 產生 18 張卡片以符合截圖數量
let mockResources = Array.from({ length: 18 }, (_, i) => {
  const b = baseResources[i % baseResources.length];
  return {
    ...b,
    id: `${b.id}_${i + 1}`,
    likes: b.likes + (i % 7),
    downloads: b.downloads + (i % 5)
  };
});

// 插入第13張（page2 的第一張）被檢舉卡片
const reportedCard = {
  id: 'reported_special_13',
  stage: '國中',
  version: '真平',
  contentType: '學習單',
  imageUrl: '',
  fileType: 'PDF',
  likes: 100,
  downloads: 20,
  title: '112南一版四年級上學期國語課講義',
  uploader: 'Wynnie',
  tags: ['國中', '真平', '上冊', '投影片'],
  status: '被檢舉'
};
if (!mockResources.find(r => r.id === reportedCard.id)) {
  mockResources.splice(12, 0, reportedCard);
}

export default function AdminResourcePage() {
  // 與 ResourcePage 同款的篩選與搜尋狀態
  const [selectedGrade, setSelectedGrade] = useState('階段');
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isMultiSelectEnabled, setIsMultiSelectEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  // 從後台設定讀取內容類型，預設為前台一樣：學習單、簡報、教案、其他
  const CONFIG_KEY = 'resourceHeaderConfig';
  const cfg = (() => { try { const raw = localStorage.getItem(CONFIG_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } })();
  const contentTypeOptions = Array.isArray(cfg?.contentTypes) && cfg.contentTypes.length > 0 ? cfg.contentTypes : ['學習單', '簡報', '教案', '其他'];
  // 預設選滿四類，與需求一致
  const [selectedContentTypes, setSelectedContentTypes] = useState([...contentTypeOptions]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('目前項目');
  const [actionOpen, setActionOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('不雅內容');
  const [page, setPage] = useState(1);
  const pageSize = 12; // 與前台相近的每頁數量

  // 版本選項映射（與 ResourceHeader 相同）
  const defaultVersions = {
    '國小': ['真平', '康軒'],
    '國中': ['真平', '康軒', '奇異果', '師昀', '全華', '豪風', '長鴻'],
    '高中': ['真平', '育達', '泰宇', '奇異果', '創新']
  };
  const gradeToVersions = {
    '國小': cfg?.versions?.['國小'] || defaultVersions['國小'],
    '國中': cfg?.versions?.['國中'] || defaultVersions['國中'],
    '高中': cfg?.versions?.['高中'] || defaultVersions['高中']
  };
  const allVersions = Array.from(new Set([...(gradeToVersions['國小'] || []), ...(gradeToVersions['國中'] || []), ...(gradeToVersions['高中'] || [])]));
  const getVersionOptions = (grade) => grade === '全部' ? allVersions : (gradeToVersions[grade] || []);
  const statuses = ['目前項目', '已下架項目'];

  const [resources, setResources] = useState(mockResources);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const stage = selectedGrade;
      const matchStage = stage === '階段' || stage === '全部' || r.stage === stage;
      const matchVersion = selectedCategories.length === 0 || selectedCategories.includes(r.version);
      const matchType = selectedContentTypes.length === 0 || selectedContentTypes.includes(r.contentType);
      const matchStatus = status === '目前項目' ? (r.status === '目前項目' || r.status === '被檢舉') : (r.status !== '目前項目' && r.status !== '被檢舉');
      const q = query.trim().toLowerCase();
      const matchSearch = !q || `${r.title} ${r.uploader}`.toLowerCase().includes(q);
      return matchStage && matchVersion && matchType && matchStatus && matchSearch;
    });
  }, [resources, selectedGrade, selectedCategories, selectedContentTypes, status, query]);

  // 將被檢舉的項目排在最前（由左到右、由上到下）
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => (b.status === '被檢舉') - (a.status === '被檢舉'));
    return arr;
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 行為：模擬 ResourceHeader 的互動
  const handleGradeChange = (e) => {
    const grade = e.target.value;
    setSelectedGrade(grade);
    if (grade === '全部') setSelectedCategories([...allVersions]);
    else if (grade !== '階段') setSelectedCategories([...getVersionOptions(grade)]);
    else setSelectedCategories([]);
    setIsMultiSelectEnabled(grade !== '階段');
  };
  const handleCategoryChange = (selected) => setSelectedCategories(selected);
  const handleContentTypeChange = (selected) => setSelectedContentTypes(selected);
  const handleSearch = (e) => { e.preventDefault(); };

  const openAction = (item) => { setSelected(item); setActionOpen(true); };
  const openPreview = (resource) => {
    try {
      const getFullImageUrl = (url) => {
        if (!url || url === '/src/assets/resourcepage/file_preview_demo.png') {
          return defaultPreviewImage;
        }
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://dev.taigiedu.com/backend/${url}`;
      };
      const previewUrl = `${window.location.origin}/admin/file-preview?` +
        `title=${encodeURIComponent(resource.title || '無標題資源')}` +
        `&imageUrl=${encodeURIComponent(getFullImageUrl(resource.imageUrl))}` +
        `&fileType=${encodeURIComponent(resource.fileType || 'PDF')}` +
        `&likes=${resource.likes || 0}` +
        `&downloads=${resource.downloads || 0}` +
        `&uploader=${encodeURIComponent(resource.uploader || '匿名上傳者')}` +
        `&tags=${encodeURIComponent(JSON.stringify(resource.tags || []))}` +
        `&date=${encodeURIComponent(resource.date || '')}` +
        `&id=${encodeURIComponent(resource.id || '')}` +
        `&status=${encodeURIComponent(resource.status || '目前項目')}`;
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch { }
  };

  const closeAction = () => { setActionOpen(false); setReason('不雅內容'); setSelected(null); };
  const confirmAction = () => {
    // 更新本頁資源狀態為「已下架項目」
    if (selected?.id) {
      setResources(prev => prev.map(r => r.id === selected.id ? { ...r, status: '已下架項目', downReason: reason } : r));
    }
    // 通知前台重新載入資源（事件機制）
    try {
      window.dispatchEvent(new CustomEvent('resource-updated', {
        detail: { action: 'down', id: selected?.id, reason }
      }));
    } catch { }
    closeAction();
  };

  const handleUndown = (resource) => {
    if (!resource?.id) return;
    setResources(prev => prev.map(r => r.id === resource.id ? { ...r, status: '目前項目', downReason: undefined } : r));
    try {
      window.dispatchEvent(new CustomEvent('resource-updated', {
        detail: { action: 'undown', id: resource.id }
      }));
    } catch { }
  };

  return (
    <div className="admin-content-wrapper">
      <div className="admin-banner"><span className="dot" /> 您現在使用管理員權限檢視角度</div>

      <div className="admin-toolbar">
        <div className="admin-filters left">
          <div className="resource-header">
            <div className="dropdown-container">
              <select
                className={`grade-dropdown ${isGradeOpen ? 'open' : ''}`}
                onClick={() => setIsGradeOpen(!isGradeOpen)}
                value={selectedGrade}
                onChange={handleGradeChange}
              >
                <option hidden>階段</option>
                <option value="全部">全部</option>
                <option value="高中">高中</option>
                <option value="國中">國中</option>
                <option value="國小">國小</option>
              </select>
              <img src={chevronUpIcon} alt="dropdown arrow" className="dropdown-arrow" />
            </div>

            <div className={`multiselect-wrapper ${isMultiSelectEnabled ? 'enabled' : 'disabled'} resource-multi`}>
              <MultiSelect
                key={selectedGrade}
                options={getVersionOptions(selectedGrade)}
                selectedOptions={selectedCategories}
                onChange={handleCategoryChange}
                placeholder="版本"
                displayText="已選擇版本"
              />
            </div>

            <div className="multiselect-wrapper resource-multi">
              <MultiSelect
                options={contentTypeOptions}
                selectedOptions={selectedContentTypes}
                onChange={handleContentTypeChange}
                placeholder="內容類型"
                displayText="已選擇類型"
              />
            </div>

            <form onSubmit={handleSearch} className="res-search-container">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋..."
                className="res-search-input"
              />
              <img src="search_logo.svg" className="res-search-icon" onClick={handleSearch} />
            </form>
          </div>
        </div>
        <div className="admin-status">
          <span>目前狀態：</span>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className={`admin-card-grid four-cols ${status === '已下架項目' ? 'down-mode' : ''}`}>
        {filtered.length === 0 ? (
          <div className="empty-state">沒有符合條件的資料。</div>
        ) : (
          pagedItems.map((r) => (
            <div
              key={r.id}
              className={`admin-card-wrapper ${r.status === '被檢舉' ? 'reported' : ''}`}
              onClick={r.status === '被檢舉' ? undefined : () => openPreview(r)}
            >
              {r.status === '被檢舉' && (
                <>
                  <div className="reported-overlay" />
                  <div className="reported-badge">
                    <span>被檢舉</span>
                    <img src={shieldIcon} alt="reported" />
                  </div>
                  <div className="reported-controls">
                    <button className="reported-button" onClick={(e) => { e.stopPropagation(); openPreview(r); }}>預覽</button>
                    <button className="reported-button" onClick={(e) => { e.stopPropagation(); openAction(r); }}>下架</button>
                  </div>
                </>
              )}
              {status === '已下架項目' && (
                <>
                  <div className="down-overlay" />
                  <div className="down-controls">
                    <button className="down-button primary" onClick={(e) => { e.stopPropagation(); openPreview(r); }}>預覽</button>
                    <button className="down-button" onClick={(e) => { e.stopPropagation(); handleUndown(r); }}>取消下架</button>
                  </div>
                </>
              )}
              <ResourceCard
                imageUrl={r.imageUrl}
                fileType={r.fileType}
                likes={r.likes}
                downloads={r.downloads}
                title={r.title}
                uploader={r.uploader}
                tags={r.tags}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination：當總頁數 > 1 就顯示 */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {actionOpen && (
        <div className="admin-modal-backdrop" onClick={closeAction}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>下架理由：</div>
              <button className="admin-modal-close" onClick={closeAction}>×</button>
            </div>
            <div className="admin-modal-body">
              {['不雅內容', '涉及著作權侵權', '政治不中立', '旁白或文稿問題', '重複上傳', '廣告內容', '侵害隱私', '涉及恐怖、脅迫或血腥'].map(r => (
                <label key={r} className="admin-radio">
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={closeAction}>取消</button>
              <button className="admin-btn primary" onClick={confirmAction}>確定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
