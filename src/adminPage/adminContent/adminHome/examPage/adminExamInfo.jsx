import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../../../components/Toast';
import AdminModal from '../../../../components/AdminModal';
import AdminDataTable from '../../../../components/AdminDataTable';
import './adminExamInfo.css';
import editIcon from '../../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../../assets/adminPage/trash.svg';
import addIcon from '../../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../../assets/adminPage/uturn.svg';
import jpgIconImage from '../../../../assets/adminPage/jpg icon.svg';
import { authenticatedFetch } from '../../../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dev.taigiedu.com/api';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const filename = path.split('/').filter(Boolean).pop();
  return `https://dev.taigiedu.com/backend/static/exam/${filename}`;
};

const AdminExamInfo = () => {
  const { showToast } = useToast();
  const [examTypes, setExamTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('published');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);

  // Form fields
  const [newName, setNewName] = useState('');
  const [newLink, setNewLink] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchExamTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExamTypes = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/exam`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '載入失敗');
      
      const formatted = result.data.map(item => ({
        id: item.id,
        name: item.name,
        link: item.link,
        imageName: item.figure ? item.figure.split('/').pop() : '圖片',
        imageUrl: getFullImageUrl(item.figure),
        createdAt: item.timestamp,
        status: item.status === 'publish' ? 'published' : item.status === 'archive' ? 'archived' : item.status
      }));
      setExamTypes(formatted);
    } catch (err) {
      showToast(`載入失敗: ${err.message}`, 'error');
    }
  };

  // 過濾資料
  const displayItems = useMemo(() => {
    return examTypes.filter(item => item.status === statusFilter);
  }, [examTypes, statusFilter]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentEditId(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentEditId(item.id);
    setNewName(item.name);
    setNewLink(item.link);
    setImageName(item.imageName);
    setImageUrl(item.imageUrl);
    setShowAddModal(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/exam/modify`, {
        method: 'POST',
        body: JSON.stringify({ id: String(id), action: '1' })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '操作失敗');
      
      showToast('項目已移至刪除紀錄', 'success');
      await fetchExamTypes();
    } catch (err) {
      showToast(`下架失敗: ${err.message}`, 'error');
    }
  };

  const handleRestoreClick = async (id) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/exam/modify`, {
        method: 'POST',
        body: JSON.stringify({ id: String(id), action: '2' })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '操作失敗');
      
      showToast('項目已恢復', 'success');
      await fetchExamTypes();
    } catch (err) {
      showToast(`恢復失敗: ${err.message}`, 'error');
    }
  };

  const validateAndSetImage = (file) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('只接受 JPG 或 PNG 格式', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('檔案大小不能超過 2MB', 'warning');
      return;
    }

    setImageFile(file);
    setImageName(file.name);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewLink('');
    setImageFile(null);
    setImageName('');
    setImageUrl('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      new URL(newLink);
    } catch {
      showToast('請輸入有效的 URL', 'warning');
      return;
    }

    if (!imageName && (!imageUrl || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) && !currentEditId) {
      // If adding new item and no images
      showToast('請上傳圖片', 'warning');
      return;
    }

    try {
      if (isEditing) {
        const response = await authenticatedFetch(`${API_BASE_URL}/admin/exam/modify`, {
          method: 'POST',
          body: JSON.stringify({
            id: String(currentEditId),
            action: '3',
            name: newName,
            link: newLink,
            figure: imageName
          })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '更新失敗');
        showToast('認證類型已更新！', 'success');
      } else {
        const response = await authenticatedFetch(`${API_BASE_URL}/admin/exam/add`, {
          method: 'POST',
          body: JSON.stringify({
            name: newName,
            link: newLink,
            figure: imageName
          })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '新增失敗');
        showToast('認證類型已新增！', 'success');
      }

      handleModalClose();
      await fetchExamTypes();
    } catch (err) {
      showToast(`操作失敗: ${err.message}`, 'error');
    }
  };

  // 拖曳處理
  const handleDragEnd = useCallback((activeId, overId) => {
    if (!overId) return;

    setExamTypes(prev => {
      const oldIndex = prev.findIndex(i => i.id === activeId);
      const newIndex = prev.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newItems = [...prev];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  }, []);

  // 定義表格欄位
  const columns = useMemo(() => [
    {
      id: 'edit',
      header: '修改',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <button className="admin-action-btn edit-btn" onClick={() => handleEditClick(row.original)}>
          <img src={editIcon} alt="編輯" className="admin-action-icon" />
        </button>
      )
    },
    {
      accessorKey: 'name',
      header: '名稱',
      enableSorting: true,
    },
    {
      id: 'image',
      header: '圖片',
      size: 200,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="image-preview-cell">
          <img src={jpgIconImage} alt="圖片" className="file-icon-img" />
          <span className="file-name-text">{row.original.imageName}</span>
        </div>
      )
    },
    {
      accessorKey: 'link',
      header: '連結',
      enableSorting: false,
      cell: ({ row }) => (
        <a href={row.original.link} target="_blank" rel="noopener noreferrer" className="admin-link">
          {row.original.link}
        </a>
      )
    },
    {
      id: 'action',
      header: '刪除',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        statusFilter === 'published' ? (
          <button className="admin-action-btn delete-btn" onClick={() => handleDeleteClick(row.original.id)}>
            <img src={deleteIcon} alt="刪除" className="admin-action-icon" />
          </button>
        ) : (
          <button className="admin-action-btn restore-btn" onClick={() => handleRestoreClick(row.original.id)}>
            <img src={uturnIcon} alt="恢復" className="admin-action-icon" />
          </button>
        )
      )
    }
  ], [statusFilter]);

  return (
    <div className="admin-exam-info-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">
          認證考試 &gt; 認證類型 &gt; <span>{statusFilter === 'published' ? '目前項目' : '刪除紀錄'}</span>
        </h5>
        <div className="admin-controls-row">
          <button className="btn btn-primary me-3 admin-add-button" onClick={handleAddClick}>
            <img src={addIcon} alt="新增項目" />
            新增項目
          </button>
          <div className="status-filter">
            <span className="me-2 text-secondary">目前狀態：</span>
            <select
              className="form-select admin-status-dropdown"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="published">目前項目</option>
              <option value="archived">刪除紀錄</option>
            </select>
          </div>
        </div>
      </div>

      <AdminDataTable
        data={displayItems}
        columns={columns}
        enableDragging={true}
        enableSorting={true}
        onDragEnd={handleDragEnd}
        emptyState={{ message: '目前沒有認證類型資料' }}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        title={isEditing ? '編輯項目' : '新增項目'}
        onSubmit={handleFormSubmit}
      >
        <div className="mb-3">
          <label htmlFor="newName" className="form-label admin-form-label">
            *名稱
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label admin-form-label">*圖片</label>
          <div className="upload-wrapper mb-2">
            <label className="upload-btn">
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="d-none"
                onChange={(e) => validateAndSetImage(e.target.files?.[0])}
              />
              上傳檔案
            </label>
            <span className="upload-hint">※限 JPG、PNG 可上傳，限制 2MB。</span>
          </div>
          {(imageName || imageUrl) && (
            <div className="mt-3 d-inline-flex flex-column align-items-center" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '8px', backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <img src={imageUrl || '#'} alt="圖片預覽" style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} />
              <div className="mt-2 text-secondary text-truncate" style={{ maxWidth: '200px', fontSize: '13px' }} title={imageName || '圖片'}>
                {imageName || '圖片'}
              </div>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="newLink" className="form-label admin-form-label">
            *連結
          </label>
          <input
            type="url"
            className="form-control admin-form-control"
            id="newLink"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminExamInfo;
