# 部署配置說明

## Base Path 配置

本專案支援多環境部署,透過 `VITE_BASE_PATH` 環境變數來設定應用程式的基礎路徑。

### 環境設定

1. **本地開發環境**
   - Base Path: `/`
   - 創建 `.env.development` 文件:
     ```
     VITE_BASE_PATH=/
     ```

2. **GitHub Pages 部署**
   - Base Path: `/taiwaneseOMG/`
   - 已在 `.github/workflows/deploy.yml` 中自動設定
   - 部署網址: `https://hsiehyoung.github.io/taiwaneseOMG/`

3. **正式環境部署 (dev.taigiedu.com)**
   - Base Path: `/`
   - 創建 `.env.production` 文件:
     ```
     VITE_BASE_PATH=/
     ```
   - 部署網址: `https://dev.taigiedu.com/`

### 如何設定

1. 複製 `.env.example` 為對應的環境變數文件:
   ```bash
   # 本地開發
   cp .env.example .env.development
   
   # 正式環境
   cp .env.example .env.production
   ```

2. 根據部署環境修改 `VITE_BASE_PATH` 的值

3. 執行對應的命令:
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
