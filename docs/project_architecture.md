# 專案架構與頁面導覽指南 (Project Architecture & Page Guide)

這份文件旨在幫助 AI 或新加入的開發者快速掌握 `taiwaneseOMG` 專案的前端架構、目錄結構以及各個頁面的功能與路由連接方式。
在開始工作前閱讀此文件，將大幅減少熟悉專案所需的時間。

## 1. 專案技術棧 (Tech Stack)
- **核心框架**: React (使用 Vite 構建)
- **路由管理**: `react-router-dom` (BrowserRouter)
- **狀態與上下文**: 
  - `AuthContext` (`AuthProvider`): 處理使用者登入與權限狀態。
  - `ToastProvider`: 全局提示訊息管理。
- **樣式**: Vanilla CSS (全局與模組化樣式結合，如 `global.css` 與各元件的 `.css` 檔)。

## 2. 核心版面結構 (Layout Structure)
應用程式由 `AppLayout` 進行組裝（位於 `src/App.jsx`），負責決定在不同路由下應該顯示哪些佈局元素：
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
- **主題融入資源 (`/featured-resource/topic-integration`)**: `featuredResourcePage/TopicIntegrationPage`。
- **名人堂/台語人物 (`/celebrity`, `/celebrity/detail`)**: `celebrity/CelebrityPage.jsx` 與 `CelebrityDetails.jsx`，展示推廣台語或相關文化的人物介紹。
- **文化介紹 (`/culture/food`, `/culture/festival`)**: 介紹台灣在地美食 (`CultureFood`) 與節慶 (`CultureFestival`)。
- **社群媒體/影音 (`/socialmedia`)**: `socialmediaPage/SocialmediaPage`，整合外部平台（如 YouTube/Podcast）的影音資源。
- **認證考試 (`/exam`)**: `examPage/ExamPage`，提供台語認證的相關資訊。
- **驗證登入 (`/login`, `/register`)**: 使用者登入註冊頁面 (`resourcePage/` 目錄內)。
- **其他靜態頁面**: 
  - `/terms` (服務條款)
  - `/policy` (隱私權政策)
  - `/team` (團隊介紹)

### 3.2. 會員/保護頁面 (Protected - requireAuth)
需要一般會員登入才能操作的路由（透過 `ProtectedRoute` 封裝）：
- **`/upload-resource`**: `UploadResource.jsx`，允許使用者上傳教學資源。
- **`/delete-resource`**: `DeleteResource.jsx`，資源管理邏輯。

### 3.3. 管理員後台頁面 (Admin - AdminRoute)
需具備管理員權限，所有路由以 `/admin` 開頭，主要集中在 `src/adminPage/` 資料夾下，並有獨立的 `AdminSidebar` 導覽系統。主要功能為**網站內容建置與管理**：
- **首頁面板 (`/admin`)**: `adminMain.jsx`。
- **測驗/消息管理 (`/admin/main-search/test`, `./news`)**: 管理首頁的測試或最新消息發布。
- **文化內容管理 (`/admin/culture/food`, `./festival`)**: 編輯美食與節慶內容。
- **社群媒體管理 (`/admin/socialmedia`)**: 編輯與新增推薦的影音/Podcast連結。
- **考試資訊管理 (`/admin/exam/...`)**: `/info` (基本資訊), `/books` (推薦書籍), `/channels` (推薦頻道)。
- **教學資源管理 (`/admin/resource...`)**: 審核、上傳資源 (`AdminResourcePage`) 及其首圖/標題 (`ResourceHeaderPage`)。
- **會員管理 (`/admin/member`)**: `AdminMemberPage`，管理網站後台/前台會員權限。
- **檔案預覽 (`/admin/file-preview`)**: 管理後台專屬的預覽介面。

## 4. 專案目錄結構 (Directory Structure)
主要開發均在 `src/` 下，採用**按功能或模組(Feature-based)**來劃分資料夾，而不是單純依類型（components, views）劃分：
\`\`\`text
src/
 ├── adminPage/          # 所有後台管理的介面與邏輯元件
 ├── assets/             # 靜態圖片、圖示資源
 ├── components/         # 共用的小型 UI 元件 (如 Toast, ProtectedRoute 等)
 ├── config/             # 環境或全域設置
 ├── contexts/           # React Context (AuthContext)
 ├── services/           # 負責呼叫後端 API 的各種函式
 ├── styles/             # 全局樣式 (`global.css`)
 └── [各功能資料夾]/       # 如 readPage, resourcePage, culture, examPage 等，各自包含 JSX 與專屬 CSS 樣式
\`\`\`

## 5. 常見工作流程建議 (Workflow Tips)
- **新增公開頁面**: 在 `src/` 下建立對應的資料夾與元件，於 `App.jsx` 引入並添加 `<Route>`，並視情況更新 `Sidebar.jsx` 的選單路徑。
- **新增後台管理項目**: 於 `src/adminPage/adminContent/adminHome/` 建立管理面板，在 `App.jsx` 使用 `<AdminRoute>` 添加路由，最後更新 `adminSidebar.jsx`。
- **API 串接**: 若要讀取或更新資料，請檢視 `src/services/` 下是否已有相關模組（透過 Auth Token 發送請求），並注意在元件或頁面中使用合適的方法去處理異步邏輯。
