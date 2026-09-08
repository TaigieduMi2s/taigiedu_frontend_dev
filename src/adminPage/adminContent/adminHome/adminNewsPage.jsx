import { useState, useEffect, useCallback, useMemo } from "react";
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '../../../components/Toast';
import AdminDataTable from '../../../components/AdminDataTable';
import AdminModal from '../../../components/AdminModal';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import { authenticatedFetch } from '../../../services/authService';
import { useAuth } from '../../../contexts/AuthContext';
import { FLAGS, hasFlag, getUserFlags } from '../../../config/permissions';
import ReadOnlyNotice from '../../../components/ReadOnlyNotice/ReadOnlyNotice';
import { useContentEditPermission, NO_EDIT_PERMISSION_MESSAGE } from '../../useContentEditPermission';
import './adminNewsPage.css';
import DragConfirmButton from '../../../components/DragConfirmButton/DragConfirmButton';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';

import envConfig from '../../../config';

const API_BASE_URL = envConfig.apiUrl;
const columnHelper = createColumnHelper();

const CONTENT_MAX_LENGTH = 20;

const AdminNewsPage = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  // SYSTEM_MANAGER 可省略快訊連結（其他人必填）
  const isLinkOptional = hasFlag(getUserFlags(user), FLAGS.SYSTEM_MANAGER);
  // 新增／修改／刪除僅限內容管理員，系統管理員只能檢視
  const canEditContent = useContentEditPermission();
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
  const [isDirty, setIsDirty] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // 下拉類別完全來自後端資料：取「目前公告」這些快訊的 category 去重，沒有任何前端寫死的清單。
  // 後端沒有獨立的類別表（category 只是每筆快訊上的字串欄位），所以在此新增的類別
  // 會跟著快訊一起存進後端，重新載入後自動出現在選單，所有人共用。
  // 刻意排除已下架的快訊，否則下架區的舊類別（教育部、成大…）會一直留在選單裡。
  const categories = useMemo(() => {
    const inUse = allNews
      .filter(item => item.status === 'published')
      .map(item => item.category)
      .filter(Boolean);
    return [...new Set(inUse)];
  }, [allNews]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // CustomSelect 靠 options 反查要顯示的文字，所以「已選定但還沒隨快訊送出」的新類別
  // 也必須放進選項，否則下拉會找不到對應項目而退回顯示 placeholder。
  const categoryOptions = useMemo(() => {
    const names = newCategory && !categories.includes(newCategory)
      ? [...categories, newCategory]
      : categories;
    return [
      ...names.map((cat) => ({ value: cat, label: cat })),
      { value: '__add_new__', label: '＋ 新增項目' },
    ];
  }, [categories, newCategory]);

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
        status: (item.status === 'publish' || item.status === 'published') ? 'published' : (item.status === 'archive' || item.status === 'archived' || item.status === 'deleted') ? 'archived' : item.status,
      }));

      const sortByTimestampDesc = (a, b) => {
        if (a.timestamp === 'N/A') return 1;
        if (b.timestamp === 'N/A') return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      };

      // 前後台一律「由新到舊」排序（TAIGIE-254）。
      // 前台 POST /info/news 是照日期新到舊輸出（同日期再依 id），這裡用同一套規則即可對齊：
      // sort 是穩定排序，而 API 回傳本身是 seq／id 遞增，所以同日期的先後也會跟前台一致。
      // ⚠️ 舊版還會再蓋上一份存在 localStorage 的順序，那份順序只存在單一瀏覽器，
      //    換一台電腦看後台、或看前台都是另一種順序——這正是前後台對不起來的成因，已移除。
      // ⚠️ 也不要改成「照 API 回傳的順序顯示」：/admin/main-search/news 是照 seq（建立順序）遞增，
      //    等於由舊到新，跟前台相反。後端的 seq 目前沒有被 /info/news 使用，詳見 TAIGIE-254 的討論。
      const publishedItems = [...formatted.filter(f => f.status === 'published')].sort(sortByTimestampDesc);
      const otherItems = formatted.filter(f => f.status !== 'published').sort(sortByTimestampDesc);

      setAllNews([...publishedItems, ...otherItems]);
      return publishedItems;
    } catch (error) {
      showToast(`載入最新消息失敗: ${error.message}`, 'error');
      setAllNews([]);
      setError(error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 刪除/恢復按鈕點擊
  const handleDeleteClick = useCallback(async (itemId) => {
    if (!canEditContent) {
      showToast(NO_EDIT_PERMISSION_MESSAGE, 'warning');
      return;
    }
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
  }, [statusFilter, canEditContent, showToast, fetchNews]);

  // 使用 useMemo 定義表格欄位
  const columns = useMemo(() => {
    const isArchived = statusFilter === 'archived';

    return [
      // 編輯按鈕欄位（刪除紀錄不需要修改功能；無編輯權限時也不顯示）
      !isArchived && canEditContent && columnHelper.display({
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
      // 刪除/恢復按鈕欄位（無編輯權限時不顯示）
      canEditContent && columnHelper.display({
        id: 'delete',
        size: 50,
        enableSorting: false,
        header: isArchived ? '復原' : '刪除',
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
    ].filter(Boolean);
  }, [statusFilter, canEditContent, handleEditClick, handleDeleteClick]);

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

    setIsDirty(true);
  }, [newsList]);

  // 把一份清單的順序寫回後端（前台 /info/news 就是讀這個順序）
  const saveOrder = useCallback(async (list) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/news/change`, {
      method: 'POST',
      body: JSON.stringify({ ids: list.map(item => String(item.id)) }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || '排序更新失敗');
    }
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    setIsSavingOrder(true);
    try {
      await saveOrder(newsList);
      showToast('順序已成功更新！', 'success');
      setIsDirty(false);
    } catch (error) {
      showToast(`排序更新失敗: ${error.message}`, 'error');
      fetchNews();
      setIsDirty(false);
    } finally {
      setIsSavingOrder(false);
    }
  }, [newsList, saveOrder, showToast, fetchNews]);

  // 取消未儲存的拖曳結果：重新抓一次後端順序即可還原
  const handleCancelOrder = useCallback(async () => {
    setIsDirty(false);
    await fetchNews();
  }, [fetchNews]);

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
    if (!canEditContent) {
      showToast(NO_EDIT_PERMISSION_MESSAGE, 'warning');
      return;
    }
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
  };

  // 新增類別：只套用到這筆快訊，送出後由 fetchNews 帶回，才會出現在下拉清單
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('此類別已存在，請直接從下拉選單選擇', 'warning');
      return;
    }
    setNewCategory(trimmed);
    setShowNewCategoryInput(false);
    setNewCategoryInput('');
  };

  // 處理類別下拉選擇
  const handleCategorySelect = (val) => {
    if (val === '__add_new__') {
      setShowNewCategoryInput(true);
      setNewCategory('');
    } else {
      setShowNewCategoryInput(false);
      setNewCategory(val);
    }
  };

  // 註：原本這裡有「修改類別名稱」功能，但後端沒有類別 API，改名只改到前端 state，
  // 重整就還原，等同假功能，故移除。要改名請逐筆編輯該類別下的快訊。

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!canEditContent) {
      showToast(NO_EDIT_PERMISSION_MESSAGE, 'warning');
      return;
    }
    // 必填驗證：SYSTEM_MANAGER 的連結為非必填，其餘身分連結必填
    if (!newCategory || !newContent || (!isLinkOptional && !newLink)) {
      showToast('請填寫所有必填欄位', 'warning');
      return;
    }
    if (newContent.length > CONTENT_MAX_LENGTH) {
      showToast(`內容不可超過 ${CONTENT_MAX_LENGTH} 字`, 'warning');
      return;
    }
    // 若有填入連結，統一驗證格式
    if (newLink) {
      try {
        new URL(newLink);
      } catch {
        showToast('請輸入有效的 URL', 'warning');
        return;
      }
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

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  return (
    <div className="admin-test-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">
          首頁搜尋 &gt; 活動快訊 &gt;
          <span>{statusFilter === 'published' ? "目前公告" : "刪除紀錄"}</span>
        </h5>
        <div className="admin-controls-row">
          {/* 刪除紀錄不需要新增項目功能；無編輯權限時也不顯示 */}
          {statusFilter !== 'archived' && canEditContent && (
            <button className="btn btn-primary me-3 admin-add-button" onClick={handleAddClick}>
              <img src={addIcon} alt="新增項目" />
              新增項目
            </button>
          )}
          <div className="status-filter">
            <span className="me-2 text-secondary">目前狀態：</span>
            <CustomSelect
              size="sm"
              className="cs-w-md"
              options={[
                { value: 'published', label: '目前公告' },
                { value: 'archived', label: '刪除紀錄' },
              ]}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>
      </div>

      <ReadOnlyNotice show={!canEditContent} />

      {/* 使用 AdminDataTable 組件 */}
      <AdminDataTable
        data={newsList}
        columns={columns}
        enableSorting={statusFilter !== 'archived'}
        enableDragging={statusFilter !== 'archived' && canEditContent}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        error={error}
        onRetry={fetchNews}
        emptyState={{ message: '目前沒有快訊資料' }}
      />
      <DragConfirmButton
        visible={isDirty && statusFilter === 'published'}
        onClick={handleConfirmOrder}
        onCancel={handleCancelOrder}
        isLoading={isSavingOrder}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        title={isEditing ? '編輯項目' : '新增項目'}
        onSubmit={handleFormSubmit}
        size="lg"
      >
        <div className="admin-form-grid">
        <div className="mb-3 admin-form-grid-full">
          <label htmlFor="newCategory" className="form-label admin-form-label">
            *類別
          </label>
          <div className="news-category-select-row">
            <CustomSelect
              size="sm"
              id="newCategory"
              options={categoryOptions}
              value={showNewCategoryInput ? '__add_new__' : (newCategory || null)}
              placeholder="請選擇類別"
              onChange={handleCategorySelect}
            />
          </div>
          {showNewCategoryInput && (
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
            maxLength={CONTENT_MAX_LENGTH}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newLink" className="form-label admin-form-label">
            {isLinkOptional ? '連結（選填）' : '*連結'}
          </label>
          <input
            type="url"
            className="form-control admin-form-control"
            id="newLink"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            required={!isLinkOptional}
          />
        </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminNewsPage;
