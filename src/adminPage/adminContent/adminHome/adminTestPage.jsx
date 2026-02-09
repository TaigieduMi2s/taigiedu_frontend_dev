import { useState, useEffect, useCallback, useMemo } from "react";
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '../../../components/Toast';
import AdminDataTable from '../../../components/AdminDataTable';
import AdminModal from '../../../components/AdminModal';
import './adminTestPage.css';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';


const columnHelper = createColumnHelper();

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
            ? "確定要復原此筆已刪除的公告嗎？"
            : "確定要刪除此筆目前公告嗎？";

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setAllTestInfo(prevInfo => {
                const updatedInfo = prevInfo.map(item =>
                    item.id === itemId
                        ? { ...item, status: isRestoreAction ? 'published' : 'archived' }
                        : item
                );
                return updatedInfo;
            });

            const successMessage = isRestoreAction
                ? '公告已成功復原！'
                : '目前公告已成功刪除！';

            showToast(successMessage, 'success');
        } catch (error) {
            console.error(isRestoreAction ? "復原失敗:" : "刪除失敗:", error);
            showToast(`${isRestoreAction ? "復原" : "刪除"}失敗: ${error.message}`, 'error');
        }
    }, [statusFilter, showToast]);

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
    const handleDragEnd = useCallback((activeId, overId) => {
        if (!overId) return;

        setTestInfo((items) => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);

            if (oldIndex === -1 || newIndex === -1) return items;

            const newItems = [...items];
            const [removed] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, removed);

            // 同步更新 allTestInfo 的順序
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

            return newItems;
        });
    }, []);

    const fetchTestInfo = useCallback(() => {
        setIsLoading(true);
        setError(null);

        // 模擬 API 請求延遲
        setTimeout(() => {
            try {
                // 固定的測試資料
                const mockData = [
                    {
                        id: 1,
                        category: "教育部",
                        title: "112年度台語能力認證考試",
                        url: "https://example.com/test1",
                        timestamp: "2024/03/15 10:30:00",
                        status: "published"
                    },
                    {
                        id: 2,
                        category: "成大",
                        title: "台語文學測驗報名開始",
                        url: "https://example.com/test2",
                        timestamp: "2024/03/14 14:20:00",
                        status: "published"
                    },
                    {
                        id: 3,
                        category: "教育部",
                        title: "台語教學師資培訓課程",
                        url: "https://example.com/test3",
                        timestamp: "2024/03/13 09:15:00",
                        status: "published"
                    },
                    {
                        id: 4,
                        category: "成大",
                        title: "台語語音學研習營",
                        url: "https://example.com/test4",
                        timestamp: "2024/03/12 16:45:00",
                        status: "published"
                    },
                    {
                        id: 5,
                        category: "教育部",
                        title: "已刪除的測試公告1",
                        url: "https://example.com/deleted1",
                        timestamp: "2024/03/11 11:30:00",
                        status: "archived"
                    },
                    {
                        id: 6,
                        category: "成大",
                        title: "已刪除的測試公告2",
                        url: "https://example.com/deleted2",
                        timestamp: "2024/03/10 15:20:00",
                        status: "archived"
                    }
                ];

                console.log("使用模擬資料:", mockData);

                if (Array.isArray(mockData)) {
                    const formattedData = mockData.map(item => ({
                        id: item.id,
                        category: item.category,
                        content: item.title,
                        link: item.url,
                        timestamp: item.timestamp || 'N/A',
                        status: item.status || 'published'
                    }));
                    setAllTestInfo(formattedData);
                } else {
                    console.error("模擬資料格式錯誤:", mockData);
                    setTestInfo([]);
                    setError("考試資訊載入失敗，請稍後再試。");
                }
            } catch (error) {
                showToast(`載入考試資訊失敗: ${error.message}`, 'error');
                setTestInfo([]);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    }, [showToast]);

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
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

        if (isEditing && currentEditItem) {
            setAllTestInfo(prevInfo => prevInfo.map(item =>
                item.id === currentEditItem.id
                    ? { ...item, category: newCategory, content: newContent, link: newLink }
                    : item
            ));
            showToast('公告已成功更新！', 'success');
        } else {
            const newId = 'new-' + Date.now();
            const newItem = {
                id: newId,
                category: newCategory,
                content: newContent,
                link: newLink,
                timestamp: timestamp,
                status: 'published'
            };
            setAllTestInfo(prevInfo => [newItem, ...prevInfo]);
            showToast('新公告已成功新增！', 'success');
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