import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { createPortal } from 'react-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '../../../components/Toast';
import { authenticatedFetch } from '../../../services/authService';
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
  'root@example.com',
  'myating0623@gmail.com'
];

/**
 * 解析並格式化「使用網站動機」欄位
 * API 回傳格式可能是：
 * - JSON 陣列：[{"type": "編課"}, {"type": "自學"}, {"type": "其他", "custom": "測試"}]
 * - JSON 字串："[{\"type\": \"編課\"}]"
 * - 純文字："編課、自學"
 * @param {any} reason - 原始 reason 資料
 * @returns {string} 格式化後的文字
 */
const formatReasonDisplay = (reason) => {
  if (!reason) return '';

  // 如果已經是字串，嘗試解析 JSON
  let reasonArray = reason;
  if (typeof reason === 'string') {
    try {
      reasonArray = JSON.parse(reason);
    } catch {
      // 如果解析失敗，直接回傳原始字串
      return reason;
    }
  }

  // 如果不是陣列，直接轉換為字串
  if (!Array.isArray(reasonArray)) {
    return String(reason);
  }

  // 解析陣列並格式化
  const formatted = reasonArray.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const type = item.type || '';
      const custom = item.custom || '';
      // 如果是「其他」且有自訂內容，顯示為「其他：XXX」
      if (type === '其他' && custom) {
        return `${type}：${custom}`;
      }
      return type;
    }
    return '';
  }).filter(Boolean);

  return formatted.join('、');
};

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
                {row.original.status === '管理員' ? '解除管理員身分' : '指定擔任管理員'}
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
  const [newDept, setNewDept] = useState('');
  const [newReason, setNewReason] = useState('');
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

  const { user: authUser, checkSuperAdmin } = useAuth();

  const isSuperAdmin = useMemo(() => {
    // 1. 優先使用 AuthContext 的判斷 (會檢查 role === 'SUPER_ADMIN')
    if (typeof checkSuperAdmin === 'function' && checkSuperAdmin()) return true;

    // 2. 檢查目前登入用戶的屬性 (包含大小寫相容處理)
    const email = authUser?.email?.toLowerCase() || '';
    const role = authUser?.role?.toUpperCase() || '';

    // 如果 role 是 SUPER_ADMIN 或在白名單內
    const isWhitelisted = SUPER_ADMIN_WHITELIST.map(e => e.toLowerCase()).includes(email);
    const hasSuperRole = role === 'SUPER_ADMIN' || authUser?.isSuperAdmin === true;

    return hasSuperRole || isWhitelisted;
  }, [authUser, checkSuperAdmin]);

  // API base URL
  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://dev.taigiedu.com/backend";

  // 載入會員資料
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${apiBaseUrl}/admin/member/list`, {
        method: 'GET',
      });
      const result = await response.json();

      if (response.ok && result.success) {
        // 將 API 資料映射到前端格式
        const members = (result.members || []).map(member => ({
          ...member,
          // 確保 id 是數字或字串
          id: member.id,
          // 保留 API 原始欄位名稱
          name: member.name,
          email: member.email,
          dept: member.dept || '',
          reason: member.reason || '',
          timestamp: member.timestamp || '',
          status: member.status || '會員',
          // 額外欄位（如果需要）
          role: member.status === '管理員' ? 'admin' : 'member',
        }));
        setAllMembers(members);
      } else {
        throw new Error(result.message || '載入會員資料失敗');
      }
    } catch (error) {
      console.error('載入會員資料錯誤:', error);
      showToast(`載入會員資料失敗: ${error.message}`, 'error');
      setMemberList([]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [showToast, apiBaseUrl]);

  //（已移除獨立編輯入口）

  // 刪除/恢復按鈕點擊（停用/啟用）
  const handleDeleteClick = useCallback(async (itemId) => {
    // 管理員名單下僅允許超級管理員停用/啟用
    if (viewFilter === 'admins' && !isSuperAdmin) {
      showToast('僅超級管理員可停用/啟用管理員', 'warning');
      return;
    }

    const isRestoreAction = viewFilter === 'archivedMembers';
    const action = isRestoreAction ? '恢復會員' : '停用會員';

    try {
      // 呼叫 API
      const response = await authenticatedFetch(`${apiBaseUrl}/admin/member/status`, {
        method: 'POST',
        body: JSON.stringify({
          id: String(itemId),
          action: action,
          reason: isRestoreAction ? '管理員恢復' : '系統停用',
          detail: ''
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message || (isRestoreAction ? '帳號已成功啟用！' : '帳號已成功停用！'), 'success');
        // 重新載入會員列表以確保資料同步
        fetchMembers();
      } else {
        throw new Error(result.message || `${action}失敗`);
      }
    } catch (error) {
      console.error(isRestoreAction ? "啟用失敗:" : "停用失敗:", error);
      showToast(`${isRestoreAction ? "啟用" : "停用"}失敗: ${error.message}`, 'error');
    }
  }, [viewFilter, isSuperAdmin, showToast, apiBaseUrl, fetchMembers]);

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
  const confirmDisableUpload = useCallback(async () => {
    if (!disableReason) {
      showToast('請選擇停用理由', 'warning');
      return;
    }

    const fullReason = disableNote ? `${disableReason}（${disableNote}）` : disableReason;

    try {
      // 呼叫 API
      const response = await authenticatedFetch(`${apiBaseUrl}/admin/member/status`, {
        method: 'POST',
        body: JSON.stringify({
          id: String(disableTarget.id),
          action: '停用會員',
          reason: fullReason,
          detail: disableNote || ''
        })
      });

      const result = await response.json();

      console.log('停用會員 API 回應:', { status: response.status, result });

      if (response.ok && result.success) {
        showToast(result.message || `已停用 ${disableTarget.name} 的上傳資格`, 'success');
        setShowDisableModal(false);
        setDisableTarget(null);
        // 重新載入會員列表以確保資料同步
        fetchMembers();
      } else {
        throw new Error(result.message || result.error || '停用失敗');
      }
    } catch (error) {
      console.error('停用會員失敗:', error);
      console.error('停用會員請求參數:', { id: disableTarget?.id, action: '停用會員', reason: fullReason });
      showToast(`停用失敗: ${error.message}`, 'error');
    }
  }, [disableTarget, disableReason, disableNote, showToast, apiBaseUrl, fetchMembers]);

  // 指定擔任管理員
  const handleAssignAdmin = useCallback((member) => {
    // 開啟確認彈窗
    setAdminTarget(member);
    setShowAdminModal(true);
    setActiveMenuId(null);
  }, []);

  // 確認指定擔任管理員或解除管理員身分
  const confirmAssignAdmin = useCallback(async () => {
    const isDemoting = adminTarget?.status === '管理員';
    const action = isDemoting ? '恢復會員' : '設置管理員';
    const successMsg = isDemoting ? `已解除 ${adminTarget.name} 的管理員身分` : `已將 ${adminTarget.name} 指定為管理員`;

    try {
      // 呼叫 API
      const response = await authenticatedFetch(`${apiBaseUrl}/admin/member/status`, {
        method: 'POST',
        body: JSON.stringify({
          id: String(adminTarget.id),
          action: action,
          reason: isDemoting ? '解除管理員權限' : '指定為管理員',
          detail: ''
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message || `已將 ${adminTarget.name} 指定為管理員`, 'success');
        setShowAdminModal(false);
        setAdminTarget(null);
        // 重新載入會員列表以確保資料同步
        fetchMembers();
      } else {
        throw new Error(result.message || '指定管理員失敗');
      }
    } catch (error) {
      console.error('指定管理員失敗:', error);
      showToast(`指定管理員失敗: ${error.message}`, 'error');
    }
  }, [adminTarget, showToast, apiBaseUrl, fetchMembers]);

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
        columnHelper.accessor('dept', {
          header: '服務單位',
          cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
          enableSorting: true,
          size: 180,
        }),
        columnHelper.accessor('reason', {
          header: '使用網站動機',
          cell: info => (<span className="text-truncate-cell">{formatReasonDisplay(info.getValue())}</span>),
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
      columnHelper.accessor('dept', {
        header: '服務單位',
        cell: info => (<span className="text-truncate-cell">{info.getValue()}</span>),
        enableSorting: true,
        size: 180,
      }),
      columnHelper.accessor('reason', {
        header: '使用網站動機',
        cell: info => (<span className="text-truncate-cell">{formatReasonDisplay(info.getValue())}</span>),
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

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 根據狀態篩選資料（使用 API 回傳的 status 字串）
  useEffect(() => {
    if (allMembers.length > 0 || isLoading === false) {
      let filtered = [];
      if (viewFilter === 'admins') {
        // 管理員名單：status 為 "管理員"
        filtered = allMembers.filter(item => item.status === '管理員');
      } else if (viewFilter === 'members') {
        // 會員名單：status 為 "會員"
        filtered = allMembers.filter(item => item.status === '會員');
      } else if (viewFilter === 'archivedMembers') {
        // 停用會員名單：status 為 "停用" 或 "已停用"
        filtered = allMembers.filter(item => item.status === '停用' || item.status === '已停用');
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
    setNewDept('');
    setNewReason('');
    setNewRole('member');
  };

  // 送出表單
  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (!newName || !newEmail || !newDept || !newReason || !newRole) {
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
          ? { ...item, name: newName, email: newEmail, dept: newDept, reason: newReason, role: newRole }
          : item
      ));
      showToast('會員資料已成功更新！', 'success');
    } else {
      const newId = 'member-' + Date.now();
      const newItem = {
        id: newId,
        name: newName,
        email: newEmail,
        dept: newDept,
        reason: newReason,
        role: newRole,
        timestamp,
        status: '會員',
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
          <label htmlFor="newDept" className="form-label admin-form-label">
            *服務單位
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newDept"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newReason" className="form-label admin-form-label">
            *使用網站動機
          </label>
          <input
            type="text"
            className="form-control admin-form-control"
            id="newReason"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
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
              <h3>{adminTarget?.status === '管理員' ? '解除管理員身分' : '指定管理員'}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowAdminModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                {adminTarget?.status === '管理員'
                  ? '*您確定要解除此人員的「管理員」身分？'
                  : '*您確定要將此會員指定為「管理員」？'}
              </p>
              <p className="admin-permission-note">
                {adminTarget?.status === '管理員'
                  ? '（解除後該帳號將回歸為一般會員身分，並喪失後台管理權限）'
                  : '（其管理權限包含：使用者內容審查與下架處理、管理會員名單與權限指派）'}
              </p>
              <div className="admin-member-info">
                <p><span>姓名：</span>{adminTarget.name}</p>
                <p><span>信箱：</span>{adminTarget.email}</p>
                <p><span>服務單位：</span>{adminTarget.dept}</p>
                <p><span>使用網站動機：</span>{formatReasonDisplay(adminTarget.reason)}</p>
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
