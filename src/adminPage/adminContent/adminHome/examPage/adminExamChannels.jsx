import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../../../components/Toast';
import AdminModal from '../../../../components/AdminModal';
import AdminDataTable from '../../../../components/AdminDataTable';
import './adminExamChannels.css';
import editIcon from '../../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../../assets/adminPage/trash.svg';
import addIcon from '../../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../../assets/adminPage/uturn.svg';
import jpgIconImage from '../../../../assets/adminPage/jpg icon.svg';

const AdminExamChannels = () => {
  const { showToast } = useToast();
  const [channels, setChannels] = useState([]);
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
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChannels = () => {
    const mockData = [
      {
        id: 1,
        name: '台語教學頻道',
        imageName: 'channel1.jpg',
        imageUrl: '',
        link: 'https://youtube.com/channel1',
        status: 'published',
        createdAt: '2024/12/01 10:30:00'
      },
      {
        id: 2,
        name: '閩南語學習 Podcast',
        imageName: 'channel2.jpg',
        imageUrl: '',
        link: 'https://podcast.com/channel2',
        status: 'published',
        createdAt: '2024/12/05 14:20:00'
      }
    ];
    setChannels(mockData);
  };

  // 過濾資料
  const displayItems = useMemo(() => {
    return channels.filter(item => item.status === statusFilter);
  }, [channels, statusFilter]);

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

  const handleDeleteClick = (id) => {
    const updatedItems = channels.map(item =>
      item.id === id ? { ...item, status: 'archived' } : item
    );
    setChannels(updatedItems);
    showToast('頻道已移至刪除紀錄', 'success');
  };

  const handleRestoreClick = (id) => {
    const updatedItems = channels.map(item =>
      item.id === id ? { ...item, status: 'published' } : item
    );
    setChannels(updatedItems);
    showToast('頻道已恢復', 'success');
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

  const handleFormSubmit = (e) => {
    e.preventDefault();

    try {
      new URL(newLink);
    } catch {
      showToast('請輸入有效的 URL', 'warning');
      return;
    }

    if (!imageName) {
      showToast('請上傳圖片', 'warning');
      return;
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (isEditing) {
      const updatedItems = channels.map(item =>
        item.id === currentEditId
          ? { ...item, name: newName, link: newLink, imageName, imageUrl }
          : item
      );
      setChannels(updatedItems);
      showToast('頻道資料已更新！', 'success');
    } else {
      const newItem = {
        id: Date.now(),
        name: newName,
        link: newLink,
        imageName,
        imageUrl,
        status: 'published',
        createdAt: timestamp
      };
      setChannels([...channels, newItem]);
      showToast('頻道已新增！', 'success');
    }

    handleModalClose();
  };

  // 拖曳處理
  const handleDragEnd = useCallback((activeId, overId) => {
    if (!overId) return;

    setChannels(prev => {
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
      header: '',
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
      header: '',
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
    <div className="admin-exam-channels-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">
          認證考試 &gt; 教育頻道 &gt; <span>{statusFilter === 'published' ? '目前項目' : '刪除紀錄'}</span>
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
        emptyState={{ message: '目前沒有教育頻道資料' }}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        title={isEditing ? '編輯頻道' : '新增頻道'}
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
          <div className="upload-wrapper">
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
          {imageName && (
            <div className="image-preview-cell" style={{ marginTop: 8 }}>
              <img src={jpgIconImage} alt="圖片" className="file-icon-img" />
              <span className="file-name-text">{imageName}</span>
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

export default AdminExamChannels;
