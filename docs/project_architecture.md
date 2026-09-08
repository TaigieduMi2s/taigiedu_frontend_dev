# 專案架構與頁面導覽指南 (Project Architecture & Page Guide)

這份文件旨在幫助 AI 或新加入的開發者快速掌握 `taiwaneseOMG` 專案的前端架構、目錄結構以及各個頁面的功能與路由連接方式。
在開始工作前閱讀此文件，將大幅減少熟悉專案所需的時間。

## 1. 專案技術棧 (Tech Stack)
- **核心框架**: React (使用 Vite 構建)
- **路由管理**: `react-router-dom` (BrowserRouter)
- **資料表格**: `@tanstack/react-table`（後台管理表格，如公告管理頁的 `AdminDataTable` 元件）。
- **狀態與上下文**:
  - `AuthContext` (`AuthProvider`): 處理使用者登入與權限狀態（搭配 `services/authService.js` 的 JWT Token 管理與自動刷新）。
  - `ToastProvider`: 全局提示訊息管理。
- **即時資料**: Firebase Firestore（透過 `config/firebaseOutage.js` 連線，用於停機/維護公告的即時同步）。
- **樣式**: Vanilla CSS（全局與模組化樣式結合，如 `global.css` 與各元件的 `.css` 檔）。

## 2. 核心版面結構 (Layout Structure)
應用程式由 `AppLayout` 進行組裝（位於 `src/App.jsx`），負責決定在不同路由下應該顯示哪些佈局元素：
- **`OutageTopBanner`**: 全站頂部停機/維護橫幅，會動態同步高度至 CSS 變數供版面調整。
- **`ServiceSuspensionNotice`**: 全站服務暫停公告元件（`components/Announcement/`），用於顯示停機或維護通知。
- **`GeneralAnnouncementModal`**: 一般公告彈窗（`components/Announcement/`），於前台顯示管理員發布的一般公告。
- **`Header`**: 頂部導覽列，包含漢堡選單（可觸發側邊欄）。
- **`Sidebar`**: 主網站的側邊導覽列（在特定頁面如管理後台會隱藏）。
- **`AdminSidebar`**: 專為 `/admin` 網址下的管理員後台顯示的側邊欄。
- **`MainContent`**: 各網頁內容的主要渲染區域，並處理了一些全屏展示（如 `isPreviewPage`）的預覽邏輯。
- **`Footer`**: 網頁最底部的頁腳。

## 3. 主要路由與頁面功能說明 (Routes & Pages)

專案路由主要分為三大類：**公開頁面 (Public Pages)**、**會員/保護頁面 (Protected Pages)** 以及 **管理員後台 (Admin Pages)**。

### 3.1. 公開頁面 (Public)
不需登入即可瀏覽的使用者前台頁面。對應的資料夾多位於 `src/` 根目錄或各自的功能資料夾中：

- **首頁 (`/`)**: 由預設的 `MainContent` 驅動，可能展示最新消息或是網站功能入口。
- **搜尋 (`/search`)**: `mainSearchPage/MainSearchPage.jsx`，提供站內的各類資源與資料搜尋。
- **拼音/文字 (`/transcript`)**: `transcriptPage/TranscriptPage.jsx`。
- **單字/語句 (`/phrase`)**: `phrasePage/PhrasePage.jsx`。
- **閱讀 (`/read`)**: `readPage/ReadPage.jsx`，提供閩南語文章或相關文本的閱讀模組。
- **翻譯 (`/translate`)**: `translatePage/TranslatePage.jsx`，可能是提供中台翻譯功能的工具。
- **教學資源 (`/resource`)**: `resourcePage/ResourcePage.jsx`，讓使用者尋找、下載教學檔案。內含 `/file-preview` 與 `/download` 分支功能。
- **主題融入資源 (`/topic-integration`)**: `featuredResourcePage/TopicIntegrationPage`。
- **台語地名與文化 (`/placename-culture`)**: `placenameCulturePage/PlacenameCulturePage.jsx`，臺南市 37 個行政區的地名由來與台語發音。
  - 兩層導覽以 query string 切換：無參數為臺南全圖（滑過行政區看簡介），`?district=安平區` 為單一行政區的完整介紹。
  - 地圖為 SVG，路徑資料在 `placenameCulturePage/tainanMapData.js`（自 Figma 設計稿匯出後轉檔，勿手改），由 `TainanMap.jsx` 依 `full` / `mini` / `single` 三種形態渲染。
  - ⚠️ **內容目前來自 `services/placenameCultureMockApi.js` 假資料**；上方三個下拉選單為未來擴增其他縣市地圖保留，現階段僅開放臺南市。
  - 由 `VITE_ENABLE_PLACENAME_CULTURE_FEATURE` 控制側邊欄與路由是否顯示。
  - 後端 API 設計說明見 `docs/placename_culture_api.md`，草稿規格見 `docs/openapi/placename-culture.draft.openapi.json`。
