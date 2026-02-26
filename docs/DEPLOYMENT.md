# 部署配置說明

本專案支援多環境部署，所有主要的環境變數與功能開關都集中由專案根目錄下的 `.env` 檔案管理。這包含「應用程式基礎路徑（Base Path）」與「功能開關配置（Feature Toggles）」。

### 如何設定

1. **依據 `.env.example` 建立對應環境的設定檔：**
   ```bash
   # 本地開發與內部測試
   cp .env.example .env.development

   # 正式環境
   cp .env.example .env.production
   ```

2. **選擇部署環境並設定變數：**

   #### 1. 本地開發環境 (`.env.development`) / 測試環境 (`.env.local`)
   此環境為開發或測試所用，將測試中功能開啟，且避免爬蟲收錄。
   ```env
   VITE_BASE_PATH=/
   VITE_API_URL=https://dev.taigiedu.com/backend
   VITE_IMAGE_URL=https://dev.taigiedu.com

   # 功能開關（開啟測試功能、禁止搜尋引擎爬取）
   VITE_ENABLE_UNSTABLE_FEATURES=true
   VITE_ENABLE_ROBOTS_NOINDEX=true
   ```

   #### 2. 正式環境部署 (`.env.production`)
   正式上線環境，關閉測試中不穩定的功能，同時開放搜尋引擎建立索引以提升 SEO 表現。
   ```env
   VITE_BASE_PATH=/
   VITE_API_URL=https://api.taigiedu.com/backend
   VITE_IMAGE_URL=https://taigiedu.com

   # 功能開關（關閉不穩定功能、允許搜尋引擎爬取）
   VITE_ENABLE_UNSTABLE_FEATURES=false
   VITE_ENABLE_ROBOTS_NOINDEX=false
   ```

   #### 3. GitHub Pages 部署
   針對 GitHub Pages：部署路徑已自動設定在 `.github/workflows/deploy.yml`。此環境下 `VITE_BASE_PATH` 為 `/taiwaneseOMG/`，因此部署網址為 `https://username.github.io/taiwaneseOMG/`。

有關原始檔案提供的測試帳號 (`TEST_USER`, `TEST_PASS`) 與測試網址 (`BASE_URL`) 等用於 E2E 測試用的設定，請額外記錄於 `.env.local`。

3. **執行對應的建置或啟動命令：**
   ```bash
   # 本地開發
   npm run dev
   
   # 建置 (使用 .env 文件中的設定)
   npm run build
   
   # 建置 GitHub Pages 版本
   npm run build:github
   
   # 建置正式環境版本
   npm run build:prod
   ```

### 技術說明

- Vite 會自動根據環境變數設定 `import.meta.env.BASE_URL`
- React Router 會自動使用此 base URL 來處理路由
- Footer 等組件使用 `import.meta.env.BASE_URL` 來生成正確的連結
- 這樣可以確保在不同環境下,所有路由和連結都能正確運作

### 常見問題

**Q: 為什麼 GitHub Pages 需要特殊的 base path?**
A: GitHub Pages 會將專案部署在 `https://username.github.io/repository-name/` 下,所以需要設定 base path 為 `/repository-name/`

**Q: 正式環境部署時需要注意什麼?**
A: 確保 `.env.production` 中的 `VITE_BASE_PATH` 設為 `/`,因為正式環境通常部署在網域的根目錄

**Q: 如何測試不同環境的設定?**
A: 使用對應的 npm scripts:
```bash
# 測試 GitHub Pages 環境
npm run build:github
npm run preview

# 測試正式環境
npm run build:prod
npm run preview
```
