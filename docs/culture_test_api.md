# 台語文化（test）API 設計說明（給後端同仁）

> 對象：後端開發者
> 對應前端頁面：`/culture-test`（`src/cultureTestPage/CultureTestPage.jsx`）、`/admin/culture-test`（`src/adminPage/adminContent/adminHome/adminCultureTestPage.jsx`）
> 目前狀態：**前台與後台皆已完成畫面，資料全部走 mock**（`src/services/cultureTestMockApi.js`，前後台共用同一份記憶體資料）

---

## 1. 這個功能在做什麼

一個台語影音資料庫的分類瀏覽頁。使用者用「分類下拉（兩層、可複選）」加「關鍵字搜尋」找影音，
點卡片開新分頁到該筆影音來源。畫面只有一頁，沒有詳情頁。

兩種呈現模式（由前端自行切換，後端不需要知道）：

| 情境 | 畫面 |
|---|---|
| 沒篩選也沒搜尋 | 依分類分區預覽，每區顯示第一列 4 筆 ＋「共 N 筆」＋「查看全部」 |
| 有篩選或搜尋 | 攤平成完整列表 ＋ 前端分頁（每頁 20 筆） |

---

## 2. 最重要的一件事：分類的範圍與層級

來源是 PM 的「影音資料管理總表 - 分類彙整」，該表共三層。**這一頁只收第一層的「文化」這一支**，
並用它的第二、三層當作前台的兩層篩選：

| 來源表 | 本頁的值 | 前台用途 |
|---|---|---|
| 第一層（A 欄） | 固定為「文化」 | **不顯示**。只保留在資料裡供後台對照 |
| 第二層（B 欄） | 戲曲、祭典、傳統工藝、地方/產業 | **篩選第一層**＝下拉的父項、分區預覽的區塊標題 |
| 第三層（C 欄「列舉細項」） | 歌仔戲、布袋戲、歌詩、其他偶戲 … | **篩選第二層**＝下拉的子項 |

**A 欄的其他分類（職業台語、文學、教育、新聞/訪談、藝術表現）PM 已確認本頁不收**，
資料與 API 都不需要包含它們。

> 這是從舊設計（用第一、二層、捨棄第三層、涵蓋全部六個 A 分類）改過來的，**請以本文件為準**。

### 2.1 完整分類清單（共 4 × 21 項）

| 第二層（篩選第一層） | 第三層（篩選第二層） |
|---|---|
| 戲曲 | 歌仔戲、布袋戲、歌詩、其他偶戲 |
| 祭典 | 藝閣/陣頭、禮俗/儀式、媽祖、王爺 |
| 傳統工藝 | 雕塑類、木藝類、竹藝類、製陶/剪黏/窯藝/泥作類、金工類、漆藝/彩繪類、編織/刺繡類、其他類 |
| 地方/產業 | 自然資源、人造物品、飲食、節慶、其他類 |

### 2.2 兩個一定要處理的邊界情況

**(a) 第三層名稱會重複。**
「其他類」同時出現在「傳統工藝」和「地方/產業」底下。
→ 資料表的唯一鍵必須是 **(父分類, 名稱)** 或直接用 id，**不可以只對名稱下 unique**。
→ API 回傳時也不能只給第三層名稱就當作可識別，必須連同所屬第二層一起。

**(b) 第二層名稱是前台的 key，必須唯一。**
前台回傳格式沿用 `/media`，是以第二層名稱當 JSON 物件的 key（見第 4 節）。
目前四個名稱不重複，**但如果之後新增的第二層與現有同名，前台資料會互相蓋掉**。
→ 請在後台新增分類時擋掉第二層重名；若無法保證，請通知前端改用 id 當 key（這要前端一起改）。

---

## 3. 沿用既有慣例

**請直接比照「媒體與社群資源」（`/media`、`/admin/socialmedia`）那一組來做**，前端才能重用既有處理邏輯。