- **名人堂/台語人物 (`/celebrity`, `/celebrity/detail`)**: `celebrity/CelebrityPage.jsx` 與 `CelebrityDetails.jsx`，展示推廣台語或相關文化的人物介紹。
- **文化介紹 (`/culture/food`, `/culture/festival`)**: 介紹台灣在地美食 (`CultureFood`) 與節慶 (`CultureFestival`)。
- **台語文化（test） (`/culture-test`)**: `cultureTestPage/CultureTestPage.jsx`，影音資料庫的分類瀏覽頁。
  - **分類只收來源表第一層的「文化」這一支，並取其後兩層**（2026-08 PM 調整，前一版是「取前兩層、涵蓋 6 個第一層」）：
    - 篩選第一層 ＝ 來源表第二層：戲曲、祭典、傳統工藝、地方/產業（4 項）
    - 篩選第二層 ＝ 來源表第三層「列舉細項」：歌仔戲、布袋戲…（合計 21 項）
    - 來源表第一層（固定「文化」）**不出現在畫面上**，只留在 `parent` / `parent_category` 欄位供後端對照。
    - **其餘 A 分類（職業台語、文學、教育、新聞/訪談、藝術表現）PM 確認本頁不收**，已從假資料整批移除，勿再加回。
  - ⚠️ 第三層的「其他類」**同時屬於「傳統工藝」與「地方/產業」**，名稱不唯一。前端因為是在同一個第二層內比對才沒事；後端資料表的唯一鍵必須是 `(parent_id, name)`。
  - 下拉仍保留「無子選單分類」的分支（父項本身即可勾選），目前四類都有第三層，留作日後分類調整的防呆。
  - **篩選與呈現整套比照「媒體與社群資源」**（`socialmediaPage/`）：
    - 頁首白底橫幅：分類下拉（第一層 + 第二層飛出子選單，可跨第一層複選）+ 關鍵字搜尋
    - 點第一層＝該層底下第二層全選／全不選；已選狀態顯示於下拉按鈕文字
    - 未篩選也未搜尋 → 依第一層分區預覽，每區顯示第一列 4 筆、附「共 N 筆」與「查看全部」
    - 有篩選或搜尋 → 攤平成完整列表 + 分頁（每頁 20 筆，4 欄 × 5 列），並提供「返回全部類別」
    - 卡片為「圖片 + 主標」，點擊開新分頁到該筆影音
  - **手機版（`max-width: 768px`）的分類篩選改為 bottom sheet**，與桌機下拉是兩套 UI，由 `matchMedia` 在 JS 端擇一渲染（不是純 CSS 切換），因為兩者行為不同：
    - 由下往上滑出，高度上限 `70vh`，選項區可捲動、底部 56px 操作列固定；點遮罩、下滑手勢皆等同取消
    - **選擇暫存在 `draftSelected`，按「確認」才寫回 `selectedItems`**；桌機下拉則是點了就即時套用
    - 父分類在此為**不可選的 sticky 標題**（灰色小字加粗），只有子項可勾選；若某分類沒有子項，父項本身仍會渲染成可勾選項目（目前四類都有子項，此分支為防呆）
    - 觸發器文字：未選為 placeholder「選擇分類」、選 1 項顯示該項名稱、多項顯示「首項 +N」（桌機沿用原本的「N 個選項」規則）
    - ⚠️ 「確認」在未選任何項目時 disabled，因此**無法在面板內把已選條件清成空**（按了「清除」後確認鈕就 disabled，這次清空送不出去）；要清空需用列表上方的「返回全部類別」。
      **這是 PM 確認過要保留的行為，不是 bug，請勿自行改成「有變更就可送出」。**
    - 選取狀態的異動邏輯抽成 `withCategoryToggled` / `withAllSubsToggled` / `withSubToggled` 三個純函式，桌機套用到 `selectedItems`、手機套用到 `draftSelected`。
  - 媒體與社群資源在手機版是直接把子選單 `display: none`（等於選不到第二層），此頁刻意不沿用該行為。
  - ⚠️ **內容目前來自 `services/cultureTestMockApi.js` 假資料**：`CATEGORY_TREE` 為上述兩層分類，影音由 `buildMockItems()` 依第三層生成（每組 20~45 筆，合計約 660 筆）。回傳格式刻意比照 `POST /media`：`{ category_order, data: { 篩選第一層: [{ ..., subcategory }] } }`，一次給全部，篩選／搜尋／分頁皆由前台處理。接上真實 API 時換掉 `fetchCultureItems()` 即可，頁面不需改動。
  - **後端 API 需求規格見 `docs/culture_test_api.md`**（含前台 `POST /culture-media`、後台影音與分類 CRUD、資料表建議、待確認事項）。
  - mock 已改為「攤平陣列為單一資料來源」：前台的分組格式由 `groupForFrontend()` 推導，後台則直接讀寫該陣列，兩邊同步。
  - 由 `VITE_ENABLE_CULTURE_TEST_FEATURE` 控制前台側邊欄、後台側邊欄、後台首頁卡片與兩條路由是否顯示。
    ⚠️ 關閉時路由是 `<Navigate>` 導回首頁／後台首頁，**不是 404**，所以入口若沒一起擋就會變成「點了沒反應」。
