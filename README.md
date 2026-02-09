# 臺語文學習平台 (TaiwaneseOMG)

這是一個專為臺語文學習而設計的互動式網頁平台，提供豐富的學習資源、翻譯工具、以及文化內容，幫助使用者深入了解並學習臺灣本土語言。

## 專案特色

- 🎯 **多功能學習工具**：包含翻譯、轉譯、詞彙查詢等實用功能
- 📚 **豐富的教育資源**：提供認證考試、推薦用書、教育頻道等學習資源
- 🎭 **文化內容**：介紹臺灣節慶、飲食文化、名人等在地文化
- 📱 **響應式設計**：支援各種裝置，隨時隨地學習
- 🔐 **JWT 認證系統**：安全的使用者驗證與自動 Token 刷新機制
- 👥 **會員系統**：個人化學習體驗與進度追蹤
- 🛡️ **管理後台**：完整的資源管理與使用者權限控制
- ✅ **E2E 測試**：使用 Playwright 確保應用程式品質

## 技術棧

### 前端核心
- **前端框架**：React 18.3+ with Vite 7.2+
- **路由管理**：React Router DOM 6.27+
- **樣式**：原生 CSS（無框架依賴）
- **Markdown 渲染**：React Markdown 10.1+
- **拖放功能**：@dnd-kit (Core 6.3+ & Sortable 10.0+)
- **表格元件**：TanStack React Table 8.21+

### 開發工具
- **建置工具**：Vite 7.2+
- **程式碼檢查**：ESLint 9.13+
- **E2E 測試**：Playwright 1.57+
- **OCR 功能**：Tesseract.js 7.0+ (用於驗證碼識別)
- **圖片處理**：Sharp 0.34+

## 本地開發環境設置

### 前置需求

確保您的系統已安裝以下工具：

- **Node.js**: 建議版本 18.0 或以上
- **npm**: 隨 Node.js 一起安裝

### 安裝步驟

1. **克隆專案**

```bash
git clone https://github.com/your-username/taiwaneseOMG.git
cd taiwaneseOMG
```

2. **安裝依賴套件**

```bash
npm install
```

3. **設定環境變數**

根據您的開發需求，設置對應的環境變數檔案：

#### 開發環境 (.env.development)

在專案根目錄建立 `.env.development` 檔案：

```env
# 開發環境設定
VITE_BASE_PATH=/
VITE_API_URL=https://dev.taigiedu.com/backend
VITE_IMAGE_URL=https://dev.taigiedu.com
```

#### 正式環境 (.env.production)

在專案根目錄建立 `.env.production` 檔案：

```env
# 正式環境設定
VITE_BASE_PATH=/
VITE_API_URL=https://api.taigiedu.com/backend
VITE_IMAGE_URL=https://taigiedu.com
```

**環境變數說明：**

- `VITE_BASE_PATH`: 應用程式的基礎路徑
  - 本地/正式環境：`/`
  - GitHub Pages 部署：`/taiwaneseOMG/`
- `VITE_API_URL`: 後端 API 伺服器位址
- `VITE_IMAGE_URL`: 圖片資源伺服器位址

#### E2E 測試環境 (.env.local)

在專案根目錄建立 `.env.local` 檔案（用於 Playwright 測試）：

```env
# E2E 測試設定
BASE_URL=http://localhost:3000
TEST_USER=your_test_username
TEST_PASS=your_test_password
```

**測試環境變數說明：**

- `BASE_URL`: 測試目標 URL（本地開發或 Staging 環境）
- `TEST_USER`: 測試用帳號
- `TEST_PASS`: 測試用密碼

⚠️ **安全提醒**：請勿將 `.env.local` 提交到版本控制系統，此檔案已加入 `.gitignore`

### 啟動開發伺服器

```bash
npm run dev
```

開發伺服器將在 `http://localhost:5173` 啟動（預設埠號可能會根據可用性而變化）

### 建置專案

**開發環境建置：**
```bash
npm run build
```

**GitHub Pages 建置：**
```bash
npm run build:github
```

**正式環境建置：**
```bash
npm run build:prod
```

建置完成後，產出檔案將位於 `dist/` 目錄。

### 預覽建置結果

```bash
npm run preview
```

## 專案結構

