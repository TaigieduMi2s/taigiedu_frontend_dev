/**
 * 「回報問題」各頁面設定 (Report Issue Page Config)
 *
 * 依 Figma「PD 台語文 workshop - WF paper prototype 2025」回報問題流程建立，
 * 並依 TAIGIE-252 的討論結論調整為「全站單一入口」。
 *
 * 入口與彈窗的關係（TAIGIE-252 定案）：
 * - 入口統一放在全站 Footer 的「回報問題」按鈕，各頁面不再各自建置入口。
 * - 因為 Footer 是全站共用的，彈窗無法自動判斷使用者要回報哪一個功能，
 *   所以表單第一欄改為**手動選擇「功能頁面」**（PM 於 TAIGIE-252 確認：
 *   「不行的話要新增一欄手動選擇」）。
 * - 選定功能頁面後，第二層「問題細項」的選項才跟著連動，對應關係見設計稿附圖。
 *
 * 設計備註：
 * - 第一層「問題類別」全站共用（問題回報 / 其他）。
 * - 只有選「問題回報」時才會出現細項下拉；選「其他」時不出現（Figma 註記：
 *   「第一欄如果點問題回報才會跳出第二欄類別選擇，反之如果點其它，後面第二欄不會出來」）。
 * - 上傳檔案非必填，且**只收圖片檔**（Figma 註記：「上傳檔案格式只有圖片檔」）。
 *   設計稿中「媒體與社群資源」那張圖的提示文字寫成 PDF/PPT/DOC，應為沿用資源平台的殘留，
 *   此處一律以註記為準統一為 JPG／PNG。
 * - ⚠️ 這份設定目前是**前端寫死**的。是否改由後端提供（讓管理員可自行維護功能與細項清單）
 *   已另開票與後端討論，詳見 docs/jira/report-issue-category-api.md。
 */

/** 第一層「問題類別」選項 */
export const ISSUE_TYPE_PROBLEM = '問題回報';
export const ISSUE_TYPE_OTHER = '其他';
export const ISSUE_TYPE_OPTIONS = [ISSUE_TYPE_PROBLEM, ISSUE_TYPE_OTHER];

/** 上傳檔案限制（僅圖片檔） */
export const UPLOAD_ACCEPT = 'image/jpeg,image/png';
export const UPLOAD_MAX_BYTES = 100 * 1024 * 1024; // 100MB
export const UPLOAD_HINT = '※限 JPG、PNG可上傳，限制 100MB。';

/**
 * 第二層「問題細項」共用選項組
 * 字詞解釋類：條目本身的文字／拼音／釋義有誤
 * 資料內容類：資源共享平台的教材內容本身有誤或過期
 * 連結類：卡片連結、分類、外部連結相關
 */
const WORD_DETAIL_OPTIONS = ['文字 / 拼音標示錯誤', '解讀錯誤', '其它'];
const CULTURE_DETAIL_OPTIONS = ['文字 / 拼音標示錯誤', '釋義錯誤', '其它'];
const RESOURCE_DETAIL_OPTIONS = ['資料有誤 / 事實不符', '資訊過期 / 未更新', '其它'];
const LINK_DETAIL_OPTIONS = [
    '連結名稱有誤',
    '分類有誤',
    '外部連結失效',
    '外部連結網址有誤',
    '其它',
];

/**
 * 各功能頁面設定
 * key         ：頁面代碼，同時當作送給後端的 page 欄位
 * label       ：功能名稱，會當作 page_label 送給後端
 * selectLabel ：「功能頁面」下拉要顯示的文字（未設定時沿用 label）
 *               飲食／節慶單看兩個字看不出是哪個功能，因此在下拉裡補上「台語文化－」
 * detailOptions：選「問題回報」後第二層下拉的選項
 */
export const REPORT_PAGE_CONFIG = {
    phrase: {
        label: '台語俗諺語',
        detailOptions: WORD_DETAIL_OPTIONS,
    },
    cultureFood: {
        label: '飲食',
        selectLabel: '台語文化－飲食',
        detailOptions: CULTURE_DETAIL_OPTIONS,
    },
    cultureFestival: {
        label: '節慶',
        selectLabel: '台語文化－節慶',
        detailOptions: CULTURE_DETAIL_OPTIONS,
    },
    resource: {
        label: '資源共享平台',
        detailOptions: RESOURCE_DETAIL_OPTIONS,
    },
    socialmedia: {
        label: '媒體與社群資源',
        detailOptions: LINK_DETAIL_OPTIONS,
    },
    exam: {
        label: '認證考試',
        detailOptions: LINK_DETAIL_OPTIONS,
    },
};

/**
 * 「功能頁面」下拉的選項（順序即為設計稿附圖由上到下的順序）
 * 給 CustomSelect 用的 { value, label } 陣列，value 就是 pageKey。
 */
export const REPORT_FEATURE_OPTIONS = Object.entries(REPORT_PAGE_CONFIG).map(
    ([key, config]) => ({ value: key, label: config.selectLabel || config.label })
);

/**
 * 取得單一頁面設定；未登錄的 pageKey 會回傳只有標題的預設值，避免整頁壞掉
 * @param {string} pageKey
 * @param {{ label?: string, detailOptions?: string[] }} [overrides] 呼叫端可臨時覆寫
 */
export const getReportPageConfig = (pageKey, overrides = {}) => {
    const base = REPORT_PAGE_CONFIG[pageKey] || { label: '', detailOptions: [] };
    return {
        pageKey,
        label: overrides.label ?? base.label,
        detailOptions: overrides.detailOptions ?? base.detailOptions ?? [],
    };
};

export default REPORT_PAGE_CONFIG;