- **職業台語（test） (`/occupation-test`, `/occupation-test/:id`)**: `occupationTestPage/OccupationTestPage.jsx`，職場情境台語教材的資源列表。
  - **版面沿用「台語教學資源共享平台」**（`resourcePage/`）：sticky 篩選列 + 卡片牆（每頁 12 筆）+ 分頁；
    網格與間距在 `OccupationTestPage.css` 比照 `ResourceContent.css`。
  - **卡片直接在頁面內組裝 `components/Card` 的積木**（見 §9），不是 `resourcePage/ResourceCard`，
    本資料夾也不再有自己的卡片元件（`OccupationCard.jsx` 已於 2026-08 移除）。
    「本頁不顯示點讚數與下載次數」的作法就是**不放 `<Card.Stats>`**——不加 prop 開關、不 fork。
    卡片在本頁的尺寸（300×400、預覽圖 222px、內容區 178px）寫在 `OccupationTestPage.css`
    的 `.otp-grid > .cc-card` 那一段；⚠️ 要調整只能改本頁 CSS，**不可改動 `components/Card` 的積木樣式**。
  - 與資源共享平台刻意不同的兩點（PM 指定）：
    1. 篩選只有**一個**分類下拉（共用 `components/CustomSelect`，含「全部」選項）+ 關鍵字搜尋，
       沒有階段／版本／內容類型多選，也沒有「上傳／刪除我的資源」按鈕。
    2. 點卡片**不另開新分頁**（資源共享平台是 `window.open` 到 `/file-preview`），改用 `navigate()`
       在站內開啟 `/occupation-test/:id`，保留側邊欄與 Header，並在詳細頁提供「返回職業台語列表」。
  - 詳細頁 `OccupationDetailPage.jsx` 為「返回列表 + 標題 + 分隔線 + **檔案預覽 + 底部『閱讀全部』按鈕**」，
    預覽區與按鈕的結構／樣式比照 `resourcePage/FilePreview`（`.otd-preview` 固定高度並 `overflow: hidden`
    裁切圖片下緣，`.otd-bottom-fixed` 絕對定位覆蓋在底部，點擊後帶檔案資訊 `navigate('/download')`）。
    **原本的說明文字（`summary` / `sections`）已於 2026-08 依 PM 指定移除**，mock 資料也不再提供這兩個欄位；
    日期／點讚數／下載數、AUTHOR、標籤、「下載資源」與「點讚資源」按鈕**這頁一律不放**（2026-08 PM 指定），
    需要時才從 FilePreview 補回來。
  - 卡片內容為「預覽圖 + 檔案類型標籤 + 標題 + 上傳者」（即 `Card.Preview` + `Card.FileType` +
    `Card.Title` + `Card.Uploader`），尺寸與資源共享平台相同（300×400）；
    ⚠️ **標籤（`Card.Tags`）已於 2026-08 依 PM 指定移除**，前後台與 mock 資料都不再有 `tags` 欄位，勿再加回。
    與它的唯一差別是**不顯示右上角的點讚數與下載次數**（本功能不記錄這兩個數字，
    mock 資料也沒有 `likes` / `downloads` 欄位）。
  - 列表**不顯示「共 N 筆」總數**（僅底部分頁），與資源共享平台一致。
  - ⚠️ **內容來自 `services/occupationTestMockApi.js` 假資料**：分類 `CATEGORY_OPTIONS` 目前為
    **醫療長照／行業台語**兩項，各 18 筆（合計 36 筆），一次回傳全部，篩選／搜尋／分頁皆由前台處理。
    分類與內容日後改由後端資料庫匯入，屆時換掉 `fetchOccupationResources()` / `fetchOccupationCategories()` 即可，頁面不需改動。
    詳細頁的點讚只改前端狀態、下載尚無實際檔案。
  - 由 `VITE_ENABLE_OCCUPATION_TEST_FEATURE` 控制前台側邊欄、後台側邊欄、後台首頁卡片與三條路由是否顯示。
- **社群媒體/影音 (`/socialmedia`)**: `socialmediaPage/SocialmediaPage`，整合外部平台（如 YouTube/Podcast）的影音資源。
- **認證考試 (`/exam`)**: `examPage/ExamPage`，提供台語認證的相關資訊。
- **親屬關係計算機 (`/relative-calculator`)**: `relativeCalculatorPage/RelativeCalculatorPage.jsx`，提供親屬稱謂查詢與計算功能。
- **驗證登入 (`/login`, `/register`)**: 使用者登入註冊頁面 (`resourcePage/` 目錄內，`LoginPage.jsx` / `RegisterPage.jsx`)。
- **其他靜態頁面**:
  - `/terms` (服務條款，`TermsPage.jsx`)
  - `/policy` (隱私權政策，`PolicyPage.jsx`)
  - `/team` (團隊介紹，`TeamPage.jsx`)

### 3.2. 會員/保護頁面 (Protected - requireAuth)
需要一般會員登入才能操作的路由（透過 `ProtectedRoute` 封裝）：
- **`/upload-resource`**: `UploadResource.jsx`，允許使用者上傳教學資源。
- **`/delete-resource`**: `DeleteResource.jsx`，資源管理邏輯。

### 3.3. 管理員後台頁面 (Admin - AdminRoute)
需具備管理員權限，所有路由以 `/admin` 開頭，主要集中在 `src/adminPage/` 資料夾下，並有獨立的 `AdminSidebar` 導覽系統（選單定義於 `adminSidebar.jsx`）。各頁面元件多位於 `adminPage/adminContent/adminHome/`。主要功能為**網站內容建置與管理**：