```
taiwaneseOMG/
├── src/
│   ├── components/         # 可重用元件（Header、Sidebar、Modal 等）
│   ├── contexts/           # React Context（認證、主題等）
│   ├── services/           # API 服務層（認證、資源管理等）
│   ├── shared/             # 共用工具與常數
│   ├── assets/             # 靜態資源（圖片、圖示等）
│   ├── styles/             # 共用樣式檔案
│   ├── adminPage/          # 管理後台頁面
│   ├── celebrity/          # 名人介紹頁面
│   ├── culture/            # 文化相關頁面
│   ├── examPage/           # 認證考試頁面
│   ├── resourcePage/       # 學習資源頁面
│   ├── translatePage/      # 翻譯工具頁面
│   ├── transcriptPage/     # 轉譯工具頁面
│   ├── phrasePage/         # 詞彙頁面
│   ├── readPage/           # 閱讀頁面
│   ├── socialmediaPage/    # 社群媒體頁面
│   ├── mainSearchPage/     # 主搜尋頁面
│   ├── App.jsx             # 主應用程式元件
│   └── main.jsx            # 應用程式入口
├── tests/
│   └── e2e/                # E2E 測試
│       ├── smoke/          # 冒煙測試
│       ├── regression/     # 回歸測試
│       │   ├── auth/       # 認證測試（登入、登出等）
│       │   └── resource/   # 資源管理測試
│       └── playwright.config.js  # Playwright 配置
├── public/                 # 公開靜態檔案
├── docs/                   # 文件資料
│   └── legal/              # 法律文件（條款、隱私政策）
├── .env.example            # 環境變數範例
├── .env.development        # 開發環境變數
├── .env.production         # 正式環境變數
├── .env.local              # 本地測試環境變數（不提交）
├── package.json            # 專案配置與依賴
└── vite.config.js          # Vite 配置檔案
```

## 開發指引

### 程式碼風格

本專案使用 ESLint 進行程式碼檢查：

```bash
npm run lint
```

### 新增頁面

1. 在對應的資料夾中建立新的 `.jsx` 和 `.css` 檔案
2. 在 `App.jsx` 中註冊新路由
3. 更新 `Sidebar.jsx` 以加入導航連結（如需要）

### 環境變數使用

在程式碼中使用環境變數：

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const imagePath = `${import.meta.env.VITE_IMAGE_URL}/path/to/image.jpg`;
```

## E2E 測試

本專案使用 **Playwright** 進行端對端測試，確保應用程式的核心功能正常運作。

### 測試架構

- **測試框架**：Playwright 1.57+
- **測試模式**：Page Helpers 模式（適合中型專案）
- **測試環境**：固定桌面版 viewport (1440x900)
- **OCR 整合**：Tesseract.js 用於驗證碼自動識別

### 測試專案分組

1. **Smoke Tests** (`smoke/`)
   - 快速驗證核心功能
   - 適合 CI/CD 快速回饋

2. **Auth Setup** (`regression/auth/`)
   - 執行登入測試並保存認證狀態
   - 為其他測試提供已登入的環境

3. **Regression Tests** (`regression/`)
   - 完整的功能測試
   - 依賴 Auth Setup，確保測試在已登入狀態下執行
   - 包含資源上傳、管理等功能測試

### 執行測試

**執行所有測試：**
```bash
npm run test:e2e
```

**執行冒煙測試（快速驗證）：**
```bash
npm run test:e2e:smoke
```

**使用 UI 模式（互動式除錯）：**
```bash
npm run test:e2e:ui
```

**執行特定測試檔案：**
```bash
npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/regression/auth/login.spec.js
```

### 測試配置

測試配置位於 `tests/e2e/playwright.config.js`，主要設定包括：

- **自動啟動開發伺服器**：測試前自動執行 `npm run dev`
- **失敗時保留追蹤**：自動截圖、錄影、追蹤記錄
- **環境變數支援**：透過 `.env.local` 設定測試目標與帳號
- **CI 優化**：CI 環境下自動調整重試次數與並行設定

### 查看測試報告

測試完成後，可以查看 HTML 報告：

```bash
npx playwright show-report playwright-report
```

### 測試最佳實踐

1. **使用環境變數**：測試帳號密碼應存放在 `.env.local`，不要硬編碼
2. **等待策略**：使用 Playwright 的自動等待機制，避免手動 `setTimeout`
3. **選擇器優先順序**：優先使用 `data-testid`，其次是語義化選擇器
4. **測試隔離**：每個測試應獨立運行，不依賴其他測試的狀態（除了認證依賴）

## 部署

### GitHub Pages

使用 GitHub Actions 自動部署：

1. 確保 `.github/workflows/` 中有正確的部署配置
2. 推送到指定分支（如 `main` 或 `develop`）
3. GitHub Actions 將自動建置並部署

### 其他平台

1. 執行對應的建置指令
2. 將 `dist/` 目錄的內容部署到目標伺服器

## 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

## 聯絡方式

如有任何問題或建議，歡迎透過以下方式聯繫：

- 專案 Issue: [GitHub Issues](https://github.com/your-username/taiwaneseOMG/issues)
- Email: taigiedu@gmail.com

---

**用心學習，傳承臺語文化** 🇹🇼
