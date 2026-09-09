/**
 * 前台分類瀏覽頁的 query string 規則（媒體與社群資源／認證考試／台語文化）
 *
 * 這三頁的「分類篩選 + 關鍵字 + 頁碼」原本只存在元件 state，重新整理或分享網址就會
 * 掉回類別首頁。改成一律寫進 query string，網址即為畫面狀態：
 *
 *   ?cat=Podcast              整個第一層類別（無第二層或該層全選時使用，可重複）
 *   ?sub=戲曲:歌仔戲          第一層:第二層（可重複，跨第一層複選也用這個）
 *   ?q=關鍵字                 搜尋關鍵字
 *   ?page=2                   頁碼（第 1 頁不寫入，維持網址乾淨）
 *
 * `selectedItems` 的形狀沿用各頁既有結構：`{ 第一層: [第二層, ...] }`，空陣列代表整個第一層。
 * 媒體與社群資源允許類別名稱為空字串（畫面顯示「（空白類別）」），因此 `cat=` 這種空值也算有效。
 */

export const CATEGORY_PARAM = 'cat';
export const SUBCATEGORY_PARAM = 'sub';
export const QUERY_PARAM = 'q';
export const PAGE_PARAM = 'page';

const SUB_SEPARATOR = ':';

// `sub` 參數拆成 [第一層, 第二層]。
// 類別名稱本身含有 ":" 時，單純切第一個分隔符會拆錯，因此先用已知類別做最長前綴比對。
const splitSubEntry = (entry, knownCategories) => {
    const matched = knownCategories
        .filter(category => entry.startsWith(`${category}${SUB_SEPARATOR}`))
        .sort((a, b) => b.length - a.length)[0];

    if (matched !== undefined) {
        return [matched, entry.slice(matched.length + SUB_SEPARATOR.length)];
    }

    const index = entry.indexOf(SUB_SEPARATOR);
    if (index === -1) return [null, null];
    return [entry.slice(0, index), entry.slice(index + SUB_SEPARATOR.length)];
};

/** 從 query string 還原 `{ 第一層: [第二層, ...] }` */
export const parseSelectedItems = (searchParams, knownCategories = []) => {
    const selected = {};

    searchParams.getAll(CATEGORY_PARAM).forEach(category => {
        if (!selected[category]) selected[category] = [];
    });

    searchParams.getAll(SUBCATEGORY_PARAM).forEach(entry => {
        const [category, sub] = splitSubEntry(entry, knownCategories);
        if (category === null || !sub) return;
        if (!selected[category]) selected[category] = [];
        if (!selected[category].includes(sub)) selected[category].push(sub);
    });

    return selected;
};

/** 從 query string 讀頁碼（非法值一律當第 1 頁） */
export const parsePage = (searchParams) => {
    const page = parseInt(searchParams.get(PAGE_PARAM) || '1', 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
};

/** 從 query string 讀關鍵字 */
export const parseQuery = (searchParams) => searchParams.get(QUERY_PARAM) || '';

/**
 * 把畫面狀態組成新的 query string。
 * 只輸出這四個參數，預設值（無篩選／無關鍵字／第 1 頁）不寫入。
 */
export const buildListSearchParams = ({ selectedItems = {}, query = '', page = 1 } = {}) => {
    const params = new URLSearchParams();

    Object.entries(selectedItems).forEach(([category, subs]) => {
        if (!subs || subs.length === 0) {
            params.append(CATEGORY_PARAM, category);
            return;
        }
        subs.forEach(sub => params.append(SUBCATEGORY_PARAM, `${category}${SUB_SEPARATOR}${sub}`));
    });

    if (query) params.set(QUERY_PARAM, query);
    if (page > 1) params.set(PAGE_PARAM, String(page));

    return params;
};