- **前台讀取用 `POST`**（專案既有慣例，如 `/media`、`/culture/food`），不需帶 Token
- **後台用 `GET` 列表 ＋ `POST .../add` ＋ `POST .../modify`**，`modify` 以 `action` 區分：`1=刪除 / 2=復原 / 3=修改`
- **後台端點需要 `BearerAuth`**，權限為 `CONTENT_MANAGER`（flags = 1），見 `docs/permissions_design.md`
- **錯誤回應**沿用 `components/schemas/ErrorResponse`：`{ "error": { "code", "message" } }`
- **成功訊息**沿用 `components/responses/SuccessMessage`：`{ "success": true, "message": "..." }`
- **圖片**回傳路徑字串（如 `/backend/static/culture/12.jpg`），前端自行補上 `envConfig.imageUrl` 前綴

---

## 4. 前台 API

### 4.1 `POST /culture-media` — 取得全部影音（含分類）

**這是前台唯一需要的一支。** 不帶參數，一次回傳全部。

**為什麼一次全給：** 篩選、搜尋、分頁全部在前端做（與 `/media` 相同）。
使用者切換分類、翻頁、打關鍵字都不會再打 API，體感最快，後端也最單純。

Request body：無（沿用 `/media`，送空的 `POST` 即可）

Response：

