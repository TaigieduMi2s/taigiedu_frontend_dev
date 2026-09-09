import { useCallback, useEffect, useState } from 'react';
import './ResourceHeaderPage.css';
import HighSchoolColumn from '../HighSchoolColumn/HighSchoolColumn.jsx';
import MiddleSchoolColumn from '../MiddleSchoolColumn/MiddleSchoolColumn.jsx';
import ElementarySchoolColumn from '../ElementarySchoolColumn/ElementarySchoolColumn.jsx';
import ContentTypeColumn from '../ContentTypeColumn/ContentTypeColumn.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useToast } from '../../../../components/Toast';
import ReadOnlyNotice from '../../../../components/ReadOnlyNotice/ReadOnlyNotice';
import { useContentEditPermission, NO_EDIT_PERMISSION_MESSAGE } from '../../../useContentEditPermission';
import {
  STAGES,
  fetchResourceMenu,
  addBook,
  updateBook,
  setBookStatus,
  deleteBook,
  addContentType,
  updateContentType,
  setContentTypeStatus,
  deleteContentType,
} from '../../../../services/resourceMenuService';

/**
 * 前台／後台篩選器仍然從 localStorage 讀這份鏡像
 * （`resourcePage/ResourceHeader.jsx`、`adminresourcePage/AdminResourcePage.jsx`）。
 * 這裡在每次載入或異動成功後同步覆寫，等那兩頁改吃 API 之後即可整組移除。
 */
const STORAGE_KEY = 'resourceHeaderConfig';

/**
 * 後端選單 API 尚未上線時的本機暫存模式。
 * 讓 DEV 上的畫面仍可操作；後端三支寫入 API 上線後把這個常數改成 false 並刪掉相關分支即可。
 */
const LOCAL_FALLBACK_ENABLED = true;

const DEFAULT_MENU = {
  versions: {
    '高中': ['真平', '育達', '泰宇', '奇異果', '創新'],
    '國中': ['真平', '康軒', '奇異果', '師昀', '全華', '豪風', '長鴻'],
    '國小': ['真平', '康軒'],
  },
  contentTypes: ['學習單', '簡報', '教案', '其他'],
};

const toItems = (names) => names.map((name) => ({ id: null, name, usageCount: 0, isActive: true }));

const emptyMenu = () => ({
  versions: STAGES.reduce((acc, stage) => ({ ...acc, [stage]: [] }), {}),
  contentTypes: [],
});

/** 本機暫存模式的起始資料：先讀 localStorage 鏡像，沒有才用預設清單 */
const loadLocalMenu = () => {
  let parsed = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  return {
    versions: STAGES.reduce((acc, stage) => {
      const names = Array.isArray(parsed?.versions?.[stage]) && parsed.versions[stage].length > 0
        ? parsed.versions[stage]
        : DEFAULT_MENU.versions[stage];
      return { ...acc, [stage]: toItems(names) };
    }, {}),
    contentTypes: toItems(
      Array.isArray(parsed?.contentTypes) && parsed.contentTypes.length > 0
        ? parsed.contentTypes
        : DEFAULT_MENU.contentTypes
    ),
  };
};

/** 把「啟用中」的項目寫回 localStorage 鏡像，並通知其他頁面刷新 */
const syncMirror = (menu) => {
  const activeNames = (list) => list.filter((it) => it.isActive).map((it) => it.name);
  const mirror = {
    versions: STAGES.reduce((acc, stage) => ({ ...acc, [stage]: activeNames(menu.versions[stage] || []) }), {}),
    contentTypes: activeNames(menu.contentTypes || []),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mirror));
    window.dispatchEvent(new Event('resource-config-updated'));
  } catch { /* localStorage 不可用時略過，不影響主流程 */ }
};

