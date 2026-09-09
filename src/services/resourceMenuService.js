/**
 * 後台「編輯課本選單」API（課本版本 / 內容類型）
 *
 * 對應頁面：/admin/resource/header
 * （`adminPage/adminContent/adminHome/adminresourcePage/ResourceHeaderPage.jsx`）
 *
 * 權限說明：
 * - GET  /admin/resource/menu 只要是後台管理員都能讀
 * - 其餘寫入端點皆需 CONTENT_MANAGER（前端另以 useContentEditPermission() 擋一層）
 *
 * 「停用」與「刪除」是兩件不同的事，不要互相推導：
 * - 停用（disable）：軟停用，後端保留資料，前台選單與篩選器不再出現，既有教材不動
 * - 刪除（delete）：硬刪除，只有在沒有任何教材使用時才允許，後端會回 409 擋下
 */

import envConfig from '../config';
import { authenticatedFetch } from './authService';

const API_BASE_URL = envConfig.apiUrl;

/** 課本版本的三個階段，順序固定 */
export const STAGES = ['高中', '國中', '國小'];

/**
 * 把後端回的單筆選項正規化成前端統一格式
 * 後端若只回字串（舊格式），也能吃。
 * @returns {{ id: string|number|null, name: string, usageCount: number, isActive: boolean }}
 */
export const normalizeMenuItem = (raw) => {
  if (typeof raw === 'string') {
    return { id: null, name: raw, usageCount: 0, isActive: true };
  }
  return {
    id: raw?.id ?? null,
    name: raw?.name ?? '',
    usageCount: Number(raw?.usage_count ?? raw?.usageCount ?? 0),
    // 後端沒帶 is_active 時視為啟用中
    isActive: (raw?.is_active ?? raw?.isActive ?? 1) ? true : false,
  };
};

const normalizeList = (list) => (Array.isArray(list) ? list.map(normalizeMenuItem) : []);

/**
 * 把後端的 data 正規化成 { versions: { 高中: [...], ... }, contentTypes: [...] }
 * 三個階段的 key 一定存在（後端漏回時補空陣列）。
 */
export const normalizeMenu = (data) => ({
  versions: STAGES.reduce((acc, stage) => {
    acc[stage] = normalizeList(data?.versions?.[stage]);
    return acc;
  }, {}),
  contentTypes: normalizeList(data?.contentTypes),
});

/** 統一處理回應：非 2xx 或 success !== true 就丟出帶 code / usageCount 的 Error */
const parseResponse = async (response) => {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    const error = new Error(
      result?.error?.message || result?.message || '操作失敗'
    );
    error.status = response.status;
    error.code = result?.error?.code || '';
    error.usageCount = Number(result?.usage_count ?? result?.usageCount ?? 0);
    throw error;
  }

  return result;
};

const post = async (path, body) => {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const result = await parseResponse(response);
  // 寫入端點成功時會一併回傳最新的完整選單，前端直接拿來刷新畫面
  return {
    message: result.message || '',
    menu: result.data ? normalizeMenu(result.data) : null,
  };
};

/**
 * 取得完整課本選單（含已停用項目與使用筆數）
 * @param {{ includeInactive?: boolean }} options
 * @returns {Promise<{ versions: Object, contentTypes: Array }>}
 */
export const fetchResourceMenu = async ({ includeInactive = true } = {}) => {
  const query = includeInactive ? '?includeInactive=true' : '';
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/resource/menu${query}`);
  const result = await parseResponse(response);
  return normalizeMenu(result.data);
};

/** 新增課本版本 */
export const addBook = (stage, book) =>
  post('/admin/resource/add-book', { stage, book });

/** 修改課本版本名稱（既有教材的 version 欄位由後端一併更新） */
export const updateBook = (stage, book, newName) =>
  post('/admin/resource/update-book', { stage, book, newName });

/**
 * 停用／啟用課本版本
 * @param {'disable'|'enable'} action
 */
export const setBookStatus = (stage, book, action) =>
  post('/admin/resource/book-status', { stage, book, action });

/** 刪除課本版本（硬刪除；仍有教材使用時後端會回 409） */
export const deleteBook = (stage, book) =>
  post('/admin/resource/delete-book', { stage, book });

/** 新增內容類型 */
export const addContentType = (type) =>
  post('/admin/resource/add-content-type', { type });

/** 修改內容類型名稱 */
export const updateContentType = (type, newName) =>
  post('/admin/resource/update-content-type', { type, newName });

/**
 * 停用／啟用內容類型
 * @param {'disable'|'enable'} action
 */
export const setContentTypeStatus = (type, action) =>
  post('/admin/resource/content-type-status', { type, action });

/** 刪除內容類型（硬刪除；仍有教材使用時後端會回 409） */
export const deleteContentType = (type) =>
  post('/admin/resource/delete-content-type', { type });

export default {
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
};
