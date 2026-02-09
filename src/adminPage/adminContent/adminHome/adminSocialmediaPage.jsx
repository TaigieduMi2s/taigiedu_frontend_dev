import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../../components/Toast';
import AdminModal from '../../../components/AdminModal';
import AdminDataTable from '../../../components/AdminDataTable';
import './adminSocialmediaPage.css';

// 圖標導入
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';
import jpgIconImage from '../../../assets/adminPage/jpg icon.svg';

const AdminSocialmediaPage = () => {
  const { showToast } = useToast();

  // 基本狀態
  const [menuItems, setMenuItems] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [parentFilter, setParentFilter] = useState('全部');
  const [childFilter, setChildFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('published');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal 狀態
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [pickedCategories, setPickedCategories] = useState([]);
  const [imageName, setImageName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentEditId(null);
    setName('');
    setLink('');
    setPickedCategories([]);
    setImageName('');
    setImageUrl('');
  };

  const togglePicked = (cat) => {
    setPickedCategories(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat]);
  };

  const openCreate = () => {
    resetForm();
    setAttemptedSubmit(false);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setIsEditing(true);
    setCurrentEditId(item.id);
    setName(item.name || '');
    setLink(item.link || '');
    setPickedCategories(item.categories || []);
    setImageName(item.imageName || '');
    setImageUrl(item.imageUrl || '');
    setAttemptedSubmit(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setAttemptedSubmit(false);
    setShowModal(false);
  };

  // 取得資料
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://dev.taigiedu.com/backend/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('載入失敗');
      const result = await response.json();

      const dynamicMenu = {};
      const items = [];

      Object.keys(result).forEach(rawCategory => {
        const mainCategory = rawCategory === '' ? '其他' : rawCategory;
        const records = result[rawCategory] || [];
        const subSet = new Set();

        records.forEach(item => {
          if (item.subcategory && item.subcategory.trim() !== '') {
            subSet.add(item.subcategory.trim());
          }
        });

        const subItems = Array.from(subSet).sort();
        dynamicMenu[mainCategory] = {
          hasSubMenu: subItems.length > 0,
          subItems
        };

        records.forEach(item => {
          items.push({
            id: item.id || `media-${Date.now()}-${Math.random()}`,
            mainCategory,
            subCategory: item.subcategory && item.subcategory.trim() !== '' ? item.subcategory.trim() : '',
            categories: item.subcategory && item.subcategory.trim() !== '' ? [item.subcategory.trim()] : [],
            name: item.title || '未命名',
            link: item.url || '#',
            imageUrl: item.image || '',
            imageName: '',
            status: 'published',
            timestamp: new Date().toLocaleDateString('zh-TW')
          });
        });
      });

      setMenuItems(dynamicMenu);
      setAllItems(items);
    } catch (err) {
      console.error('載入失敗:', err);
      setError(err.message);
      showToast('載入資料失敗', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 取得子選項
  const childOptions = useMemo(() => {
    if (parentFilter === '全部') return [];
    return menuItems[parentFilter]?.subItems || [];
  }, [parentFilter, menuItems]);

  // 過濾邏輯
  const filteredItems = useMemo(() => {
    let list = allItems.filter(i => i.status === statusFilter);
    if (parentFilter !== '全部') {
      list = list.filter(i => i.mainCategory === parentFilter);
    }
    if (childFilter !== '全部') {
      list = list.filter(i => i.subCategory === childFilter);
    }
    return list;
  }, [allItems, parentFilter, childFilter, statusFilter]);

  // 拖曳處理
  const handleDragEnd = useCallback((activeId, overId) => {
    if (!overId || activeId === overId) return;

    const oldIndex = filteredItems.findIndex(item => item.id === activeId);
    const newIndex = filteredItems.findIndex(item => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    setAllItems(prevItems => {
      const newItems = [...prevItems];
      const reorderedFiltered = [...filteredItems];
      const [movedItem] = reorderedFiltered.splice(oldIndex, 1);
      reorderedFiltered.splice(newIndex, 0, movedItem);

      reorderedFiltered.forEach((item) => {
        const globalIndex = newItems.findIndex(i => i.id === item.id);
        if (globalIndex !== -1) {
          newItems[globalIndex] = { ...item };
        }
      });

      return newItems;
    });
  }, [filteredItems]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!name.trim()) {
      showToast('請輸入名稱', 'warning');
      return;
    }

    if (pickedCategories.length === 0) {
      showToast('請至少選擇一個類別', 'warning');
      return;
    }

    try {
      new URL(link);
    } catch {
      showToast('請輸入有效的連結 URL', 'warning');
      return;
    }

    const now = new Date();
    const ts = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (isEditing && currentEditId) {
      setAllItems(prev => prev.map(i =>
        i.id === currentEditId
          ? { ...i, name, link, categories: pickedCategories, imageName: imageName || i.imageName, imageUrl: imageUrl || i.imageUrl }
          : i
      ));
      showToast('項目已更新', 'success');
    } else {
      setAllItems(prev => [{
        id: 'media-' + Date.now(),
        name,
        link,
        categories: pickedCategories,
        imageName,
        imageUrl,
        status: 'published',
        timestamp: ts
      }, ...prev]);
      showToast('項目已新增', 'success');
    }

    setShowModal(false);
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

    setImageName(file.name);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleDeleteClick = (id) => {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    const newStatus = item.status === 'published' ? 'archived' : 'published';
    setAllItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    showToast(newStatus === 'archived' ? '項目已封存' : '項目已恢復', 'success');
  };

  const showChildFilter = parentFilter === '全部'
    ? childOptions.length > 0
    : !!menuItems[parentFilter]?.hasSubMenu && childOptions.length > 0;

  // 將類別攤平成 parent/sub 顯示
  const flatCategoryOptions = useMemo(() => {
    const arr = [];
    Object.entries(menuItems).forEach(([parent, cfg]) => {
      if (cfg.hasSubMenu) {
        cfg.subItems.forEach(sub => arr.push({
          key: parent + '>' + sub,
          label: parent + '/' + sub
        }));
      } else {
        arr.push({ key: parent, label: parent });
      }
    });
    return arr;
  }, [menuItems]);

  // 定義表格欄位
  const columns = useMemo(() => [
    {
      id: 'edit',
      header: '編輯',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <button className="admin-action-btn edit-btn" onClick={() => openEdit(row.original)}>
          <img src={editIcon} alt="編輯" className="admin-action-icon" />
        </button>
      )
    },
    {
      id: 'category',
      header: '類別',
      enableSorting: false,
      cell: ({ row }) => (
        row.original.mainCategory
          ? (row.original.subCategory
            ? `${row.original.mainCategory} > ${row.original.subCategory}`
            : row.original.mainCategory)
          : (row.original.categories && row.original.categories.length > 0
            ? row.original.categories.join(', ')
            : '—')
      )
    },
    {
      accessorKey: 'name',
      header: '內容 (限20字)',
      enableSorting: true,
    },
    {
      accessorKey: 'link',
      header: '連結',
      enableSorting: false,
      cell: ({ row }) => (
        <a href={row.original.link} target="_blank" rel="noopener noreferrer">
          {row.original.link}
        </a>
      )
    },
    {
      id: 'image',
      header: '圖片',
      enableSorting: false,
      cell: ({ row }) => (
        (row.original.imageUrl || row.original.imageName) ? (
          <div className="image-preview-cell">
            <img src={jpgIconImage} alt="圖片" className="file-icon-img" />
            <span className="file-name-text">
              {row.original.imageName || row.original.imageUrl?.split('/').pop()?.split('.')[0] || '圖片'}
            </span>
          </div>
        ) : (
          <span className="text-muted">無</span>
        )
      )
    },
    {
      id: 'action',
      header: '操作',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <button
          className={row.original.status === 'archived' ? "admin-action-btn restore-btn" : "admin-action-btn delete-btn"}
          onClick={() => handleDeleteClick(row.original.id)}
        >
          <img src={row.original.status === 'archived' ? uturnIcon : deleteIcon} alt={row.original.status === 'archived' ? "恢復" : "刪除"} className="admin-action-icon" />
        </button>
      )
    },
    {
      accessorKey: 'timestamp',
      header: '建立時間',
      enableSorting: true,
    }
  ], []);

  return (
    <div className="admin-content-wrapper">
      <div className="admin-header-controls">
        <h5>
          首頁搜尋 &gt;
          {parentFilter !== '全部' && (
            <>
              {parentFilter}
              {childFilter !== '全部' && ` > ${childFilter}`}
            </>
          )}
          {parentFilter === '全部' && ' 媒體與社群資源'}
        </h5>
        <button className="btn btn-primary admin-add-button" onClick={openCreate}>
          <img src={addIcon} alt="新增" />
          新增項目
        </button>
      </div>

      <div className="admin-controls-row">
        <div className="filter-breadcrumb">
          <span className="breadcrumb-label">篩選：</span>
          <select
            className="form-select admin-filter-select"
            value={parentFilter}
            onChange={(e) => {
              setParentFilter(e.target.value);
              setChildFilter('全部');
            }}
          >
            <option value="全部">全部</option>
            {Object.keys(menuItems).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {showChildFilter && (
            <>
              <span className="breadcrumb-separator">&gt;</span>
              <select
                className="form-select admin-filter-select"
                value={childFilter}
                onChange={(e) => setChildFilter(e.target.value)}
              >
                <option value="全部">全部</option>
                {childOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="status-filter">
          <span>目前狀態：</span>
          <select
            className="form-select admin-status-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="published">目前公告</option>
            <option value="archived">歷史公告</option>
          </select>
        </div>
      </div>

      <AdminDataTable
        data={filteredItems}
        columns={columns}
        enableDragging={true}
        enableSorting={true}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyState={{ message: '暫無資料' }}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showModal}
        onClose={closeModal}
        title={isEditing ? '編輯項目' : '新增項目'}
        onSubmit={handleSubmit}
      >
        <div className="mb-3">
          <label className="form-label admin-form-label">*名稱</label>
          <input
            type="text"
            className={`form-control admin-form-control ${attemptedSubmit && !name.trim() ? 'is-invalid' : ''
              }`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label admin-form-label">
            *類別（至少勾選一個類別）
          </label>
          {flatCategoryOptions.length === 0 ? (
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              尚無可選分類
            </div>
          ) : (
            <div className="category-grid">
              {flatCategoryOptions.map(opt => (
                <label key={opt.key} className="form-check-label category-option">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={pickedCategories.includes(opt.key)}
                    onChange={() => togglePicked(opt.key)}
                  />
                  {' '}
                  {opt.label}
                </label>
              ))}
            </div>
          )}
          {attemptedSubmit && pickedCategories.length === 0 && (
            <div className="invalid-hint">請至少勾選一個類別</div>
          )}
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
            <span className="upload-hint">
              ※限 JPG、PNG 可上傳，限制 2MB。
            </span>
          </div>
          {(imageName || imageUrl) && (
            <div className="image-preview-cell" style={{ marginTop: 8 }}>
              <img src={jpgIconImage} alt="圖片" className="file-icon-img" />
              <span className="file-name-text">
                {imageName || imageUrl?.split('/').pop()?.split('.')[0] || '圖片'}
              </span>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label admin-form-label">*連結</label>
          <input
            type="url"
            className={`form-control admin-form-control ${attemptedSubmit && (() => {
                try {
                  new URL(link);
                  return false;
                } catch {
                  return true;
                }
              })() ? 'is-invalid' : ''
              }`}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminSocialmediaPage;