```json
{
  "category_order": ["戲曲", "祭典", "傳統工藝", "地方/產業"],
  "categories": [
    {
      "name": "戲曲",
      "parent": "文化",
      "children": ["歌仔戲", "布袋戲", "歌詩", "其他偶戲"]
    },
    {
      "name": "地方/產業",
      "parent": "文化",
      "children": ["自然資源", "人造物品", "飲食", "節慶", "其他類"]
    }
  ],
  "data": {
    "戲曲": [
      {
        "id": 1,
        "parent_category": "文化",
        "category": "戲曲",
        "subcategory": "歌仔戲",
        "title": "歌仔戲身段專題報導",
        "image": "/backend/static/culture/1.jpg",
        "url": "https://www.youtube.com/watch?v=xxxx"
      }
    ],
    "祭典": []
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `category_order` | string[] | 第二層的顯示順序。**前端完全照這個順序渲染**，不會自己排序 |
| `categories` | object[] | 分類樹。`name`＝第二層、`parent`＝第一層（固定「文化」，前台不顯示）、`children`＝第三層字串陣列 |
| `data` | object | key＝第二層名稱，value＝該分類底下的影音陣列（可為空陣列） |
| `data[].id` | int | 影音 id，前端當 React key |
| `data[].parent_category` | string | 第一層，固定「文化」，前台不顯示 |
| `data[].category` | string | 第二層，必須出現在 `category_order` 裡 |
| `data[].subcategory` | string | 第三層；**若該筆尚未指定第三層請給空字串 `""`，不要給 null** |
| `data[].title` | string | 卡片主標，也是前端搜尋的比對欄位 |
| `data[].image` | string \| null | 縮圖路徑；null 時前端顯示預設佔位圖 |
| `data[].url` | string | 影音來源網址，點卡片開新分頁 |

> **草案（2026-09）：影音＋文本混合**
> 台語文化要同時收影音與文本，前台已先做混合版面：搜尋列的類型下拉預設「全部」（兩種一起呈現），
> 選了影音或文本後才出現該類型的分類下拉。目前兩種資料暫時**共用同一套分類**（文本資料表的分類尚待比對確認）。若確定採用，本支回傳需補：
>
> | 欄位 | 型別 | 說明 |
> |---|---|---|
> | `content_types` | object[] | 類型下拉的選項順序與名稱（「全部」由前端自行加在最前面），如 `[{ "value": "video", "label": "影音" }, { "value": "text", "label": "文本" }]` |
> | `data[].type` | string | `"video"` 或 `"text"`，前端依此篩選類型並決定呈現方式（影音卡片／文本結果列） |
> | `data[].author` | string | **僅文本**。作者，顯示在結果列標題下方（`作者：OOO`），也是關鍵字搜尋的比對欄位；沒有可給空字串（前端不顯示該行） |
> | `data[].summary` | string | **僅文本**。摘要，結果列最多顯示兩行，也是關鍵字搜尋的比對欄位 |
>
> 以上兩個文本欄位是依結果列版面**暫訂**的，實際要以文本資料表有哪些欄位為準。
>
> ⚠️ 前端以 `category + id` 當 React key，兩種類型若分表存放，**`id` 必須跨類型不重複**（或改回傳帶前綴的字串 id）。
> 若分類比對後差異很大，`categories` 需改為依類型分開提供（例如 `categories: { video: [...], text: [...] }`）。

> **`categories` 是新加的欄位**，`/media` 沒有。
> 原因：`/media` 的子分類是前端從資料裡 `Set` 出來的，所以**空的分類會消失、順序也不可控**。
> 這頁的分類是有規格的三層表，需要「即使目前沒有影音也要出現在下拉裡」與「固定順序」，所以由後端明講。
> 前端目前用寫死的 `CATEGORY_TREE`（`src/services/cultureTestMockApi.js`），接上 API 後改讀這個欄位。

**排序**：`data` 內每個分類的陣列請依後台設定的 `sort_order` 排好，前端不重排。

**資料量**：mock 目前約 660 筆（21 個第三層 × 每組 20~45 筆）。若未來成長到**數千筆（回應 > 1 MB）**，再回頭討論改成後端分頁；
屆時前端的篩選/搜尋/分頁邏輯要整組改寫，不是換個 URL 就好，請提早通知。

---

## 5. 後台 API

後台頁面已依「媒體與社群資源後台」的操作模式做好（目前打 mock），以下是它預期呼叫的端點。全部需要 `BearerAuth` ＋ `CONTENT_MANAGER`。

> `POST /admin/culture-media/sort` 目前前端尚未使用（後台比照 `/admin/socialmedia` 未啟用拖曳排序），
> 但排序欄位仍請保留，日後要開拖曳時才不用改資料表。

### 5.1 影音資料

| 方法 | 端點 | 用途 |
|---|---|---|
| `GET` | `/admin/culture-media` | 影音列表（含已刪除，前端自行分頁/篩選） |
| `POST` | `/admin/culture-media/add` | 新增一筆 |
| `POST` | `/admin/culture-media/modify` | 修改 / 刪除 / 復原（`action` 區分） |
| `POST` | `/admin/culture-media/sort` | 更新排序（拖曳後送整批） |

**`GET /admin/culture-media`** 回傳陣列，每筆比前台多出管理欄位：

```json
[
  {
    "id": 1,
    "category_id": 10,
    "parent_category": "文化",
    "category": "戲曲",
    "subcategory": "歌仔戲",
    "title": "歌仔戲身段專題報導",
    "image": "/backend/static/culture/1.jpg",
    "url": "https://www.youtube.com/watch?v=xxxx",
    "sort_order": 1,
    "is_deleted": false,
    "created_at": "2026-08-01T10:00:00Z",
    "updated_at": "2026-08-05T09:12:00Z"
  }
]
```

> `category_id` 指到**第三層**的分類 id。後端據此回填 `parent_category` / `category` / `subcategory`
> 三個字串，前端不自己組（因為「其他類」重名，前端無法只憑名稱推回父分類）。

**`POST /admin/culture-media/add`**

```json
{
  "category_id": 10,
  "title": "歌仔戲身段專題報導",
  "url": "https://www.youtube.com/watch?v=xxxx",
  "image": "(base64 或 multipart 檔案，比照 /admin/socialmedia/add)"
}
```

**`POST /admin/culture-media/modify`**

```json
{ "id": "1", "action": "3", "category_id": 12, "title": "...", "url": "...", "image": "..." }
```

- `action: "1"` → 刪除（軟刪除，`is_deleted = true`）
- `action: "2"` → 復原
- `action: "3"` → 修改，帶要改的欄位
- `id` 沿用既有慣例送**字串**

**`POST /admin/culture-media/sort`**

```json
{ "orders": [{ "id": 1, "sort_order": 1 }, { "id": 5, "sort_order": 2 }] }
```

### 5.2 分類管理

分類目前是固定的 4 × 21 項，但**PM 之後可能再調整第三層**，建議開表 ＋ 給後台維護介面，
不要寫死在程式碼裡。若時程緊，這組可以晚一個版本再做，先在 DB 裡建好資料即可。

| 方法 | 端點 | 用途 |
|---|---|---|
| `GET` | `/admin/culture-category` | 取得完整分類（含 id、排序、停用狀態） |
| `POST` | `/admin/culture-category/add` | 新增分類（帶 `parent_id` 決定層級） |
| `POST` | `/admin/culture-category/modify` | 改名 / 刪除 / 復原 |
| `POST` | `/admin/culture-category/sort` | 更新同層排序 |

`GET /admin/culture-category` 回傳巢狀結構：

```json
[
  {
    "id": 1, "name": "文化", "level": 1, "parent_id": null, "sort_order": 1, "is_deleted": false,
    "children": [
      {
        "id": 3, "name": "戲曲", "level": 2, "parent_id": 1, "sort_order": 1, "is_deleted": false,
        "children": [
          { "id": 10, "name": "歌仔戲", "level": 3, "parent_id": 3, "sort_order": 1, "is_deleted": false }
        ]
      }
    ]
  }
]
```

**刪除分類的規則請先確認**（見第 7 節）：底下還有影音的分類，是擋住不給刪、連帶軟刪除，還是把影音移到「其他類」？

---

## 6. 資料表建議

### 6.1 `culture_category`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | int PK | |
| `name` | varchar(50) | 分類名稱 |
| `level` | tinyint | 1 / 2 / 3（本頁 level 1 只會有「文化」一筆） |
| `parent_id` | int NULL | 第一層為 null |
| `sort_order` | int | 同層排序 |
| `is_deleted` | bool | 軟刪除 |

- **唯一鍵：`(parent_id, name)`**，不是 `name`（「其他類」會重複，見 2.2-a）
- 另建議對 `level = 2` 的 `name` 加一道應用層檢查，擋全域重名（見 2.2-b）
- 保留 `level = 1` 這層（雖然目前只有「文化」），日後若 PM 要把其他 A 分類納進來才不用改結構

### 6.2 `culture_media`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | int PK | |
| `category_id` | int FK | 指向 `culture_category` 的**第三層** |
| `title` | varchar(255) | 卡片主標 |
| `url` | varchar(500) | 影音來源網址 |
| `image` | varchar(255) NULL | 縮圖路徑 |
| `sort_order` | int | 分類內排序 |
| `is_deleted` | bool | 軟刪除 |
| `created_at` / `updated_at` | datetime | |

前台 `POST /culture-media` 只回 `is_deleted = false` 的資料。

---

## 7. 需要 PM／後端確認的事項

1. **刪除分類時，底下的影音怎麼處理**：擋住、連帶軟刪除，或搬到「其他類」？
2. **`image` 縮圖是否必填**：如果多數影音是 YouTube，要由後端抓 thumbnail 自動填，還是一律後台手動上傳？
   目前前端沒圖會顯示預設佔位圖，不會壞版。
3. **與「節慶飲食」（`/culture/food`、`/culture/festival`）無關**：兩者是各自獨立的功能，
   資料表、API 與頁面都分開，不需要互相搬移資料，舊版也不會下架。
4. **影音是否需要「上架/下架」或排程**：目前只有軟刪除，沒有狀態欄位。若 PM 有這需求要及早加。

---

## 8. 前端接上 API 時要改的地方

給前端同仁備忘，後端不需要處理：

1. `src/services/cultureTestMockApi.js` → 換成真的 `fetch`，`CATEGORY_TREE` 改讀 API 的 `categories`
2. `CultureTestPage.jsx` 的 `subCategoriesOf` 改由 API 資料建立（目前是 import 常數）
3. `item.image` 補 `envConfig.imageUrl` 前綴（比照 `SocialmediaPage.jsx:95`）
4. `adminCultureTestPage.jsx` 已是完整的 `AdminDataTable` 管理頁（比照 `/admin/socialmedia`），
   目前呼叫 mock 的 `fetchAdminCultureItems` / `addCultureItem` / `modifyCultureItem`，
   接上 API 時把這三支換成 `authenticatedFetch` 打 §5.1 的端點即可，畫面不需改動；
   圖片上傳一併從本地 blob URL 換成 `services/uploadService.js` 的 `uploadFile()`
5. 分類維護介面（§5.2）尚未實作，前後台的分類目前都來自寫死的 `CATEGORY_TREE`
