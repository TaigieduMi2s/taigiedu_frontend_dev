import { authenticatedFetch } from "./authService";
import envConfig from "../config";

/**
 * 教學資源共享平台的點讚（收藏）API。
 * 列表卡片的愛心（`ResourceContent`）與檔案預覽頁的「點讚資源」按鈕（`FilePreview`）共用這一支，
 * 兩邊的樂觀更新／快取行為才會一致。
 */

const LIKE_STORAGE_KEY = "resourceLikeStates";

const readLikeCache = () => {
  try {
    return JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

/** 讀取本機快取的點讚狀態；沒有紀錄時回傳 undefined */
export const getCachedLikeState = (resourceId) => {
  const cached = readLikeCache()[resourceId];
  return typeof cached === "boolean" ? cached : undefined;
};

export const setCachedLikeState = (resourceId, isLiked) => {
  try {
    const cache = readLikeCache();
    cache[resourceId] = isLiked;
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 不可用時只影響重整後的快取，不影響本次操作
  }
};

/**
 * 監聽「其他分頁」的點讚變更（預覽頁是另開新分頁，點讚後讓列表分頁的愛心跟著更新）。
 * 同一分頁內的變更不會觸發（瀏覽器的 storage 事件只送給其他分頁）。
 * @param {(resourceId: string, isLiked: boolean) => void} callback
 * @returns {() => void} 取消監聽
 */
export const subscribeLikeChanges = (callback) => {
  const onStorage = (event) => {
    if (event.key !== LIKE_STORAGE_KEY) return;
    let prev = {};
    let next = {};
    try {
      prev = JSON.parse(event.oldValue || "{}");
      next = JSON.parse(event.newValue || "{}");
    } catch {
      return;
    }
    Object.entries(next).forEach(([id, isLiked]) => {
      if (typeof isLiked === "boolean" && prev[id] !== isLiked) callback(id, isLiked);
    });
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
};

/**
 * 切換資源的點讚狀態（後端 `POST /api/resource/like` 為 toggle）。
 * @param {string|number} resourceId
 * @param {{ isLiked: boolean, likes: number }} current 目前畫面上的狀態，後端沒回傳時用來推算
 * @returns {Promise<{ isLiked: boolean, likes: number }>} 失敗時 throw，message 為可直接顯示的錯誤訊息
 */
export const toggleResourceLike = async (resourceId, current) => {
  const response = await authenticatedFetch(`${envConfig.apiUrl}/api/resource/like`, {
    method: "POST",
    body: JSON.stringify({ id: parseInt(resourceId, 10) }),
  });
  const result = await response.json();

  if (!response.ok || !(result?.status === "success" || result?.data?.success)) {
    throw new Error(result?.data?.message || result?.message || "點讚失敗，請稍後再試");
  }

  const isLiked = typeof result?.data?.is_like === "boolean" ? result.data.is_like : !current.isLiked;
  const likes = typeof result?.data?.likes === "number"
    ? result.data.likes
    : Math.max(0, (current.likes || 0) + (isLiked ? 1 : -1));

  setCachedLikeState(resourceId, isLiked);
  return { isLiked, likes };
};
