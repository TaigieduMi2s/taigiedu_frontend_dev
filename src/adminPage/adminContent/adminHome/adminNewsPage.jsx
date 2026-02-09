import { useState, useEffect, useCallback, useMemo } from "react";
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '../../../components/Toast';
import AdminDataTable from '../../../components/AdminDataTable';
import AdminModal from '../../../components/AdminModal';
import './adminNewsPage.css';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';

const columnHelper = createColumnHelper();

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

  // 編輯按鈕點擊
  const handleEditClick = useCallback((item) => {
    setIsEditing(true);
    setCurrentEditItem(item);
    setNewCategory(item.category);
    setNewContent(item.content);
    setNewLink(item.link);
    setShowAddModal(true);
  }, []);

  // 刪除/恢復按鈕點擊
  const handleDeleteClick = useCallback((itemId) => {
    const isRestoreAction = statusFilter === 'archived';

    const confirmMessage = isRestoreAction
      ? "確定要復原此筆已下架的快訊嗎？"
      : "確定要下架此筆快訊嗎？";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setAllNews(prevInfo => {
        const updatedInfo = prevInfo.map(item =>
          item.id === itemId
            ? { ...item, status: isRestoreAction ? 'published' : 'archived' }
            : item
        );
        return updatedInfo;
      });

      const successMessage = isRestoreAction
        ? '快訊已成功復原！'
        : '快訊已成功下架！';

      showToast(successMessage, 'success');
    } catch (error) {
      console.error(isRestoreAction ? "復原失敗:" : "下架失敗:", error);
      showToast(`${isRestoreAction ? "復原" : "下架"}失敗: ${error.message}`, 'error');
    }
  }, [statusFilter, showToast]);

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
  const handleDragEnd = useCallback((activeId, overId) => {
    if (!overId) return;

    setNewsList((items) => {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);

      if (oldIndex === -1 || newIndex === -1) return items;

      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);

      // 同步更新 allNews 的順序
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

      return newItems;
    });
  }, []);

  const fetchNews = useCallback(() => {
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const mockData = [
          { id: 1, category: "教育部", title: "台語教學推廣最新活動", url: "https://example.com/news1", timestamp: "2024/03/15 10:30:00", status: "published" },
          { id: 2, category: "成大", title: "語言文化研討會報名", url: "https://example.com/news2", timestamp: "2024/03/14 14:20:00", status: "published" },
          { id: 3, category: "教育部", title: "教材更新公告", url: "https://example.com/news3", timestamp: "2024/03/13 09:15:00", status: "published" },
          { id: 4, category: "成大", title: "校園活動速報", url: "https://example.com/news4", timestamp: "2024/03/12 16:45:00", status: "published" },
          { id: 5, category: "教育部", title: "已下架的快訊1", url: "https://example.com/archive1", timestamp: "2024/03/11 11:30:00", status: "archived" },
          { id: 6, category: "成大", title: "已下架的快訊2", url: "https://example.com/archive2", timestamp: "2024/03/10 15:20:00", status: "archived" }
        ];

        const formattedData = mockData.map(item => ({
          id: item.id,
          category: item.category,
          content: item.title,
          link: item.url,
          timestamp: item.timestamp || 'N/A',
          status: item.status || 'published'
        }));
        setAllNews(formattedData);
      } catch (error) {
        showToast(`載入最新消息失敗: ${error.message}`, 'error');
        setNewsList([]);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [showToast]);

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
  };

  const handleFormSubmit = (event) => {
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
    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (isEditing && currentEditItem) {
      setAllNews(prevInfo => prevInfo.map(item =>
        item.id === currentEditItem.id
          ? { ...item, category: newCategory, content: newContent, link: newLink }
          : item
      ));
      showToast('快訊已成功更新！', 'success');
    } else {
      const newId = 'news-' + Date.now();
      const newItem = {
        id: newId,
        category: newCategory,
        content: newContent,
        link: newLink,
        timestamp: timestamp,
        status: 'published'
      };
      setAllNews(prevInfo => [newItem, ...prevInfo]);
      showToast('新快訊已成功新增！', 'success');
    }
    handleModalClose();
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  return (
    <div className="admin-test-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">
          首頁搜尋 &gt; 最新消息 &gt;
          <span>{statusFilter === 'published' ? "目前快訊" : "下架記錄"}</span>
        </h5>
        <div className="admin-controls-row">
          <button className="btn btn-primary me-3 admin-add-button" onClick={handleAddClick}>
            <img src={addIcon} alt="新增快訊" />
            新增快訊
          </button>
          <div className="status-filter">
            <span className="me-2 text-secondary">目前狀態：</span>
            <select
              className="form-select admin-status-dropdown"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="published">目前快訊</option>
              <option value="archived">下架記錄</option>
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
        title={isEditing ? '編輯快訊' : '新增快訊'}
        onSubmit={handleFormSubmit}
      >
        <div className="mb-3">
          <label htmlFor="newCategory" className="form-label admin-form-label">
            *類別
          </label>
          <select
            className="form-select admin-form-control"
            id="newCategory"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          >
            <option value="" disabled>請選擇類別</option>
            <option value="教育部">教育部</option>
            <option value="成大">成大</option>
          </select>
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