> **權限模型**：後台採 bitmask flags（`config/permissions.js`）：`CONTENT_MANAGER = 1`（內容增刪修、管理會員上傳資格）、`SYSTEM_MANAGER = 2`（公告管理、權限管理、系統設定）。flags 由 `/api/user/login`、`/auth/refresh`、`/auth/me`、`/admin/member/list` 回傳，是唯一的權限來源；舊的 `role` 字串與 `SUPER_ADMIN` 角色前後端皆已移除，勿再新增相關判斷。路由層以 `<ProtectedRoute requiredFlag={FLAGS.X}>` 控管，元件層用 `useAuth()` 的 `isSuperAdmin()`（= SYSTEM_MANAGER）／`isContentManager()`。
>
> **權限 vs 帳號狀態**：兩者職責分開——flags 是後台權限，`isSuspended`（布林）是帳號啟用狀態，停用時另有 `suspendAt` / `suspendReason`。不要用其中一個推導另一個。
>
> **內容頁唯讀**：「新增／修改／刪除內容」僅限 CONTENT_MANAGER。所有內容管理頁一律用 `adminPage/useContentEditPermission.js` 取得 `canEditContent`，用它同時（1）隱藏新增鈕與表格的編輯／刪除欄、（2）關閉拖曳排序、（3）在送出的 handler 內再擋一次並吐 `NO_EDIT_PERMISSION_MESSAGE`，並在表格上方放 `components/ReadOnlyNotice`。新增內容管理頁時請沿用這個模式。
>
> **手機版**：`AdminSidebar` 與前台 `Sidebar` 一樣是滑入式抽屜，由 `Header` 漢堡鈕透過 `AppLayout` 的 `sidebarOpen` 控制（樣式在 `adminSidebar.css` 的 `.sidebar.admin-sidebar` media query）。

- **首頁面板 (`/admin`)**: `adminMain.jsx`。
- **主頁搜尋管理**:
  - 考試資訊 (`/admin/main-search/test`): `adminTestPage.jsx`。
  - 活動快訊 (`/admin/main-search/news`): `adminNewsPage.jsx`。
  - **前後台一律依日期「由新到舊」排序**（TAIGIE-254，2026-09）。這兩支後台與前台首頁的排序規則必須一致：
    - 前台 `POST /info/test`、`POST /info/news` 是 **ORDER BY 日期 DESC**（同日期再依 `id` 遞增）。
    - 後台因此也用同一套規則：`[...publishedItems].sort(sortByTimestampDesc)`。
      JS 的 `sort` 是穩定排序，而 `GET /admin/main-search/*` 回傳本身是 `seq`／`id` 遞增，
      所以**同日期的先後也會跟前台一致**（已於 2026-09 用正式資料逐筆比對驗證過）。
    - ⚠️ **不要再用 localStorage 記順序**：舊版兩支後台都會把排序寫進 localStorage 再蓋回畫面，
      那份順序只存在單一瀏覽器，導致「後台看到 A 排序、前台與別台電腦看到 B 排序」，正是這張票的成因，已移除。
    - ⚠️ **也不要改成「照 API 回傳的順序顯示」**：`GET /admin/main-search/*` 是照 `seq` 遞增（＝建立順序，
      由舊到新），跟前台相反，照著顯示會讓後台整個反過來。
  - ⚠️ **拖曳排序目前對前台無效（待後端處理）**：`POST …/change` 會把順序寫進後端的 `seq`，
    但 `/info/test`、`/info/news` **並不讀 `seq`**（實測：後台 `seq` 為 `2,3,6,7,8,16,17,23,31,32`，
    前台卻回 `32,31,23,17,16,…` 的日期新到舊）。要讓拖曳的順序在前台生效，
    需要後端把這兩支端點改成 `ORDER BY seq`。
    - 拖曳只改本地 state，**要按「儲存順序」才會送 `POST …/change`**；未儲存時畫面底部會浮出
      `components/DragConfirmButton` 的 sticky 操作列（見下），並在關閉分頁時攔截。
    - 「刪除紀錄」沒有排序需求，同樣依 `timestamp` 由新到舊。
- **節慶飲食管理 (`/admin/culture/food`, `/admin/culture/festival`)**: `adminFoodPage.jsx` / `adminFestivalPage.jsx`。
- **台語文化（test）管理 (`/admin/culture-test`)**: `adminCultureTestPage.jsx`，台語文化影音的內容管理頁。
  - **版面與操作整套比照「媒體與社群資源」後台**（`adminSocialmediaPage.jsx`）：
    麵包屑分類篩選（第一層 + 連動的第二層）、「目前資源／刪除紀錄」狀態切換、`AdminDataTable`（每頁 20 筆、不啟用拖曳）、
    `AdminModal` 表單，刪除為軟刪除並可從刪除紀錄復原。
  - **欄位依前台 `/culture-test` 實際使用的欄位設定**：
    表格為「編輯｜分類｜子分類｜標題｜影音連結｜圖片｜刪除／復原｜建立時間」；
    表單為「標題、影音連結、分類（第二層）、子分類（第三層）、圖片（選填）」。
  - 與媒體與社群資源刻意不同的兩點：
    1. 類別是**單選的兩層連動下拉**（一筆影音只屬於一個第三層分類），不是可複選的勾選框；
       送出時以 `getCategoryId(category, subcategory)` 轉成 `category_id`（「其他類」重名，不可只用名稱識別）。
    2. **圖片非必填**（媒體與社群資源是必填），沒圖時前台顯示預設佔位圖。
  - ⚠️ **資料與前台共用 `services/cultureTestMockApi.js` 的同一份記憶體假資料**（`fetchAdminCultureItems` /
    `addCultureItem` / `modifyCultureItem`），因此後台改完切到前台看得到結果，但**重整就會回到初始假資料**。
    圖片上傳在 mock 階段只產生本地 blob URL，接上 API 後改用 `services/uploadService.js` 的 `uploadFile()`。
    端點規格見 `docs/culture_test_api.md` §5。
  - 支援 `?category=戲曲` 參數，後台首頁（`adminMain.jsx`）的「台語文化（test）」卡片以四個第一層分類為連結，即以此帶入預設篩選（與媒體與社群資源同一套做法）。
  - 受 `VITE_ENABLE_CULTURE_TEST_FEATURE` 控制（後台側邊欄、後台首頁卡片、路由三處都要一起擋）；沿用 `useContentEditPermission` 的唯讀模式。
  - 分類本身的維護介面（`/admin/culture-category`，見 `docs/culture_test_api.md` §5.2）**尚未實作**，分類目前來自寫死的 `CATEGORY_TREE`。
