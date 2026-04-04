import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from '../../../components/Toast';
import { authenticatedFetch } from '../../../services/authService';
import AdminDataTable from '../../../components/AdminDataTable';
import AdminModal from '../../../components/AdminModal';
import './adminTestPage.css';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dev.taigiedu.com/backend';

const AdminTestPage = () => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allTestInfo, setAllTestInfo] = useState([]);
    const [testInfo, setTestInfo] = useState([]);
    const [statusFilter, setStatusFilter] = useState('published');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newLink, setNewLink] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentEditItem, setCurrentEditItem] = useState(null);

    const fetchTestInfo = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/test`);
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
            setAllTestInfo(formatted);
        } catch (error) {
            showToast(`載入考試資訊失敗: ${error.message}`, 'error');
            setAllTestInfo([]);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

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
    const handleDeleteClick = useCallback(async (itemId) => {
        const isRestoreAction = statusFilter === 'archived';

        const confirmMessage = isRestoreAction
            ? "確定要復原此筆已刪除的公告嗎？"
            : "確定要刪除此筆目前公告嗎？";

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/test/modify`, {
                method: 'POST',
                body: JSON.stringify({ id: String(itemId), action: isRestoreAction ? '2' : '1' }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || '操作失敗');
            showToast(isRestoreAction ? '公告已成功復原！' : '公告已成功刪除！', 'success');
            await fetchTestInfo();
        } catch (error) {
            console.error(isRestoreAction ? "復原失敗:" : "刪除失敗:", error);
            showToast(`${isRestoreAction ? "復原" : "刪除"}失敗: ${error.message}`, 'error');
        }
    }, [statusFilter, showToast, fetchTestInfo]);

    // 定義表格欄位
    const columns = useMemo(() => {
        const isArchived = statusFilter === 'archived';

        return [
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
                accessorKey: 'category',
                header: '類別',
                enableSorting: true,
            },
            {
                accessorKey: 'content',
                header: '內容 (限20字)',
                enableSorting: true,
            },
            {
                accessorKey: 'link',
                header: '連結',
                enableSorting: true,
                cell: info => (
                    <a href={info.getValue()} target="_blank" rel="noopener noreferrer" className="admin-link">
                        {info.getValue()}
                    </a>
                ),
            },
            {
                id: 'action',
                header: '刪除',
                size: 50,
                enableSorting: false,
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
                )
            },
            {
                accessorKey: 'timestamp',
                header: '建立時間',
                enableSorting: true,
            }
        ];
    }, [statusFilter, handleEditClick, handleDeleteClick]);

    // 拖曳結束處理
    const handleDragEnd = useCallback(async (activeId, overId) => {
        if (!overId) return;

        const oldIndex = testInfo.findIndex(item => item.id === activeId);
        const newIndex = testInfo.findIndex(item => item.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = [...testInfo];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);

        setTestInfo(reordered);
        setAllTestInfo(prevAllInfo => {
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

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/test/change`, {
                method: 'POST',
                body: JSON.stringify({ ids: reordered.map(item => String(item.id)) }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || '排序更新失敗');
        } catch (error) {
            showToast(`排序更新失敗: ${error.message}`, 'error');
            fetchTestInfo();
        }
    }, [testInfo, showToast, fetchTestInfo]);


    useEffect(() => {
        fetchTestInfo();
    }, [fetchTestInfo]);

    // 根據狀態篩選資料
    useEffect(() => {
        if (allTestInfo.length > 0 || isLoading === false) {
            const filteredData = allTestInfo.filter(item => item.status === statusFilter);
            setTestInfo(filteredData);
        }
    }, [allTestInfo, statusFilter, isLoading]);

    // 新增功能
    const handleAddClick = () => {
        if (testInfo.length >= 12 && statusFilter === 'published') {
            showToast('目前公告數量已滿12個項目，請先到目前公告刪除一個公告再進行上傳。', 'warning');
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
                const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/test/modify`, {
                    method: 'POST',
                    body: JSON.stringify({ id: String(currentEditItem.id), action: '3', category: newCategory, content: newContent, link: newLink }),
                });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || '更新失敗');
                showToast('公告已成功更新！', 'success');
            } else {
                const response = await authenticatedFetch(`${API_BASE_URL}/admin/main-search/test/add`, {
                    method: 'POST',
                    body: JSON.stringify({ category: newCategory, content: newContent, link: newLink }),
                });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || '新增失敗');
                showToast('新公告已成功新增！', 'success');
            }
            handleModalClose();
            await fetchTestInfo();
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
                    首頁搜尋 &gt; 考試資訊 &gt;
                    <span>{statusFilter === 'published' ? "目前公告" : "刪除記錄"}</span>
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
                            <option value="published">目前公告</option>
                            <option value="archived">刪除紀錄</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 使用 AdminDataTable 組件 */}
            <AdminDataTable
                data={testInfo}
                columns={columns}
                enableSorting={true}
                enableDragging={true}
                onDragEnd={handleDragEnd}
                isLoading={isLoading}
                error={error}
                onRetry={fetchTestInfo}
                emptyState={{ message: '目前沒有公告資料' }}
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

export default AdminTestPage;