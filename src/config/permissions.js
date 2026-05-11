/**
 * 權限配置表 (Permission Config)
 *
 * ─── 角色層級 ──────────────────────────────────────────
 *  MEMBER      - 一般會員（普通用戶）
 *  ADMIN       - 管理員（外部教師等）
 *  SUPER_ADMIN - 超級管理員（平台核心管理人員）
 *
 * ─── 使用方式 ──────────────────────────────────────────
 *  import { can } from '../config/permissions';
 *  import { useAuth } from '../contexts/AuthContext';
 *
 *  const { user } = useAuth();
 *  const linkRequired = !can(user?.role, 'news', 'optionalLink');
 *
 * ─── 新增規則 ──────────────────────────────────────────
 *  1. 在下方 PERMISSIONS 物件中，找到對應的功能模組 (feature)
 *  2. 定義一個能力 key (ability)，並設定哪些角色擁有此能力
 *  3. 在元件中透過 can(role, feature, ability) 來查詢
 *
 * ─── 設計說明 ──────────────────────────────────────────
 *  - 採用「白名單」設計：預設沒有任何額外能力，明確列出才開放
 *  - 角色繼承：SUPER_ADMIN 擁有 ADMIN 的所有能力，ADMIN 擁有 MEMBER 的所有能力
 *    （如不需繼承，可將 inheritFrom 設為 null）
 * ───────────────────────────────────────────────────────
 */

/** 角色定義與繼承關係 */
export const ROLES = {
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

/** 角色繼承鏈（子角色自動擁有父角色的所有能力） */
const ROLE_HIERARCHY = {
  [ROLES.MEMBER]: [],
  [ROLES.ADMIN]: [ROLES.MEMBER],
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.MEMBER],
};

/**
 * 權限表
 *
 * 結構：
 *   PERMISSIONS[feature][ability] = [擁有此能力的角色陣列]
 *
 * 命名慣例：
 *   - feature: 功能模組名稱（camelCase），例如 news、exam、member
 *   - ability: 具體能力描述（camelCase），例如 optionalLink、deleteRecord
 */
const PERMISSIONS = {
  // ── 活動快訊 (news) ──────────────────────────────────
  news: {
    /**
     * optionalLink：連結欄位為「非必填」
     *  - SUPER_ADMIN：可以不填連結，直接新增/編輯快訊
     *  - ADMIN / MEMBER：連結為必填
     */
    optionalLink: [ROLES.SUPER_ADMIN],
  },

  // ── 考試資訊 (exam) ──────────────────────────────────
  exam: {
    // 日後可在此處新增考試模組相關的細粒度權限
    // 例如：deleteRecord: [ROLES.SUPER_ADMIN]
  },

  // ── 會員管理 (member) ────────────────────────────────
  member: {
    // 例如：viewSensitiveData: [ROLES.SUPER_ADMIN]
  },

  // ── 媒體社群資源 (socialmedia) ───────────────────────
  socialmedia: {
    // 例如：bulkDelete: [ROLES.SUPER_ADMIN]
  },
};

/**
 * 取得指定角色的所有祖先角色（含自身）
 * @param {string} role
 * @returns {string[]}
 */
function getRoleLineage(role) {
  if (!role || !ROLE_HIERARCHY[role]) return [];
  const ancestors = ROLE_HIERARCHY[role] || [];
  return [role, ...ancestors];
}

/**
 * 查詢某角色是否擁有指定功能的特定能力
 *
 * @param {string|undefined} role   - 使用者的角色字串，例如 'SUPER_ADMIN'
 * @param {string} feature          - 功能模組名稱，例如 'news'
 * @param {string} ability          - 具體能力名稱，例如 'optionalLink'
 * @returns {boolean}
 *
 * @example
 *   can('SUPER_ADMIN', 'news', 'optionalLink')  // true
 *   can('ADMIN', 'news', 'optionalLink')         // false
 *   can(undefined, 'news', 'optionalLink')       // false
 */
export function can(role, feature, ability) {
  const allowedRoles = PERMISSIONS[feature]?.[ability];
  if (!allowedRoles || allowedRoles.length === 0) return false;

  const lineage = getRoleLineage(role);
  return lineage.some((r) => allowedRoles.includes(r));
}

export default PERMISSIONS;