- **職業台語（test）管理 (`/admin/occupation-test`)**: `adminOccupationTestPage.jsx`，職業台語教材的內容管理頁。
  - 頁面外框（類別篩選、「目前資源／刪除紀錄」切換、新增鈕、`AdminModal` 表單）比照其他後台分頁
    （`adminSocialmediaPage` / `adminCultureTestPage`），刪除為軟刪除並可從刪除紀錄復原。
  - ⚠️ **清單不是 `AdminDataTable`，而是卡片牆**（PM 指定，2026-08）：直接組裝 `components/Card` 的積木，
    組法與尺寸都比照前台 `/occupation-test`（預覽圖 + 檔案類型標籤 + 標題 + 上傳者，
    不放 `Card.Stats`、不放 `Card.Tags`），每頁 12 筆 + `mainSearchPage/Pagination`。
    管理操作收在**滑過卡片才浮出的半透明操作層**（預覽／編輯／刪除，`:focus-within` 也會顯示以支援鍵盤），
    卡片本身不顯示建立時間。
  - 「預覽」導到**職業台語專用的預覽頁 `/admin/occupation-test/preview`**（`adminOccupationPreviewPage.jsx`），
    資料塞在 query string，該頁不打任何 API。
    ⚠️ **刻意不共用 `/admin/file-preview`**：那頁的「下架資源」按鈕打 `/admin/resource/status`（資源共享平台的端點），
    職業台語的資料不在那組 API 裡；且本功能需要「返回列表」，而那頁是另開分頁進來的、沒有返回的對象。
    要在那支加開關就得改到共用檔案，因此另寫一份（PM 指定），**代價是兩邊樣式各自維護**。
    ⚠️ 另外這裡是 **`navigate()` 站內導頁，不是 `window.open` 另開分頁**（資源共享平台後台是另開分頁）。
    原因：access token 只存在記憶體（`services/authService.js`），新分頁拿不到，得靠 `/auth/refresh` 的 cookie 救回；
    本機 `localhost:3000` 打 `api.taigiedu.com` 屬跨站、cookie 送不出去 → 被導去 `/login`，
    而 `ProtectedRoute` 轉跳時只保留 `location.pathname`、**丟掉 query string**，回來後參數就全沒了。
    同分頁導頁不經過這段轉跳，參數才留得住。（正式站同網域下沒這問題，但為了本機可用一律走 `navigate()`。）
    卡片尺寸寫在 `adminOccupationTestPage.css` 的 `.oca-card-slot` 那一段；
    ⚠️ 要調整只能改本頁 CSS，**不可改動 `components/Card` 的積木樣式**。
  - **欄位依前台 `/occupation-test` 實際使用的欄位設定**：
    表單為「名稱、類別、上傳檔案、預覽縮圖」。
    ⚠️ **`uploader`（上傳者）不放在表單裡**：新增時由後端依 Bearer Token 自動帶入登入者名稱，
    修改時維持原值不動。mock 沒有 Token，暫時由頁面帶 `AuthContext` 的 `user.name` 代替；
    接上真實 API 後請把 `uploader` 從 payload 移除，改由後端寫入。
    `fileType` 由上傳檔案的副檔名自動帶入（前台卡片標籤只有 pdf/ppt/doc 三種），不手動填；
    `topic` 只用於前台搜尋字串，後台不提供輸入，新資料留空。
  - **上傳檔案與預覽縮圖比照前台「上傳資源」**（`resourcePage/UploadResource`）：限 PDF/PPT/DOC、100MB，
    選好檔案後自動產生縮圖，也可手動上傳自訂圖片覆蓋；已手動指定過就不會被自動縮圖蓋掉。
    ⚠️ 縮圖產生邏輯抽在 `utils/documentThumbnail.js`（PDF 走 pdfjs 渲染第一頁、DOCX 走 mammoth 取文字、
    DOC/PPT 畫佔位圖）。這份邏輯與 `UploadResource.jsx` 內的同名函式**同源但各自一份**——
    後者屬於「共用元件預設不可修改」的範圍（見 CLAUDE.md §9.1），要合併需先取得同意。
  - 支援 `?category=醫療長照` 參數，後台首頁的「職業台語（test）」卡片即以此帶入預設篩選。
  - ⚠️ **資料與前台共用 `services/occupationTestMockApi.js` 的同一份記憶體假資料**（`fetchAdminOccupationResources` /
    `addOccupationResource` / `modifyOccupationResource`），後台改完切到前台看得到結果，但**重整就會回到初始假資料**。
    mock 階段檔案與縮圖都只產生本地 blob URL，接上 API 後改用 `services/uploadService.js` 的 `uploadFile()`。
  - 受 `VITE_ENABLE_OCCUPATION_TEST_FEATURE` 控制（後台側邊欄、後台首頁卡片、路由三處都要一起擋）；
    沿用 `useContentEditPermission` 的唯讀模式。
- **認證考試管理 (`/admin/exam/info`)**: `examPage/adminExamInfo.jsx`，編輯考試基本資訊。
  - 註：`examPage/` 下另有 `adminExamBooks.jsx`、`adminExamChannels.jsx`，但目前尚未在 `App.jsx` 中掛載路由。
