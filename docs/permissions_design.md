# 前端權限管理架構說明

## 設計理念

採用**集中式白名單權限表**，所有細粒度功能權限統一在一個檔案管理：

```
src/config/permissions.js
```

> [!IMPORTANT]
> 未來所有「A角色能做X，B角色不能做X」的前端行為，**只需修改這一個檔案**，不需要動任何業務元件。

---

## 角色層級

| 角色 | API 值 | 說明 | 繼承自 |
|------|--------|------|--------|
| 普通用戶 | `MEMBER` | 一般會員 | — |
| 管理員 | `ADMIN` | 外部教師等 | MEMBER |
| 超級管理員 | `SUPER_ADMIN` | 核心平台管理員 | ADMIN, MEMBER |

角色繼承：`SUPER_ADMIN` 擁有 `ADMIN` 的所有能力；`ADMIN` 擁有 `MEMBER` 的所有能力。

---

## 使用方式

### 在元件中查詢權限

```jsx
import { can } from '../config/permissions';
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();

  // 查詢：此角色的連結欄位是否為選填
  const isLinkOptional = can(user?.role, 'news', 'optionalLink');

  return (
    <input
      type="url"
      required={!isLinkOptional}
    />
  );
};
```

### `can(role, feature, ability)` 參數說明

| 參數 | 說明 | 範例 |
|------|------|------|
| `role` | 使用者角色字串 | `'SUPER_ADMIN'` |
| `feature` | 功能模組 | `'news'` |
| `ability` | 具體能力名稱 | `'optionalLink'` |

---

## 目前已定義的權限規則

```
PERMISSIONS
├── news (活動快訊)
│   └── optionalLink     → [SUPER_ADMIN]   連結欄位為選填
├── exam (考試資訊)       （待擴充）
├── member (會員管理)     （待擴充）
└── socialmedia (媒體資源)（待擴充）
```

### 本次變更效果

| 角色 | 新增/編輯快訊時的「連結」欄位 |
|------|-------------------------------|
| `SUPER_ADMIN` | **選填**（顯示為「連結（選填）」） |
| `ADMIN` | **必填**（顯示為「\*連結」） |
| `MEMBER` | **必填**（顯示為「\*連結」） |

---

## 新增權限規則（範例）

假設未來要讓超級管理員可以批次刪除媒體資源：

```js
// src/config/permissions.js

const PERMISSIONS = {
  // ...
  socialmedia: {
    bulkDelete: [ROLES.SUPER_ADMIN],   // ← 新增這一行
  },
};
```

然後在元件中：

```jsx
const canBulkDelete = can(user?.role, 'socialmedia', 'bulkDelete');
```

---

## 技術選型說明

本方案選用**純 JS 物件 + `can()` helper function** 而非第三方 RBAC 函式庫，原因：

1. **零依賴**：不引入 `casl`、`accesscontrol` 等套件，維護成本低
2. **集中管理**：所有規則在單一檔案，一目了然
3. **可讀性高**：欄位名稱即文件，不需額外說明
4. **易於擴充**：未來若需要更複雜的條件（如資源所有權），只需擴充 `can()` 函式即可

> [!TIP]
> 若日後權限規則大量增長（超過 10 個模組、每模組超過 5 條規則），可考慮引入 [CASL](https://casl.js.org/) 並以本檔案作為遷移基礎。
