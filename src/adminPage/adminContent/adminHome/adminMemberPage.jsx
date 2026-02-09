import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from 'react-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '../../../components/Toast';
import AdminDataTable from '../../../components/AdminDataTable';
import '../../../components/AdminDataTable/AdminDataTable.css';
import AdminModal from '../../../components/AdminModal';
import './adminMemberPage.css';
import './adminMemberPage.css';
import adjustmentsIcon from '../../../assets/adjustments-horizontal.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';

const columnHelper = createColumnHelper();

// 超級管理員白名單（若後端提供 isSuperAdmin 欄位，亦會一起判斷）
const SUPER_ADMIN_WHITELIST = [
  'admin@example.com',
  'root@example.com'
];

/**
 * 操作欄位組件 - 解決 Hooks 順序問題
 */
const ActionCell = ({
  row,
  viewFilter,
  isSuperAdmin,
  handleDeleteClick,
  handleDisableUpload,
  handleAssignAdmin,
  activeMenuId,
  setActiveMenuId,
  menuPosition,
  setMenuPosition,
  adjustmentsIcon,
  uturnIcon
}) => {
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160;

      // Calculate left position, ensuring menu doesn't go off-screen
      let left = rect.right - menuWidth;

      // If menu would go off the left edge, align it to the left of the button
      if (left < 0) {
        left = rect.left;
      }

      // If menu would go off the right edge, adjust it
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 10; // 10px margin from edge
      }

      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: left + window.scrollX
      });
    }
    setActiveMenuId(activeMenuId === row.original.id ? null : row.original.id);
  };

  // 停用會員名單：顯示恢復按鈕
  if (viewFilter === 'archivedMembers') {
    return (
      <div className="action-menu-container">
        <button
          className="admin-action-btn restore-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(row.original.id);
          }}
          title="恢復上傳資格"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    );
  }

  // 會員名單與管理員名單：顯示下拉選單
  return (
    <div className="action-menu-container">
      {viewFilter === 'admins' && !isSuperAdmin ? (
        <button className="admin-action-btn menu-btn" disabled title="僅超級管理員可操作">
          <img src={adjustmentsIcon} alt="管理" className="admin-action-icon" style={{ opacity: 0.5 }} />
        </button>
      ) : (
        <>
          <button
            ref={buttonRef}
            className="admin-action-btn menu-btn"
            onClick={handleClick}
          >
            <img src={adjustmentsIcon} alt="管理" className="admin-action-icon" />
          </button>

          {activeMenuId === row.original.id && createPortal(
            <div
              className="action-menu-dropdown"
              style={{
                position: 'absolute',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 9999
              }}
            >
              <button
                className="action-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisableUpload(row.original);
                }}
              >
                停用上傳資格
              </button>
              <button
                className="action-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignAdmin(row.original);
                }}
              >
                指定擔任管理員
              </button>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const AdminMemberPage = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [memberList, setMemberList] = useState([]);
  // 視圖切換：admins（管理員名單）| members（會員名單）| archivedMembers（停用會員名單）
  const [viewFilter, setViewFilter] = useState('members');

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrganization, setNewOrganization] = useState('');
  const [newOccupation, setNewOccupation] = useState('');
  const [newMotivation, setNewMotivation] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // 停用上傳資格彈窗狀態
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableTarget, setDisableTarget] = useState(null);
  const [disableReason, setDisableReason] = useState('');
  const [disableNote, setDisableNote] = useState('');

  // 指定管理員彈窗狀態
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTarget, setAdminTarget] = useState(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 檢查是否點擊在選單容器或下拉選單內
      const isInsideContainer = event.target.closest('.action-menu-container');
      const isInsideDropdown = event.target.closest('.action-menu-dropdown');

      if (activeMenuId && !isInsideContainer && !isInsideDropdown) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // 判斷超級管理員：
  // 1) 從 localStorage 讀取 currentUser（若存在 isSuperAdmin=true，則為超管）
  // 2) 或 email 在白名單 SUPER_ADMIN_WHITELIST 中且角色為 admin
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isSuperAdmin = useMemo(() => {
    const email = currentUser?.email || '';
    const role = currentUser?.role || '';
    const flag = currentUser?.isSuperAdmin === true;
    return flag || (role === 'admin' && SUPER_ADMIN_WHITELIST.includes(email));
  }, [currentUser]);

  //（已移除獨立編輯入口）

  // 刪除/恢復按鈕點擊（停用/啟用）
  const handleDeleteClick = useCallback((itemId) => {
    // 管理員名單下僅允許超級管理員停用/啟用
    if (viewFilter === 'admins' && !isSuperAdmin) {
      showToast('僅超級管理員可停用/啟用管理員', 'warning');
      return;
    }

    const isRestoreAction = viewFilter === 'archivedMembers';

    // 直接執行，不使用 confirm 對話框

    try {
      setAllMembers(prevInfo => {
        const now = new Date();
        const archivedAt = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const updated = prevInfo.map(item => {
          if (item.id !== itemId) return item;
          if (isRestoreAction) {
            return { ...item, status: 'active', archivedReason: '', archivedAt: '' };
          }
          return { ...item, status: 'archived', archivedReason: item.archivedReason || '系統停用', archivedAt };
        });
        return updated;
      });

      const successMessage = isRestoreAction ? '帳號已成功啟用！' : '帳號已成功停用！';
      showToast(successMessage, 'success');
    } catch (error) {
      console.error(isRestoreAction ? "啟用失敗:" : "停用失敗:", error);
      showToast(`${isRestoreAction ? "啟用" : "停用"}失敗: ${error.message}`, 'error');
    }
  }, [viewFilter, isSuperAdmin, showToast]);

  // 停用上傳資格
  const handleDisableUpload = useCallback((member) => {
    // 開啟停用彈窗
    setDisableTarget(member);
    setDisableReason('');
    setDisableNote('');
    setShowDisableModal(true);
    setActiveMenuId(null);
  }, []);

  // 確認停用上傳資格
  const confirmDisableUpload = useCallback(() => {
    if (!disableReason) {
      showToast('請選擇停用理由', 'warning');
      return;
    }

    const now = new Date();
    const archivedAt = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const fullReason = disableNote ? `${disableReason}（${disableNote}）` : disableReason;

    setAllMembers(prevMembers => prevMembers.map(m =>
      m.id === disableTarget.id
        ? { ...m, status: 'archived', archivedReason: fullReason, archivedAt }
        : m
    ));
    showToast(`已停用 ${disableTarget.name} 的上傳資格`, 'success');
    setShowDisableModal(false);
    setDisableTarget(null);
  }, [disableTarget, disableReason, disableNote, showToast]);

  // 指定擔任管理員
  const handleAssignAdmin = useCallback((member) => {
    // 開啟確認彈窗
    setAdminTarget(member);
    setShowAdminModal(true);
    setActiveMenuId(null);
  }, []);

  // 確認指定擔任管理員
  const confirmAssignAdmin = useCallback(() => {
    setAllMembers(prevMembers => prevMembers.map(m =>
      m.id === adminTarget.id
        ? { ...m, role: 'admin' }
        : m
    ));
    showToast(`已將 ${adminTarget.name} 指定為管理員`, 'success');
    setShowAdminModal(false);
    setAdminTarget(null);
  }, [adminTarget, showToast]);

  // 欄位定義
  const columns = useMemo(() => {
    const isArchivedView = viewFilter === 'archivedMembers';
    if (isArchivedView) {
      // 停用會員名單欄位
      return [
        columnHelper.accessor('name', {
          header: '名稱',
          cell: info => info.getValue(),
          enableSorting: true,
        }),
        columnHelper.accessor('archivedReason', {
          header: '停用理由',
          cell: info => (<span className="text-truncate-cell">{info.getValue() || ''}</span>),
          enableSorting: true,
          size: 180,
        }),
        columnHelper.accessor('email', {
          header: '信箱',
          cell: info => (<a href={`mailto:${info.getValue()}`}>{info.getValue()}</a>),
          enableSorting: true,
        }),
        columnHelper.accessor('organization', {
          header: '服務單位',
          cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
          enableSorting: true,
          size: 180,
        }),
        columnHelper.accessor('occupation', {
          header: '職業',
          cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
          enableSorting: true,
          size: 160,
        }),
        columnHelper.accessor('motivation', {
          header: '使用網站動機',
          cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
          enableSorting: true,
          size: 220,
        }),
        columnHelper.accessor('archivedAt', {
          header: '停用時間',
          cell: info => info.getValue() || '',
          enableSorting: true,
          sortingFn: (rowA, rowB) => {
            const dateA = new Date(rowA.original.archivedAt || 0);
            const dateB = new Date(rowB.original.archivedAt || 0);
            return dateA.getTime() - dateB.getTime();
          },
        }),
        columnHelper.display({
          id: 'actions',
          size: 50,
          enableSorting: false,
          header: () => null,
          cell: ({ row }) => (
            <button className="admin-action-btn restore-btn" onClick={() => handleDeleteClick(row.original.id)}>
              <img src={uturnIcon} alt="啟用" className="admin-action-icon" />
            </button>
          ),
        }),
      ];
    }

    // 其他視圖欄位（管理員名單、會員名單）
    return [
      columnHelper.accessor('name', {
        header: '名稱',
        cell: info => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor('role', {
        header: '身份',
        cell: info => (info.getValue() === 'admin' ? '管理員' : '會員'),
        enableSorting: true,
        size: 120,
      }),
      columnHelper.accessor('email', {
        header: '信箱',
        cell: info => (<a href={`mailto:${info.getValue()}`}>{info.getValue()}</a>),
        enableSorting: true,
      }),
      columnHelper.accessor('organization', {
        header: '服務單位',
        cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
        enableSorting: true,
        size: 180,
      }),
      columnHelper.accessor('occupation', {
        header: '職業',
        cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
        enableSorting: true,
        size: 160,
      }),
      columnHelper.accessor('motivation', {
        header: '使用網站動機',
        cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
        enableSorting: true,
        size: 220,
      }),
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
      columnHelper.display({
        id: 'actions',
        size: 50,
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => (
          <ActionCell
            row={row}
            viewFilter={viewFilter}
            isSuperAdmin={isSuperAdmin}
            handleDeleteClick={handleDeleteClick}
            handleDisableUpload={handleDisableUpload}
            handleAssignAdmin={handleAssignAdmin}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            menuPosition={menuPosition}
            setMenuPosition={setMenuPosition}
            adjustmentsIcon={adjustmentsIcon}
            uturnIcon={uturnIcon}
          />
        ),
      }),
    ];
  }, [viewFilter, isSuperAdmin, handleDeleteClick, activeMenuId, handleDisableUpload, handleAssignAdmin]);

  // 拖曳結束處理（僅前端排序預覽）
  const handleDragEnd = useCallback((activeId, overId) => {
    if (!overId) return;
    setMemberList((items) => {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
      if (oldIndex === -1 || newIndex === -1) return items;
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      // 同步更新 allMembers 順序
      setAllMembers(prevAll => {
        const tempAll = [...prevAll];
        const activeItemInAll = tempAll.find(item => item.id === activeId);
        const overItemInAll = tempAll.find(item => item.id === overId);
        if (!activeItemInAll || !overItemInAll) return prevAll;
        const oldAllIndex = tempAll.indexOf(activeItemInAll);
        const newAllIndex = tempAll.indexOf(overItemInAll);
        const [removedAll] = tempAll.splice(oldAllIndex, 1);
        tempAll.splice(newAllIndex, 0, removedAll);
        return tempAll;
      });
      return newItems;
    });
  }, []);

  // 模擬載入會員資料
  const fetchMembers = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        const mockData = [
          { id: 1, name: "陳小明", email: "a123456@gmail.com", organization: "台南一中", occupation: "台語兼任教師", motivation: "備課需求", role: "member", timestamp: "2025/04/01 23:55:00", status: "active" },
          { id: 2, name: "李小華", email: "hua@example.com", organization: "台北市教育局", occupation: "教研員", motivation: "教材製作", role: "admin", timestamp: "2024/03/14 14:20:00", status: "active" },
          { id: 3, name: "王超管", email: "admin@example.com", organization: "系統管理部", occupation: "系統管理員", motivation: "平台維護", role: "admin", timestamp: "2024/03/13 09:15:00", status: "active" },
          { id: 4, name: "林小美", email: "mei@example.com", organization: "高雄女中", occupation: "國文教師", motivation: "課程設計", role: "member", timestamp: "2024/03/12 16:45:00", status: "active" },
          { id: 5, name: "謝阿德", email: "de@example.com", organization: "台南市教育局", occupation: "行政人員", motivation: "專案管理", role: "member", timestamp: "2024/03/11 11:30:00", status: "archived", archivedReason: "系統停用", archivedAt: "2025/04/01 23:55:00" },
          { id: 6, name: "張阿杰", email: "jie@example.com", organization: "成大附中", occupation: "教師", motivation: "補充教材", role: "member", timestamp: "2024/03/10 15:20:00", status: "archived", archivedReason: "系統停用", archivedAt: "2025/04/01 23:55:00" },
        ];
        setAllMembers(mockData);
      } catch (error) {
        showToast(`載入會員資料失敗: ${error.message}`, 'error');
        setMemberList([]);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [showToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 根據狀態篩選資料
  useEffect(() => {
    if (allMembers.length > 0 || isLoading === false) {
      let filtered = [];
      if (viewFilter === 'admins') {
        filtered = allMembers.filter(item => item.role === 'admin' && item.status === 'active');
      } else if (viewFilter === 'members') {
        filtered = allMembers.filter(item => item.role !== 'admin' && item.status === 'active');
      } else if (viewFilter === 'archivedMembers') {
        filtered = allMembers.filter(item => item.role !== 'admin' && item.status === 'archived');
      }

      // 文字搜尋過濾：僅姓名
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          (item.name || '').toLowerCase().includes(q)
        );
      }
      setMemberList(filtered);
    }
  }, [allMembers, viewFilter, isLoading, searchQuery]);

  //（移除新增會員按鈕，保留原有編輯流程所需的狀態與函式）

  // Modal 關閉
  const handleModalClose = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setCurrentEditItem(null);
    setNewName('');
    setNewEmail('');
    setNewOrganization('');
    setNewOccupation('');
    setNewMotivation('');
    setNewRole('member');
  };

  // 送出表單
  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (!newName || !newEmail || !newOrganization || !newOccupation || !newMotivation || !newRole) {
      showToast('請填寫所有欄位', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showToast('請輸入有效的 Email', 'warning');
      return;
    }

    // 僅超級管理員可新增或編輯為管理員角色
    if (newRole === 'admin' && !isSuperAdmin) {
      showToast('僅超級管理員可新增/編輯為管理員角色', 'warning');
      return;
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (isEditing && currentEditItem) {
      setAllMembers(prevInfo => prevInfo.map(item =>
        item.id === currentEditItem.id
          ? { ...item, name: newName, email: newEmail, organization: newOrganization, occupation: newOccupation, motivation: newMotivation, role: newRole }
          : item
      ));
      showToast('會員資料已成功更新！', 'success');
    } else {
      const newId = 'member-' + Date.now();
      const newItem = {
        id: newId,
        name: newName,
        email: newEmail,
        organization: newOrganization,
        occupation: newOccupation,
        motivation: newMotivation,
        role: newRole,
        timestamp,
        status: 'active',
      };
      setAllMembers(prevInfo => [newItem, ...prevInfo]);
      showToast('新會員已成功新增！', 'success');
    }
    handleModalClose();
  };

  const handleViewFilterChange = (event) => {
    setViewFilter(event.target.value);
  };

  return (
    <div className="admin-member-page">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">
          首頁搜尋 &gt; 會員管理 &gt;
          <span>{viewFilter === 'admins' ? '管理員名單' : viewFilter === 'members' ? '會員名單' : '停用會員名單'}</span>
        </h5>
        <div className="admin-controls-row">
          <input
            type="text"
            className="form-control admin-search-input"
            placeholder="搜尋姓名"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* 已移除「新增會員」按鈕 */}
          <div className="status-filter">
            <span className="text-secondary">目前狀態：</span>
            <select
              className="form-select admin-status-dropdown"
              value={viewFilter}
              onChange={handleViewFilterChange}
            >
              <option value="admins">管理員名單</option>
              <option value="members">會員名單</option>
              <option value="archivedMembers">停用會員名單</option>
            </select>
          </div>
        </div>
      </div>

      {/* 使用 AdminDataTable 組件 */}
      <AdminDataTable
        data={memberList}
        columns={columns}
        enableSorting={true}
        enableDragging={true}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        error={error}
        onRetry={fetchMembers}
        emptyState={{ message: '目前沒有會員資料' }}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        title={isEditing ? '編輯會員' : '新增會員'}
        onSubmit={handleFormSubmit}
      >
        <div className="mb-3">
          <label htmlFor="newName" className="form-label admin-form-label">
            *姓名
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
          <label htmlFor="newEmail" className="form-label admin-form-label">
            *Email
          </label>
          <input
            type="email"
            className="form-control admin-form-control"
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newOrganization" className="form-label admin-form-label">
            *服務單位
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newOrganization"
            value={newOrganization}
            onChange={(e) => setNewOrganization(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newOccupation" className="form-label admin-form-label">
            *職業
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newOccupation"
            value={newOccupation}
            onChange={(e) => setNewOccupation(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newMotivation" className="form-label admin-form-label">
            *使用網站動機
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newMotivation"
            value={newMotivation}
            onChange={(e) => setNewMotivation(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newRole" className="form-label admin-form-label">
            *角色
          </label>
          <select
            className="form-select admin-form-control"
            id="newRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            required
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </AdminModal>

      {/* 停用上傳資格彈窗 */}
      {showDisableModal && (
        <div className="disable-modal-overlay" onClick={() => setShowDisableModal(false)}>
          <div className="disable-modal" onClick={(e) => e.stopPropagation()}>
            <div className="disable-modal-header">
              <h3>停用會員上傳資格</h3>
              <button
                className="disable-modal-close"
                onClick={() => setShowDisableModal(false)}
              >
                ×
              </button>
            </div>
            <div className="disable-modal-body">
              <div className="disable-modal-left">
                <label className="disable-form-label">*停用理由：</label>
                <div className="disable-radio-group">
                  {[
                    '散佈不雅內容',
                    '冒用他人身份',
                    '違規張貼內容',
                    '攻擊講師或平台',
                    '依舉報結果而定',
                    '帳號交易或共享',
                    '其他（請寫在補充說明）'
                  ].map((reason) => (
                    <label key={reason} className="disable-radio-label">
                      <input
                        type="radio"
                        name="disableReason"
                        value={reason}
                        checked={disableReason === reason}
                        onChange={(e) => setDisableReason(e.target.value)}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="disable-modal-right">
                <label className="disable-form-label">補充說明（非必填）：</label>
                <textarea
                  className="disable-textarea"
                  value={disableNote}
                  onChange={(e) => setDisableNote(e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
            <div className="disable-modal-footer">
              <button
                className="disable-confirm-btn"
                onClick={confirmDisableUpload}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 指定管理員彈窗 */}
      {showAdminModal && adminTarget && (
        <div className="admin-modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="admin-assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>指定管理員</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowAdminModal(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                *您確定要將此會員指定為「管理員」？
              </p>
              <p className="admin-permission-note">
                （其管理權限包含：使用者內容審查與下架處理、管理會員名單與權限指派）
              </p>
              <div className="admin-member-info">
                <p><span>姓名：</span>{adminTarget.name}</p>
                <p><span>信箱：</span>{adminTarget.email}</p>
                <p><span>服務單位：</span>{adminTarget.organization}</p>
                <p><span>職業：</span>{adminTarget.occupation}</p>
                <p><span>使用網站動機：</span>{adminTarget.motivation}</p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-confirm-btn"
                onClick={confirmAssignAdmin}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMemberPage;