- **媒體與社群資源管理 (`/admin/socialmedia`)**: `adminSocialmediaPage.jsx`，編輯與新增推薦的影音/Podcast連結。
  - 類別下拉選單由 API 資料動態產生（`item.category`，支援 `父>子` 格式）。支援 `?category=社群` 參數，後台首頁的類別連結即以此帶入預設篩選。
- **教學資源平台管理**:
  - 審核/上傳資源 (`/admin/resource`, `/admin/resource/upload`): `adminresourcePage/AdminResourcePage.jsx`。
  - 編輯課本選單/首圖 (`/admin/resource/header`): `adminresourcePage/ResourceHeaderPage.jsx`。
- **會員管理 (`/admin/member`)**: `adminMemberPage.jsx`，管理網站後台/前台會員權限。
  - 「停用／恢復上傳資格」走 `POST /admin/member/status`（需 CONTENT_MANAGER，後端據 `action` 設定 `isSuspended`、`suspendAt`、`suspendReason`）；「設定管理員身分」走 `POST /admin/member/flags`（需 SYSTEM_MANAGER，直接帶 flags 整數）。兩者封裝在 `services/memberService.js`。
  - 三個視圖的分流依據：管理員名單 = `!isSuspended && flags > 0`、會員名單 = `!isSuspended && flags === 0`、停用會員名單 = `isSuspended`（並顯示 `suspendReason` / `suspendAt`）。
- **檔案預覽 (`/admin/file-preview`)**: 後台專屬預覽介面，`adminresourcePage/AdminFilePreview.jsx`。
  - 資料**全部從 query string 讀取**，開啟時不打 API；由 `AdminResourcePage` 以 `window.open` 帶參數過去。
  - 唯一會打 API 的是「下架資源」按鈕（`POST /admin/resource/status`，資源共享平台專用）。
  - ⚠️ **這支是資源共享平台專用，其他功能不要共用**。職業台語需要「隱藏下架鈕 + 返回列表」，
    若在此加開關就得改動共用檔案，因此另開一頁 `adminOccupationPreviewPage.jsx`（見上）。
- **職業台語檔案預覽 (`/admin/occupation-test/preview`)**: `adminOccupationPreviewPage.jsx`。
  - 版面比照 `AdminFilePreview`（管理員檢視橫幅 + 紅色標題 + AUTHOR + 置中預覽圖），但**兩邊各自維護**，
    class 前綴為 `oap-`。沒有下架按鈕與管理軌跡，多了「‹ 返回職業台語列表」。
  - 資料全部從 query string 讀（`title` / `imageUrl` / `fileType` / `uploader` / `category`），不打任何 API。
- **公告管理 (`/admin/announcement`)**: `adminAnnouncementPage.jsx`，管理一般公告與停機公告（含上架/排程/下架狀態）。
  - ⚠️ **目前此頁仍使用內建 `MOCK_DATA` 假資料，尚未串接後端 API**；新增/編輯/刪除僅更新本地 state，重整即重置。

## 4. 專案目錄結構 (Directory Structure)
主要開發均在 `src/` 下，採用**按功能或模組(Feature-based)**來劃分資料夾，而不是單純依類型（components, views）劃分：
```text
src/
 ├── adminPage/          # 所有後台管理的介面與邏輯元件
 │    ├── adminMain.jsx        # 後台首頁面板
 │    ├── adminSidebar.jsx     # 後台側邊欄選單定義
 │    └── adminContent/adminHome/  # 各後台管理頁（公告、會員、資源、考試、節慶飲食…）
 ├── assets/             # 靜態圖片、圖示資源
 ├── components/         # 共用 UI 元件，重要子目錄：
 │    ├── Card/               # 卡片積木（composition，class 前綴 cc-），見 §9
 │    ├── Announcement/        # 前台公告：ServiceSuspensionNotice、GeneralAnnouncementModal
 │    ├── OutageTopBanner/     # 全站停機頂部橫幅
 │    ├── AdminDataTable/      # 後台資料表格（tanstack table 封裝）
 │    ├── AdminModal/          # 後台彈窗
 │    ├── DatePicker/          # 日期選擇器
 │    ├── DragConfirmButton/   # 拖曳排序的「未儲存」sticky 操作列（固定在視窗底部，見 §3.3 主頁搜尋管理）
 │    ├── HorizontalScrollRow/ # 水平捲動列
 │    ├── UnifiedModal/        # 通用 Modal
 │    ├── ReportIssue/         # 前台「回報問題」入口與彈窗（建構在 UnifiedModal 之上）
 │    ├── ProtectedRoute.jsx   # 路由守衛（含 AdminRoute）
 │    └── Toast.jsx            # 全局提示
 ├── config/             # 環境/全域設置：index.js、permissions.js、firebaseOutage.js
 ├── contexts/           # React Context (AuthContext.jsx)
 ├── services/           # 後端串接：authService.js（JWT）、outageService.js（Firestore 停機公告）、featuredResourceMockApi.js
 ├── shared/             # 跨元件共用狀態，如 resourceStore.js
 ├── utils/              # 純函式工具，如 documentThumbnail.js（依上傳文件產生預覽縮圖）
 ├── relativeCalculatorPage/ # 親屬關係計算機頁面與樣式
 ├── styles/             # 全局樣式 (`global.css`)
 └── [各功能資料夾]/       # 如 readPage, resourcePage, culture, examPage 等，各自包含 JSX 與專屬 CSS 樣式
```

