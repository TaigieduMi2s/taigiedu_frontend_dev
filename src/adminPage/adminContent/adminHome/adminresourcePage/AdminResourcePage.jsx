import { useMemo, useState, useEffect, useCallback } from 'react';
import './AdminResourcePage.css';
import '../../../../resourcePage/ResourceHeader.css';
// 使用前台的 ResourceCard 以符合視覺樣式
import ResourceCard from '../../../../resourcePage/ResourceCard.jsx';
import MultiSelect from '../../../../phrasePage/multiselect';
import chevronUpIcon from '../../../../assets/chevron-up.svg';
import Pagination from '../../../../mainSearchPage/Pagination.jsx';
import shieldIcon from '../../../../assets/adminPage/shield-exclamation.svg';
import defaultPreviewImage from '../../../../assets/resourcepage/file_preview_demo.png';
import { authenticatedFetch } from '../../../../services/authService';
import { useToast } from '../../../../components/Toast';
import { useAuth } from '../../../../contexts/AuthContext';
import TakedownDialog from './TakedownDialog';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dev.taigiedu.com/backend';

export default function AdminResourcePage() {
  const { showToast } = useToast();
  const { user } = useAuth();

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
  const [isLoading, setIsLoading] = useState(true);

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

  // 從 API 取得的真實資源列表
  const [resources, setResources] = useState([]);

  // 將 API 回傳的資料轉換為前端格式
  const transformResource = (apiResource) => {
    // 將 API 的 status 轉換為前端使用的 status
    let frontendStatus = '目前項目';
    if (apiResource.status === 'reported') {
      frontendStatus = '被檢舉';
    } else if (apiResource.status === 'deleted' || apiResource.status === 'removed') {
      frontendStatus = '已下架項目';
    } else if (apiResource.status === 'publish') {
      frontendStatus = '目前項目';
    }

    return {
      id: apiResource.id,
      stage: apiResource.grade || '',
      version: apiResource.version || '',
      contentType: apiResource.contentType || '',
      imageUrl: apiResource.imageUrl || '',
      fileType: (apiResource.fileType || 'pdf').toUpperCase(),
      likes: apiResource.likes || 0,
      downloads: apiResource.downloads || 0,
      title: apiResource.title || '無標題',
      uploader: apiResource.uploader_name || '匿名',
      tags: apiResource.tags || [],
      status: frontendStatus,
      date: apiResource.date || '',
      reason: apiResource.reason || [],
      reportCount: apiResource.report_count || 0,
      reports: apiResource.reports || [],
      fileUrl: apiResource.fileUrl || ''
    };
  };

  // 從 API 載入資源列表
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/resource/list`);
      const data = await response.json();

      if (response.ok && data.resources) {
        const transformedResources = data.resources.map(transformResource);
        setResources(transformedResources);
        console.log('從 API 載入資源列表:', transformedResources.length, '筆');
      } else {
        console.error('載入資源列表失敗:', data);
        showToast('載入資源列表失敗', 'error');
      }
    } catch (error) {
      console.error('載入資源列表失敗:', error);
      showToast('載入資源列表失敗: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 初始載入
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

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
        `&status=${encodeURIComponent(resource.status || '目前項目')}` +
        `&reason=${encodeURIComponent(JSON.stringify(resource.reason || []))}` +
        `&reportCount=${resource.reportCount || 0}` +
        `&reports=${encodeURIComponent(JSON.stringify(resource.reports || []))}`;
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch { }
  };

  const closeAction = () => { setActionOpen(false); setReason('不雅內容'); setSelected(null); };

  // 下架資源
  const confirmAction = async () => {
    if (!selected?.id) return;

    const body = {
      id: selected.id,
      action: '1',
      reason: reason,
      userID: user?.id || user?.email || 'admin'
    };
    console.log('送出下架請求:', body);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/resource/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('下架 API 回應:', data);

      if (response.ok && data.success) {
        // 更新本地狀態
        setResources(prev => prev.map(r => r.id === selected.id ? { ...r, status: '已下架項目', downReason: reason } : r));
        showToast('資源已成功下架', 'success');

        // 通知前台重新載入資源
        window.dispatchEvent(new CustomEvent('resource-updated', {
          detail: { action: 'down', id: selected?.id, reason }
        }));
      } else {
        showToast(data.message || '下架失敗', 'error');
      }
    } catch (error) {
      console.error('下架資源失敗:', error);
      showToast('下架失敗: ' + error.message, 'error');
    }

    closeAction();
  };

  // 復原資源（取消下架）
  const handleUndown = async (resource) => {
    if (!resource?.id) return;

    const body = {
      id: resource.id,
      action: '2',
      reason: '管理員取消下架',
      userID: user?.id || user?.email || 'admin'
    };
    console.log('送出復原請求:', body);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/resource/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('復原 API 回應:', data);

      if (response.ok && data.success) {
        // 更新本地狀態
        setResources(prev => prev.map(r => r.id === resource.id ? { ...r, status: '目前項目', downReason: undefined } : r));
        showToast('資源已成功復原', 'success');

        // 通知前台重新載入資源
        window.dispatchEvent(new CustomEvent('resource-updated', {
          detail: { action: 'undown', id: resource.id }
        }));
      } else {
        showToast(data.message || '復原失敗', 'error');
      }
    } catch (error) {
      console.error('復原資源失敗:', error);
      showToast('復原失敗: ' + error.message, 'error');
    }
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
        {isLoading ? (
          <div className="empty-state">載入中...</div>
        ) : filtered.length === 0 ? (
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
                    <span>被檢舉 {r.reportCount > 0 && `(${r.reportCount})`}</span>
                    <img src={shieldIcon} alt="reported" />
                  </div>
                  <div className="reported-controls">
                    <button className="reported-button" onClick={(e) => { e.stopPropagation(); openPreview(r); }}>預覽</button>
                    <button className="reported-button" onClick={(e) => { e.stopPropagation(); openAction(r); }}>下架</button>
                  </div>
                </>
              )}
              {status === '目前項目' && r.status !== '被檢舉' && (
                <>
                  <div className="normal-overlay" />
                  <div className="normal-controls">
                    <button className="normal-button primary" onClick={(e) => { e.stopPropagation(); openPreview(r); }}>預覽</button>
                    <button className="normal-button" onClick={(e) => { e.stopPropagation(); openAction(r); }}>下架</button>
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
            maxVisible={4}
          />
        </div>
      )}

      <TakedownDialog
        open={actionOpen}
        onClose={closeAction}
        onConfirm={confirmAction}
        selectedItem={selected}
        reason={reason}
        setReason={setReason}
      />
    </div>
  );
}