export default function ResourceHeaderPage() {
  const [menu, setMenu] = useState(emptyMenu);
  const [isLoading, setIsLoading] = useState(true);
  // 後端選單 API 還沒上線時退回本機暫存，畫面上會標示
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const { showToast } = useToast();
  // 新增／修改／停用／刪除課本選單僅限內容管理員，系統管理員只能檢視
  const canEditContent = useContentEditPermission();

  const applyMenu = useCallback((nextMenu) => {
    setMenu(nextMenu);
    syncMirror(nextMenu);
  }, []);

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchResourceMenu({ includeInactive: true });
      setIsLocalMode(false);
      applyMenu(data);
    } catch (error) {
      console.error('取得課本選單失敗:', error);
      if (LOCAL_FALLBACK_ENABLED) {
        setIsLocalMode(true);
        setMenu(loadLocalMenu());
      } else {
        showToast(`取得課本選單失敗：${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyMenu, showToast]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  /**
   * 所有異動的共用流程：權限檢查 → 打 API → 用回傳的最新選單刷新畫面。
   * 本機暫存模式（後端 API 未上線）改走 localUpdate，並提醒使用者尚未寫入後端。
   *
   * @param {() => Promise<{ message: string, menu: Object|null }>} request
   * @param {(menu: Object) => Object} localUpdate 本機暫存模式下如何改動選單
   * @param {string} fallbackMessage
   * @returns {Promise<boolean>} 是否成功
   */
  const runMutation = useCallback(async (request, localUpdate, fallbackMessage) => {
    if (!canEditContent) {
      showToast(NO_EDIT_PERMISSION_MESSAGE, 'warning');
      return false;
    }

    if (isLocalMode) {
      applyMenu(localUpdate(menu));
      showToast(`${fallbackMessage}（後端選單 API 尚未上線，僅暫存於本機）`, 'warning');
      return true;
    }

    try {
      const { message, menu: latest } = await request();
      if (latest) {
        applyMenu(latest);
      } else {
        await loadMenu();
      }
      showToast(message || fallbackMessage, 'success');
      return true;
    } catch (error) {
      console.error('課本選單異動失敗:', error);
      showToast(error.message || '操作失敗', 'error');
      return false;
    }
  }, [applyMenu, canEditContent, isLocalMode, loadMenu, menu, showToast]);

  /** 取代指定清單（versions[stage] 或 contentTypes）後回傳新的 menu */
  const replaceList = (source, stage, mapper) => (
    stage
      ? { ...source, versions: { ...source.versions, [stage]: mapper(source.versions[stage] || []) } }
      : { ...source, contentTypes: mapper(source.contentTypes || []) }
  );

  const askConfirm = (options) => new Promise((resolve) => {
    setConfirmState({
      ...options,
      resolve: (answer) => { setConfirmState(null); resolve(answer); },
    });
  });

  // ── 新增 ────────────────────────────────────────────────
  const handleAdd = (stage) => (name) => runMutation(
    () => (stage ? addBook(stage, name) : addContentType(name)),
    (current) => replaceList(current, stage, (list) => [...list, { id: null, name, usageCount: 0, isActive: true }]),
    stage ? `已新增「${name}」到${stage}` : `已新增內容類型「${name}」`
  );

  // ── 編輯（改名）──────────────────────────────────────────
  const handleRename = (stage) => async (item, newName) => {
    if (item.usageCount > 0) {
      const ok = await askConfirm({
        title: '確認修改名稱',
        message: `目前有 ${item.usageCount} 筆教材使用「${item.name}」，改名後這些教材會一併更新為「${newName}」。確定修改？`,
      });
      if (!ok) return false;
    }

    return runMutation(
      () => (stage ? updateBook(stage, item.name, newName) : updateContentType(item.name, newName)),
      (current) => replaceList(current, stage, (list) => list.map((it) => (it.name === item.name ? { ...it, name: newName } : it))),
      `已將「${item.name}」改名為「${newName}」`
    );
  };

  // ── 停用／啟用 ──────────────────────────────────────────
  const handleToggleStatus = (stage) => async (item) => {
    const action = item.isActive ? 'disable' : 'enable';

    if (action === 'disable') {
      const usageNote = item.usageCount > 0
        ? `目前有 ${item.usageCount} 筆教材使用「${item.name}」，停用後這些教材仍會保留，但前台選單與新上傳將無法選擇此項目。`
        : `停用後「${item.name}」不會出現在前台選單與篩選器，資料仍保留於後端，隨時可以再啟用。`;
      const ok = await askConfirm({ title: '確認停用', message: `${usageNote}確定停用？` });
      if (!ok) return false;
    }

    return runMutation(
      () => (stage ? setBookStatus(stage, item.name, action) : setContentTypeStatus(item.name, action)),
      (current) => replaceList(current, stage, (list) => list.map((it) => (it.name === item.name ? { ...it, isActive: action === 'enable' } : it))),
      action === 'disable' ? `已停用「${item.name}」` : `已啟用「${item.name}」`
    );
  };

  // ── 刪除（硬刪除，僅限沒有教材使用）─────────────────────
  const handleDelete = (stage) => async (item) => {
    if (item.usageCount > 0) {
      showToast(`「${item.name}」仍有 ${item.usageCount} 筆教材使用，請改用「停用」`, 'warning');
      return false;
    }

    const ok = await askConfirm({
      title: '確認刪除',
      message: `刪除後「${item.name}」會從選單中永久移除，無法復原。若只是暫時不想讓使用者選到，請改用「停用」。確定刪除？`,
    });
    if (!ok) return false;

    return runMutation(
      () => (stage ? deleteBook(stage, item.name) : deleteContentType(item.name)),
      (current) => replaceList(current, stage, (list) => list.filter((it) => it.name !== item.name)),
      `已刪除「${item.name}」`
    );
  };

  const visibleItems = (list) => (showDisabled ? list : list.filter((it) => it.isActive));

  const columnProps = (stage) => ({
    items: visibleItems(stage ? (menu.versions[stage] || []) : menu.contentTypes),
    onAddItem: handleAdd(stage),
    onRenameItem: handleRename(stage),
    onToggleItemStatus: handleToggleStatus(stage),
    onDeleteItem: handleDelete(stage),
    readOnly: !canEditContent,
  });

  return (
    <div className="resconf-page">
      <div className="resconf-breadcrumb">
        <span className="section">資源共享平台</span>
        <span className="sep">&gt;</span>
        <span className="section">編輯課本選單</span>
      </div>
      <ReadOnlyNotice show={!canEditContent} message="您目前的權限僅能檢視課本選單設定，修改需要「內容管理員」權限。" />

      {isLocalMode && (
        <div className="resconf-notice" role="status">
          ⚠️ 後端選單 API（<code>/admin/resource/menu</code> 等）尚未上線，目前顯示本機暫存資料，異動不會寫入後端。
        </div>
      )}

      <div className="resconf-toolbar">
        <label className="resconf-toggle">
          <input
            type="checkbox"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.target.checked)}
          />
          顯示已停用項目
        </label>
        <span className="resconf-hint">數字為使用該項目的教材筆數；停用後前台不顯示，資料仍保留於後端。</span>
      </div>

      {isLoading ? (
        <div className="resconf-loading">載入中…</div>
      ) : (
        <div className="resconf-grid">
          <HighSchoolColumn {...columnProps('高中')} />
          <MiddleSchoolColumn {...columnProps('國中')} />
          <ElementarySchoolColumn {...columnProps('國小')} />
          <ContentTypeColumn {...columnProps(null)} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        onConfirm={() => confirmState?.resolve(true)}
        onCancel={() => confirmState?.resolve(false)}
      />
    </div>
  );
}