## 5. 公告與停機系統 (Announcement & Outage System)
本專案的公告功能橫跨前後台，串接方式不一致，接手時請特別留意：
- **停機/維護公告（前台顯示）**: 透過 `services/outageService.js` 訂閱 Firebase Firestore (`config/firebaseOutage.js`) 即時資料，由 `OutageTopBanner` 與 `ServiceSuspensionNotice` 呈現。
- **一般公告（前台顯示）**: 由 `components/Announcement/GeneralAnnouncementModal.jsx` 呈現。
- **公告管理（後台）**: `adminAnnouncementPage.jsx` 目前為 **mock 階段**，尚未與上述前台資料來源（Firestore/API）打通。若要正式上線，需在 `services/` 新增公告 API 模組並替換頁內的 `MOCK_DATA` 與本地 state 操作。

## 6. 資料列表頁的篩選列與下拉選單（共用規範）

前台各資料列表頁的搜尋／篩選列行為已統一，新增或修改列表頁時請沿用：

- **Sticky 篩選列**：具搜尋／篩選功能的資料列表頁，外層套 `global.css` 的 `.page-filter-header`。
  它負責白底、陰影與 `position: sticky`，`top` 為 `calc(var(--header-height) + var(--otb-height, 0px))`，
  因此停機橫幅出現時也會自動往下讓位。已套用：教學資源共享平台、俗諺語、媒體與社群資源、認證考試、台語文化（test）、台語地名與文化、職業台語（test）。
  - 篩選列若位於左右有 padding 的容器內（如 `/resource`），加上 `.is-bleed` 並在容器上設 `--filter-bleed-x`，白底才會通到邊緣。
  - **例外**：台語文字轉換（`/translate`）**刻意不 sticky**，篩選列隨內容正常捲動（PM 指定）。
- **下拉選單定位**：所有篩選下拉一律 portal 到 `#root`、以 `position: fixed` 定位，座標由
  `components/AnchoredMenu/useAnchoredMenu.js` 依 trigger 的 `getBoundingClientRect()` 算出，並在
  `scroll`（capture）／`resize` 時重算。效果是：頁面捲動時選單永遠貼著原篩選欄位，且下方空間不足會往上翻、
  左右超出會夾回畫面內、過長則以 `max-height` + 內部捲動處理。
  使用此 hook 的元件：`components/CustomSelect`、`phrasePage/multiselect`（教學資源／俗諺語／主頁搜尋／後台資源審核共用）、
  `socialmediaPage/SocialmediaPage` 與 `cultureTestPage/CultureTestPage` 的分類下拉。
  - ⚠️ 選單 portal 之後就不在 trigger 的 DOM 子樹內，**click-outside 判斷必須同時排除 trigger 與選單**。
  - 媒體與社群資源、台語文化（test）的第二層飛出子選單改由 React state 控制顯示（不再靠 CSS `:hover`），
    並同樣以 `position: fixed` 定位（見各頁的 `positionSubmenu`）——因為主選單加了內部捲動，
    子選單若維持 `absolute` 會被 `overflow` 裁掉。
  - 手機版（`max-width: 768px`）的分類篩選仍是 bottom sheet（`components/CategoryFilterSheet`），不走上述下拉。

## 7. 回報問題 (Report Issue)

前台頁面共用的「回報問題」流程，元件放在 `components/ReportIssue/`，依 Figma
（PD 台語文 workshop － WF paper prototype 2025，node `2946-3629`）實作：

- **入口統一在全站 Footer**（TAIGIE-252 定案，2026-09）：`src/Footer.jsx` 多一顆「回報問題」按鈕，
  點了開同一個 `ReportIssueModal`；**後台（`/admin` 開頭）不顯示**。
  ⚠️ 原本各頁面內容區底部那一行入口（`ReportIssueLink`）已依 PM 指示隱藏，
  該元件目前固定回傳 `null`，五個頁面的 `<ReportIssueLink pageKey="…" />` 呼叫端保留但不會渲染任何東西。
  日後若要恢復「從某一頁直接帶著功能開啟」，把 `pageKey` 傳給 `ReportIssueModal` 即可（會當成預設值）。
- **彈窗是 UnifiedModal 的延伸**：`ReportIssueModal` 以 `components/UnifiedModal` 當外框
  （沿用遮罩、關閉鈕、動畫與手機版 bottom sheet），只負責表單內容，因此不需要改動 UnifiedModal 本身。
- **各頁差異全部收斂在 `reportIssueConfig.js`**：一個 `pageKey` 對應「功能名稱」與「問題細項選項」。
  新頁面要加入回報功能時，只要在這支檔案加一筆設定，不必碰彈窗程式碼；
  `REPORT_FEATURE_OPTIONS` 會自動長出「功能頁面」下拉的選項（陣列順序＝下拉顯示順序）。
- **三個下拉的連動**（都用共用的 `components/CustomSelect`）：
  1. **功能頁面**（必填）：因為入口在 Footer，彈窗無從得知使用者要回報哪個功能，**由使用者自己選**
     （台語俗諺語／台語文化－飲食／台語文化－節慶／資源共享平台／媒體與社群資源／認證考試）。
  2. **問題類別**：固定為「問題回報 / 其他」。
  3. **問題細項**：**只有選「問題回報」才會出現**，選項由步驟 1 選到的功能決定；
     切回「其他」或換功能時都會清掉細項的值（避免送出殘留或不屬於該功能的資料）。
