# E2E 測試文件

## 📁 資料夾結構

```
tests/e2e/
├── playwright.config.js    # Playwright 配置檔
├── README.md               # 本文件
├── tests/
│   ├── smoke/              # 冒煙測試（快速、關鍵流程）
│   │   ├── home.spec.js        # 首頁渲染測試
│   │   ├── navigation.spec.js  # Sidebar（含「本站特色資源」子選單）、Footer、直接網址導航
│   │   └── search.spec.js      # 首頁搜尋與搜尋結果頁
│   ├── features/           # 功能測試（不需登入）
│   │   ├── culture-test.spec.js        # 台語文化（test）：影音／文本混合、分類、query string
│   │   ├── occupation-test.spec.js     # 職業台語（test）：列表、分類、詳細頁
│   │   ├── placename-culture.spec.js   # 台語地名與文化：地圖、行政區介紹
│   │   ├── relative-calculator.spec.js # 親戚計算機
│   │   ├── report-issue.spec.js        # Footer「回報問題」彈窗
│   │   ├── resource.spec.js            # 資源共享平台（未登入）篩選列
│   │   └── list-query-params.spec.js   # 媒體與社群資源／認證考試的網址參數（打真實 API）
│   └── regression/         # 迴歸測試（需登入，依賴 auth-setup）
│       ├── auth/login.spec.js          # OCR 驗證碼登入，保存 .auth/user.json
│       └── resource/upload.spec.js     # ⚠️ 會真的上傳一筆資源到後端
├── fixtures/
│   ├── test-data.js        # 測試資料集中管理
│   └── test-file.pdf       # 上傳用測試檔
└── utils/
    ├── selectors.js        # data-testid 選擇器映射
    ├── helpers.js          # 測試輔助函數
    └── captcha-ocr.js      # 登入驗證碼 OCR
```

### 測試專案（project）

| project | 內容 | 指令 |
|---|---|---|
| `smoke` | 首頁、導航、搜尋 | `npm run test:e2e:smoke` |
| `features` | 各功能頁（多數使用前端假資料，結果可預期） | `npm run test:e2e:features` |
| `auth-setup` / `regression` | 登入後流程（需 `TEST_USER`／`TEST_PASS`） | `npm run test:e2e` |

### 撰寫注意事項

- **受 feature flag 控制的頁面**請用 `gotoFeaturePage(page, test, path)` 開啟：flag 關閉時路由會導回首頁，測試會自動略過而不是失敗。
- **共用下拉 `CustomSelect`** 的選單會 portal 到 `#root`，請用 `chooseCustomSelectOption(page, root, label)` 操作。
- **不要依賴 `networkidle`**：首頁、搜尋頁等會持續打 API，`navigateAndWait` 只短暫等待；請用 `expect(locator)` 等實際內容出現。
- **會寫入後端的請求要攔截**：例如首頁搜尋會 POST `/top_keywords` 記錄熱門關鍵字、回報問題會 POST `/issue_report`，測試中已以 `page.route` 攔下，避免污染正式資料。

## 🎯 選擇器策略

本專案採用 `data-testid` 作為主要的元素定位策略：

- **為什麼選擇 data-testid?**
  - 不受 CSS class 名稱變更影響
  - 不受 DOM 結構重構影響
  - 明確表達「此元素用於測試」

- **命名規範:**
  ```
  {頁面/區塊}-{元素類型}-{描述}
  ```
  範例: `header-logo`, `home-search-input`, `sidebar-menu-item`

- **集中管理:** 所有選擇器定義在 `utils/selectors.js`

## 🚀 執行測試

### 本地開發

```bash
# 執行所有 E2E 測試（headless）
npm run test:e2e

# 使用 Playwright UI 模式（互動式偵錯）
npm run test:e2e:ui

# 只執行 smoke 測試
npm run test:e2e:smoke

# 只執行功能測試
npm run test:e2e:features

# 執行特定測試檔案
npx playwright test tests/e2e/tests/smoke/home.spec.js --config=tests/e2e/playwright.config.js
```

### CI 環境

在 CI 環境中，測試會自動：
- 以 headless 模式執行
- 產生 HTML 報告
- 在失敗時保存 trace、screenshot、video

## 🔧 環境設定

### 環境變數

複製 `.env.example` 另存成 `.env.local` 並根據需求修改：

```bash
# E2E 測試環境變數
BASE_URL=http://localhost:3000    # 測試目標 URL
TEST_USER=your-test-user          # 測試帳號（如需登入測試）
TEST_PASS=your-test-password      # 測試密碼（如需登入測試）
```

### 支援的環境

| 環境 | BASE_URL |
|------|----------|
| 本地開發 | `http://localhost:3000` |
| Staging | 設定 `BASE_URL` 環境變數 |
| Production | 不建議在正式環境執行 E2E |

## ➕ 新增測試

### 1. 新增 Smoke 測試

在 `tests/smoke/` 建立新檔案，例如 `my-feature.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');
const { navigateAndWait, waitForStableUI } = require('../../utils/helpers');

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/my-page');
  });

  test('should display critical element', async ({ page }) => {
    const element = page.getByTestId('my-element');
    await expect(element).toBeVisible();
  });
});
```

### 2. 新增 data-testid

在 React 元件中添加：

```jsx
<button data-testid="my-button">Click Me</button>
```

並在 `utils/selectors.js` 中註冊：

```javascript
const selectors = {
  myPage: {
    myButton: 'my-button',
  },
};
```

### 3. 新增共用測試資料

在 `fixtures/test-data.js` 中添加：

```javascript
const testData = {
  myFeature: {
    validInput: 'test value',
    invalidInput: '',
  },
};
```

## 📊 測試報告

測試完成後，報告會產生在：

- **HTML 報告:** `playwright-report/index.html`
- **測試結果:** `test-results/`

開啟報告：
```bash
npx playwright show-report playwright-report
```

## 🐛 偵錯技巧

### 使用 UI 模式

```bash
npm run test:e2e:ui
```

### 開啟 trace viewer

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### 在特定行暫停

在測試中加入：
```javascript
await page.pause();
```

## 📝 最佳實踐

1. **避免硬編碼等待時間**
   - ❌ `await page.waitForTimeout(2000)`
   - ✅ `await expect(element).toBeVisible()`

2. **使用 Playwright 的 auto-wait**
   - 大多數操作會自動等待元素可互動

3. **獨立測試**
   - 每個測試應該獨立，不依賴其他測試的狀態

4. **有意義的 test.describe 分組**
   - 按功能或頁面分組

5. **清楚的測試名稱**
   - 描述預期行為，如「應該顯示錯誤訊息當輸入無效」

## 🔗 參考資源

- [Playwright 官方文件](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
