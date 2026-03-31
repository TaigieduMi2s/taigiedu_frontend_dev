import { useState, useEffect, useCallback, useMemo } from "react";
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '../../../components/Toast';
import AdminDataTable from '../../../components/AdminDataTable';
import AdminModal from '../../../components/AdminModal';
import { authenticatedFetch } from '../../../services/authService';
import './adminNewsPage.css';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dev.taigiedu.com/backend';
const columnHelper = createColumnHelper();

const NEWS_CATEGORIES_KEY = 'newsCategories';
const DEFAULT_CATEGORIES = ['教育部', '成大'];

function loadCategories() {
  try {
    const raw = localStorage.getItem(NEWS_CATEGORIES_KEY);
    if (!raw) return [...DEFAULT_CATEGORIES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_CATEGORIES];
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

function saveCategories(cats) {
  localStorage.setItem(NEWS_CATEGORIES_KEY, JSON.stringify(cats));
}

const AdminNewsPage = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allNews, setAllNews] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('published');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);

  // 動態類別管理
  const [categories, setCategories] = useState(loadCategories);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategoryInput, setEditCategoryInput] = useState('');

  // 編輯按鈕點擊
  const handleEditClick = useCallback((item) => {
    setIsEditing(true);
    setCurrentEditItem(item);
    setNewCategory(item.category);
    setNewContent(item.content);
    setNewLink(item.link);
    setShowAddModal(true);
  }, []);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/news`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '載入失敗');
      }
      const formatted = result.data.map(item => ({
        id: item.id,
        category: item.category,
        content: item.content,
        link: item.link,
        timestamp: item.timestamp || 'N/A',
        status: item.status === 'publish' ? 'published' : item.status === 'archive' ? 'archived' : item.status,
      }));
      setAllNews(formatted);
    } catch (error) {
      showToast(`載入最新消息失敗: ${error.message}`, 'error');
      setAllNews([]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 刪除/恢復按鈕點擊
  const handleDeleteClick = useCallback(async (itemId) => {
    const isRestoreAction = statusFilter === 'archived';

    const confirmMessage = isRestoreAction
      ? "確定要復原此筆已下架的快訊嗎？"
      : "確定要下架此筆快訊嗎？";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/news/modify`, {
        method: 'POST',
        body: JSON.stringify({
          id: String(itemId),
          action: isRestoreAction ? '2' : '1',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '操作失敗');
      }
      showToast(isRestoreAction ? '快訊已成功復原！' : '快訊已成功下架！', 'success');
      await fetchNews();
    } catch (error) {
      console.error(isRestoreAction ? "復原失敗:" : "下架失敗:", error);
      showToast(`${isRestoreAction ? "復原" : "下架"}失敗: ${error.message}`, 'error');
    }
  }, [statusFilter, showToast, fetchNews]);

  // 使用 useMemo 定義表格欄位
  const columns = useMemo(() => {
    const isArchived = statusFilter === 'archived';

    return [
      // 編輯按鈕欄位
      columnHelper.display({
        id: 'edit',
        size: 50,
        enableSorting: false,
        header: '修改',
        cell: ({ row }) => (
          <button
            className="admin-action-btn edit-btn"
            onClick={() => handleEditClick(row.original)}
          >
            <img src={editIcon} alt="編輯" className="admin-action-icon" />
          </button>
        ),
      }),
      // 類別欄位
      columnHelper.accessor('category', {
        header: '類別',
        cell: info => info.getValue(),
        enableSorting: true,
      }),
      // 內容欄位
      columnHelper.accessor('content', {
        header: '內容 (限20字)',
        cell: info => info.getValue(),
        enableSorting: true,
      }),
      // 連結欄位
      columnHelper.accessor('link', {
        header: '連結',
        cell: info => (
          <a href={info.getValue()} target="_blank" rel="noopener noreferrer">
            {info.getValue()}
          </a>
        ),
        enableSorting: true,
      }),
      // 刪除/恢復按鈕欄位
      columnHelper.display({
        id: 'delete',
        size: 50,
        enableSorting: false,
        header: '刪除',
        cell: ({ row }) => (
          <button
            className={isArchived ? "admin-action-btn restore-btn" : "admin-action-btn delete-btn"}
            onClick={() => handleDeleteClick(row.original.id)}
          >
            <img
              src={isArchived ? uturnIcon : deleteIcon}
              alt={isArchived ? "恢復" : "刪除"}
              className="admin-action-icon"
            />
          </button>
        ),
      }),
      // 建立時間欄位
      columnHelper.accessor('timestamp', {
        header: '建立時間',
        cell: info => info.getValue(),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.timestamp);
          const dateB = new Date(rowB.original.timestamp);
          return dateA.getTime() - dateB.getTime();
        },
      }),
    ];
  }, [statusFilter, handleEditClick, handleDeleteClick]);

  // 拖曳結束處理
  const handleDragEnd = useCallback(async (activeId, overId) => {
    if (!overId) return;

    const oldIndex = newsList.findIndex(item => item.id === activeId);
    const newIndex = newsList.findIndex(item => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // 計算新順序
    const reordered = [...newsList];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);

    // 樂觀更新本地狀態
    setNewsList(reordered);
    setAllNews(prevAllInfo => {
      const tempAllInfo = [...prevAllInfo];
      const activeItemInAll = tempAllInfo.find(item => item.id === activeId);
      const overItemInAll = tempAllInfo.find(item => item.id === overId);
      if (!activeItemInAll || !overItemInAll) return prevAllInfo;
      const oldAllIndex = tempAllInfo.indexOf(activeItemInAll);
      const newAllIndex = tempAllInfo.indexOf(overItemInAll);
      const [removedAll] = tempAllInfo.splice(oldAllIndex, 1);
      tempAllInfo.splice(newAllIndex, 0, removedAll);
      return tempAllInfo;
    });

    // 通知後端新順序
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/news/change`, {
        method: 'POST',
        body: JSON.stringify({ ids: reordered.map(item => String(item.id)) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '排序更新失敗');
      }
    } catch (error) {
      showToast(`排序更新失敗: ${error.message}`, 'error');
      fetchNews(); // 回滾到後端真實順序
    }
  }, [newsList, showToast, fetchNews]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 根據狀態篩選資料
  useEffect(() => {
    if (allNews.length > 0 || isLoading === false) {
      const filteredData = allNews.filter(item => item.status === statusFilter);
      setNewsList(filteredData);
    }
  }, [allNews, statusFilter, isLoading]);

  // 新增功能
  const handleAddClick = () => {
    if (newsList.length >= 12 && statusFilter === 'published') {
      showToast('目前快訊數量已滿12個項目，請先刪除一個再新增。', 'warning');
      return;
    }
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setCurrentEditItem(null);
    setNewCategory('');
    setNewContent('');
    setNewLink('');
    setShowNewCategoryInput(false);
    setNewCategoryInput('');
    setIsEditingCategory(false);
    setEditCategoryInput('');
  };

  // 新增類別
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('此類別已存在', 'warning');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    saveCategories(updated);
    setNewCategory(trimmed);
    setShowNewCategoryInput(false);
    setNewCategoryInput('');
  };

  // 處理類別下拉選擇
  const handleCategorySelect = (e) => {
    const val = e.target.value;
    if (val === '__add_new__') {
      setShowNewCategoryInput(true);
      setIsEditingCategory(false);
      setNewCategory('');
    } else {
      setShowNewCategoryInput(false);
      setIsEditingCategory(false);
      setNewCategory(val);
    }
  };

  // 開始編輯類別名稱
  const handleStartEditCategory = () => {
    if (!newCategory || newCategory === '__add_new__') {
      showToast('請先選擇一個類別再修改', 'warning');
      return;
    }
    setIsEditingCategory(true);
    setEditCategoryInput(newCategory);
    setShowNewCategoryInput(false);
  };

  // 確認修改類別名稱
  const handleConfirmEditCategory = () => {
    const trimmed = editCategoryInput.trim();
    if (!trimmed) return;
    if (trimmed === newCategory) {
      setIsEditingCategory(false);
      return;
    }
    if (categories.includes(trimmed)) {
      showToast('此類別名稱已存在', 'warning');
      return;
    }
    const oldName = newCategory;
    const updated = categories.map(c => c === oldName ? trimmed : c);
    setCategories(updated);
    saveCategories(updated);
    // 同步更新所有使用舊類別名稱的快訊
    setAllNews(prev => prev.map(item =>
      item.category === oldName ? { ...item, category: trimmed } : item
    ));
    setNewCategory(trimmed);
    setIsEditingCategory(false);
    setEditCategoryInput('');
    showToast(`類別已從「${oldName}」更新為「${trimmed}」`, 'success');
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!newCategory || !newContent || !newLink) {
      showToast('請填寫所有欄位', 'warning');
      return;
    }
    try {
      new URL(newLink);
    } catch {
      showToast('請輸入有效的 URL', 'warning');
      return;
    }

    try {
      if (isEditing && currentEditItem) {
        const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/news/modify`, {
          method: 'POST',
          body: JSON.stringify({
            id: String(currentEditItem.id),
            action: '3',
            category: newCategory,
            content: newContent,
            link: newLink,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '更新失敗');
        showToast('快訊已成功更新！', 'success');
      } else {
        const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/news/add`, {
          method: 'POST',
          body: JSON.stringify({
            category: newCategory,
            content: newContent,
            link: newLink,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '新增失敗');
        showToast('新快訊已成功新增！', 'success');
      }
      handleModalClose();
      await fetchNews();
    } catch (error) {
      showToast(`操作失敗: ${error.message}`, 'error');
    }
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  return (
    <div className="admin-test-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">
          首頁搜尋 &gt; 最新消息 &gt;
          <span>{statusFilter === 'published' ? "活動快訊" : "刪除紀錄"}</span>
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
              <option value="published">活動快訊</option>
              <option value="archived">刪除紀錄</option>
            </select>
          </div>
        </div>
      </div>

      {/* 使用 AdminDataTable 組件 */}
      <AdminDataTable
        data={newsList}
        columns={columns}
        enableSorting={true}
        enableDragging={true}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        error={error}
        onRetry={fetchNews}
        emptyState={{ message: '目前沒有快訊資料' }}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        title={isEditing ? '編輯項目' : '新增項目'}
        onSubmit={handleFormSubmit}
      >
        <div className="mb-3">
          <label htmlFor="newCategory" className="form-label admin-form-label">
            *類別
          </label>
          {isEditingCategory ? (
            <>
              <div className="news-edit-category-hint">
                確認後，系統將會把所有舊有的項目，同步更新為您修改的新項目。
              </div>
              <div className="news-add-category-row">
                <input
                  type="text"
                  className="form-control admin-form-control"
                  value={editCategoryInput}
                  onChange={(e) => setEditCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmEditCategory(); } }}
                  autoFocus
                />
                <button type="button" className="btn btn-primary news-add-category-btn" onClick={handleConfirmEditCategory}>確認</button>
              </div>
            </>
          ) : (
            <div className="news-category-select-row">
              <select
                className="form-select admin-form-control"
                id="newCategory"
                value={showNewCategoryInput ? '__add_new__' : newCategory}
                onChange={handleCategorySelect}
                required
              >
                <option value="" disabled>請選擇類別</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__add_new__">＋ 新增項目</option>
              </select>
              {newCategory && newCategory !== '__add_new__' && !showNewCategoryInput && (
                <button type="button" className="btn btn-primary news-add-category-btn" onClick={handleStartEditCategory}>修改</button>
              )}
            </div>
          )}
          {showNewCategoryInput && !isEditingCategory && (
            <div className="news-add-category-row">
              <input
                type="text"
                className="form-control admin-form-control"
                placeholder="輸入新類別名稱"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                autoFocus
              />
              <button type="button" className="btn btn-primary news-add-category-btn" onClick={handleAddCategory}>確認</button>
            </div>
          )}
        </div>
        <div className="mb-3">
          <label htmlFor="newContent" className="form-label admin-form-label">
            *內容 (限20字)
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newContent"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
          />
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
            required
          />
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminNewsPage;
