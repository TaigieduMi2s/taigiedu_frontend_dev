# Outage Service – 停電 / 維護公告微服務

獨立於主後端的 Firebase Functions 微服務，用於在主站停機 / 停電時仍能對前端發布公告。

## 為什麼需要這個服務？

主站後端在停電或維護期間無法回應，但前端的 `ServiceSuspensionNotice` 元件需要動態取得公告內容（標題、內容、起訖時間、blocking / preview 模式）。把這份資料放在 Firebase（Google 託管），就能與主後端解耦：
- **寫入**：超級使用者透過後端打 API → 後端用 `X-API-Key` 呼叫本服務 → 寫進 Firestore。
- **讀取**：前端直接讀 Firestore（推薦），或打本服務的 `GET /announcement` 作為備援。

## 架構

```
[ Admin UI ]
     │  (帶 Auth Token)
     ▼
[ 主後端 ] ──── X-API-Key ────▶ [ outage-service (Cloud Function) ]
                                        │
                                        ▼
                                  [ Firestore: system/outage ]
                                        ▲
                                        │  (公開讀取)
                                  [ 前端 React ]
```

## API

Base URL（部署後）：`https://asia-east1-<project-id>.cloudfunctions.net/outage`

| Method | Path             | Auth         | 說明 |
|--------|------------------|--------------|------|
| GET    | `/`              | -            | 健康檢查 |
| GET    | `/announcement`  | -            | 取得目前公告 |
| POST   | `/announcement`  | `X-API-Key`  | 建立 / 更新公告 |
| DELETE | `/announcement`  | `X-API-Key`  | 下架公告 |

### POST /announcement Payload

```json
{
  "active": true,
  "mode": "blocking",
  "title": "網站暫停服務公告",
  "content": "由於伺服器系統維護，以下期間網站將暫停服務。",
  "startAt": "2026-05-10T08:00:00+08:00",
  "endAt": "2026-05-10T17:00:00+08:00",
  "updatedBy": "admin:<uid>"
}
```

- `mode`: `blocking`（停電中，強制顯示無法關閉）或 `preview`（停電前預告，使用者可關閉）。
- `startAt` / `endAt`：ISO 8601 字串。
- `updatedBy`：稽核用，建議帶入觸發者 uid 或服務識別。

## 部署

1. 安裝 Firebase CLI 並登入：
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. 進入此資料夾，安裝依賴：
   ```bash
   cd outage-service
   npm install
   ```
3. 連結到 Firebase 專案：
   ```bash
   cp .firebaserc.example .firebaserc
   # 編輯 .firebaserc 填入實際 project id
   ```
4. 設定 API Key（建議至少 32 字元隨機字串）：
   ```bash
   firebase functions:secrets:set OUTAGE_API_KEY
   ```
5. 部署 Functions 與 Firestore Rules：
   ```bash
   firebase deploy --only functions,firestore:rules
   ```

## 本地開發

```bash
echo 'OUTAGE_API_KEY=test-key-please-change' > .env
npm run serve
```

模擬器啟動後可用：
```bash
curl http://127.0.0.1:5001/<project-id>/asia-east1/outage/
```

## 前端整合現況

`src/components/ServiceSuspensionNotice/ServiceSuspensionNotice.jsx` 已改為直接訂閱 Firestore `system/outage` 文件：

- 連線設定：`src/config/firebaseOutage.js`，採 `VITE_OUTAGE_FIREBASE_*` 環境變數。
- 訂閱與資料正規化：`src/services/outageService.js`。
- 顯示規則：`startAt` 前 7 天開始顯示；使用者關閉後寫入 `localStorage`；距離 `endAt` 不到 1 天時即使已關閉也會再彈出一次提醒；`mode=blocking` 期間無法關閉。

部署時記得在前端 `.env.production`（或對應的部署環境變數）填入 `VITE_OUTAGE_FIREBASE_*`，可在 Firebase Console → 專案設定 → 一般 → Web App 取得。
