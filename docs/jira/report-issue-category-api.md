# [API] 「回報問題」的功能與問題類別改由後端提供

**Type:** Task
**Priority:** Low～Medium
**Component:** Backend / Frontend
**Reporter:** ncchen
**Assignee:** _(後端負責人)_
**Related:** TAIGIE-252、`src/components/ReportIssue/reportIssueConfig.js`、`docs/jira/report-issue-backend-api.md`

---

## 背景 (Background)

TAIGIE-252 定案後，「回報問題」的入口統一收在全站 Footer，彈窗內多了一個
**「功能頁面」下拉**讓使用者自己選要回報哪個功能，選定後第二層「問題細項」的選項才跟著連動。

目前這兩層清單**完全寫死在前端**（`src/components/ReportIssue/reportIssueConfig.js`）：

| 功能頁面 | 問題細項 |
|---|---|
| 台語俗諺語 | 文字 / 拼音標示錯誤、解讀錯誤、其它 |
| 台語文化－飲食 | 文字 / 拼音標示錯誤、釋義錯誤、其它 |
| 台語文化－節慶 | 文字 / 拼音標示錯誤、釋義錯誤、其它 |
| 資源共享平台 | 資料有誤 / 事實不符、資訊過期 / 未更新、其它 |
| 媒體與社群資源 | 連結名稱有誤、分類有誤、外部連結失效、外部連結網址有誤、其它 |
| 認證考試 | 連結名稱有誤、分類有誤、外部連結失效、外部連結網址有誤、其它 |

第一層「問題類別」（問題回報 / 其他）同樣是寫死的。

### 為什麼想改

1. **每次調整都要改程式碼＋重新部署**。新增一個功能頁（如台語文化、職業台語、台語地名與文化）、
   或 PM 想微調某個細項的文字，前端都得改檔案、發版，管理員自己動不了。
2. **清單與實際功能容易脫節**。網站的功能頁一直在長，寫死的清單很容易漏掉新頁面，
   使用者就只能選「其他」，回報進來的資料反而更難分類。
3. **後端收資料時無法驗證**。`POST /issue_report` 的 `page` / `issue_category` 目前是前端給什麼就收什麼，
   沒有一份權威清單可以比對。

---

## 想請後端評估的事 (Ask)

**是否可行加開一支唯讀端點，讓前端在開啟彈窗時取得這兩層清單？**

### 建議的端點

```
GET {API_BASE}/issue_report/categories
```

不需要登入（回報問題本身就開放未登入者使用）。

#### Response

```json
{
  "success": true,
  "data": {
    "issue_types": ["問題回報", "其他"],
    "features": [
      {
        "key": "phrase",
        "label": "台語俗諺語",
        "detail_options": ["文字 / 拼音標示錯誤", "解讀錯誤", "其它"]
      },
      {
        "key": "resource",
        "label": "資源共享平台",
        "detail_options": ["資料有誤 / 事實不符", "資訊過期 / 未更新", "其它"]
      }
    ]
  }
}
```

- `key`：就是現在送給 `POST /issue_report` 的 `page` 欄位，**請沿用現有代碼**
  （`phrase` / `cultureFood` / `cultureFestival` / `resource` / `socialmedia` / `exam`），
  以免既有的回報資料對不上。
- `label`：下拉顯示文字，同時當作 `page_label` 送回去。
- `features` 的陣列順序即為下拉的顯示順序。
- 只有「問題類別」選「問題回報」時才會用到 `detail_options`（選「其他」不顯示第二層）。

### 資料表建議

兩張小表就夠，或一張表加 `parent_id` 也行：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `key` | varchar | 功能代碼，唯一 |
| `label` | varchar | 顯示名稱 |
| `seq` | int | 顯示順序 |
| `status` | varchar | 上架／下架，讓 PM 可以先停用某個功能的回報 |

細項表：`feature_key`、`label`、`seq`、`status`。

### 前端這邊會怎麼接

- `reportIssueConfig.js` 已經把清單集中在一支檔案、並以 `REPORT_FEATURE_OPTIONS` 對外提供，
  接上 API 時只要換成打這支端點即可，**彈窗本身不用改**。
- 為了避免 API 掛掉時整個回報功能不能用，前端會**保留現在寫死的清單當 fallback**。

---

## 待確認 (Open Questions)

1. **後端這邊維護成本會不會太高？** 如果只是把清單搬到資料庫、但一樣要工程師下 SQL 才能改，
   那跟寫死在前端的差別不大 —— 這種情況下建議直接維持現狀，不用開這支 API。
2. **要不要一併做後台管理介面？** 如果要讓 PM／管理員自己維護，還需要一組 CRUD 端點
   （新增／修改／刪除／排序）＋ 後台頁面，範圍會大很多，建議拆成另一張票分階段做。
3. **權限**：若要做後台管理，維護這份清單應該歸在 `CONTENT_MANAGER` 還是 `SYSTEM_MANAGER`？

---

## 不在本票範圍 (Out of Scope)

- `POST /issue_report` 本身（另見 `docs/jira/report-issue-backend-api.md`，尚未實作）。
- 後台「回報問題」的檢視／處理介面。
- 是否要在回報時一併帶上「使用者是對哪一筆資料有意見」（`target_id` / `target_title`），
  這是 TAIGIE-252 的延伸討論，尚未定案。

---

## 預估 (Estimate)

- 後端唯讀端點（含資料表與初始資料匯入）：約 0.5～1 人日。
- 前端串接（含 fallback）：約 0.5 人日。
- 若要加後台管理介面：另計。