- ⚠️ **功能與細項清單目前是前端寫死的**。是否改由後端提供（讓管理員自行維護）已另開票與後端討論，
  規格與待確認事項見 `docs/jira/report-issue-category-api.md`。
- **附件**：非必填，**僅收 JPG／PNG、上限 100MB**，送出時先呼叫 `services/uploadService.js` 的
  `uploadFile()` 取得路徑再帶進 payload。
  （設計稿中「媒體與社群資源」那張圖的提示文字寫成 PDF／PPT／DOC，與流程圖註記衝突，一律以「只有圖片檔」為準。）
- ⚠️ **後端 `POST /issue_report` 尚未實作**：`services/reportIssueService.js` 預設走 mock（只在 console 印 payload）。
  後端上線後把 `.env` 的 `VITE_ENABLE_REPORT_ISSUE_MOCK` 設為 `false` 即改打真實 API，元件不需修改。
  API 規格與待確認事項見 `docs/report_issue_api.md`。

## 8. 常見工作流程建議 (Workflow Tips)
- **新增公開頁面**: 在 `src/` 下建立對應的資料夾與元件，於 `App.jsx` 引入並添加 `<Route>`，並視情況更新 `Sidebar.jsx` 的選單路徑。
- **新增後台管理項目**: 於 `src/adminPage/adminContent/adminHome/` 建立管理面板，在 `App.jsx` 使用 `<AdminRoute>` 添加路由，最後更新 `adminSidebar.jsx` 的選單陣列。
- **API 串接**: 若要讀取或更新資料，請先檢視 `src/services/` 下是否已有相關模組（多透過 `authService.js` 的 `authenticatedFetch` 帶 Token 發送請求），並注意在元件中妥善處理 loading／error 等異步狀態。部分頁面（如公告管理）仍為 mock，串接時需自行補上 service 層。

## 9. 卡片元件與共用元件的修改規範

### 9.1 修改共用元件的前置程序

`src/components/` 與 `src/resourcePage/` 底下的共用元件**預設不可修改**。
確實需要改動時：

1. **先說明**改哪個檔、為什麼、對現有頁面的影響，**經同意才動手**；
2. 只允許**向下相容的加法**改動（不改既有 props 語意、不改既有 class 的宣告內容）；
3. 完成後回報**所有被修改的檔案清單與驗證結果**。

### 9.2 卡片一律用積木組裝，不 fork

- **基礎積木在 `src/components/Card/`**：`Card`、`Card.Preview`、`Card.FileType`、`Card.Stats`、
  `Card.Content`、`Card.Title`、`Card.Uploader`、`Card.Tags`，由使用端自行組裝需要的部分。
- **業務卡片命名 `[名詞]Card`**（如 `ResourceCard`），且**必須由積木組裝**。
- **差異僅在「顯示哪些欄位」者，一律用組裝解決**——不要 fork 一份新元件，也**不要加 boolean prop 開關**。
  例：職業台語頁不顯示點讚數與下載次數，作法就是不放 `<Card.Stats>`。
- **積木只負責「長什麼樣」（顏色、圓角、陰影、字級、hover），不負責「多大」**：
  積木刻意不寫死任何高度，卡片高、預覽圖高、內容區高由使用端的 CSS 自己給。
  ⚠️ `Card.Preview` 以 background-image 呈現，**使用端沒給高度就是 0 高**。
- **要微調視覺**，優先覆寫 `.cc-card` 層級的 CSS variables（`--cc-card-radius`、`--cc-content-gap`…），
  在**使用端自己的 CSS** 覆寫；**禁止為了單一頁面去改 `components/Card/Card.css`**。
- 現有的兩個使用端可當範例：`resourcePage/ResourceCard.jsx`（含 Stats）、
  `occupationTestPage/OccupationTestPage.jsx`（不含 Stats，尺寸寫在該頁 CSS）。

## 10. 外部樣式表依賴（Bootstrap CDN）

`index.html` 從 CDN 載入 **Bootstrap 5.1.1 的完整 CSS 與 JS**
（`https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/…`，CSS 在 `<head>`，因此**排在所有專案樣式之前**）。
它是全域的，會命中任何同名 class。

⚠️ **新增元件時，class 命名必須檢查是否與 Bootstrap 交集**（`.card`、`.card-header`、`.card-title`、
`.card-body`、`.badge`、`.row`、`.col`、`.btn`… 都是 Bootstrap 既有名稱）。
命名撞上時，Bootstrap 的宣告會成為該元素樣式的一部分，日後改名就會「莫名其妙掉樣式」。
`components/Card/` 全面採用 `cc-` 前綴就是為了避開這件事。

已知正踩在這個坑上、**不可自行清理**的兩處（`resourcePage/ResourceCard.jsx` 內有註解說明）：

| 元素 | 保留的舊 class | 實際樣式來源 |
| --- | --- | --- |
| 資源卡片預覽圖 | `card-header` | Bootstrap 的 `.card-header`：預覽圖下緣 1px 底線、上緣 3px 圓角 |
| 資源卡片標題 | `card-title` | `adminPage/adminMain.css` 的 `.card-title`（排在 `ResourceCard.css` 之後）：字級／字重／顏色／下方 16px |

另外 `.resource-card` 這個名稱同時被 `celebrity/CelebrityDetails.css` 定義並使用，
兩者靠打包後的載入順序在互相覆蓋——動到其中任一支的 `.resource-card` 規則時，請一併確認另一頁。
