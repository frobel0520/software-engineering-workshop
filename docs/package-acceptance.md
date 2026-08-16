# PACKAGE-01：套件管理 acceptance

> 類型：Topic acceptance／fixture contract
> 狀態：可供 PACKAGE-02、PACKAGE-03 開發
> 依賴：M1 module foundation
> 範圍：瀏覽器內 deterministic package-manager sandbox；不連線 registry、不執行真實 install、不修改使用者檔案

本文件只鎖定套件管理主題的學習目標、Lab pageflow、manifest／lockfile fixture 與驗收邊界，不新增 feature-level SA／SD。

## 1. 學習目標

完成主題後，學習者應能：

1. 分辨 `package.json` 的依賴宣告、lockfile 的解析結果，以及安裝目錄的實際狀態。
2. 用版本範圍新增依賴，理解 `^1.2.0` 與 lockfile 中的 exact version 不是同一件事。
3. 由固定 registry fixture 解析 direct dependency 與 transitive dependency，不把網路成功當成可重現性。
4. 用 `npm install` 更新 manifest／lockfile，並用 `npm ci` 從 lockfile 重建乾淨的安裝結果。
5. 在 manifest、lockfile 與 installed modules 不一致時，判斷應該重新安裝、修正 lockfile，或停止並回報錯誤。

## 2. Pageflow 與 Lab happy path

```text
map → /package lesson → /package-lab
  → inspect package.json
  → add @workshop/format@^1.2.0
  → npm install
  → inspect package-lock.json
  → npm ci
  → completion treatment → map
```

Lab 使用固定 `package.json`、`package-lock.json` 與 fixture registry。所有版本解析、相依套件與安裝結果由 fixture 決定，不會呼叫真實 npm registry，也不會在瀏覽器外建立 `node_modules`。

概念操作與 simulator event 對應如下：

| 概念操作 | 教學指令／UI 動作 | event |
| --- | --- | --- |
| 查看依賴宣告 | 開啟 `package.json` | `inspect-manifest` |
| 新增版本範圍 | `npm install @workshop/format@^1.2.0` | `add-dependency` |
| 解析並安裝依賴 | `npm install` | `install` |
| 查看 exact resolution | 開啟 `package-lock.json` | `inspect-lockfile` |
| 以 lockfile 重建 | `npm ci` | `clean-install` |

## 3. Fixture contract

PACKAGE-03 應以以下固定 fixture 作為初始狀態：

```ts
type PackageLabPhase = "initial" | "active" | "blocked" | "failed" | "completed";
type ManifestState = "unchanged" | "updated";
type LockfileState = "missing" | "stale" | "synced";
type InstallState = "empty" | "installed" | "clean-installed";
type PackageStepId =
  | "inspect-manifest"
  | "add-dependency"
  | "install"
  | "inspect-lockfile"
  | "clean-install";

interface PackageManifestFixture {
  name: "workshop-package-lab";
  private: true;
  packageManager: "npm@10.8.2";
  dependencies: Readonly<Record<string, string>>;
}

interface RegistryPackageFixture {
  name: "@workshop/format" | "@workshop/shared";
  versions: Readonly<Record<string, { dependencies: Readonly<Record<string, string>> }>>;
}

interface PackageLockFixture {
  lockfileVersion: 3;
  packages: Readonly<Record<string, { version: string; resolvedFrom: "fixture-registry"; dependencies?: Readonly<Record<string, string>> }>>;
}

interface PackageLabState {
  phase: PackageLabPhase;
  packageManager: "npm";
  manifest: PackageManifestFixture;
  manifestState: ManifestState;
  lockfile: PackageLockFixture | null;
  lockfileState: LockfileState;
  installedModules: readonly string[];
  installState: InstallState;
  completedStepIds: readonly PackageStepId[];
  lastCommand: string | null;
  lastMessage: string;
  canReset: true;
}
```

初始 `package.json`：

```ts
{
  name: "workshop-package-lab",
  private: true,
  packageManager: "npm@10.8.2",
  dependencies: {},
}
```

初始 Lab state：

```ts
{
  phase: "initial",
  packageManager: "npm",
  manifest: {
    name: "workshop-package-lab",
    private: true,
    packageManager: "npm@10.8.2",
    dependencies: {},
  },
  manifestState: "unchanged",
  lockfile: null,
  lockfileState: "missing",
  installedModules: [],
  installState: "empty",
  completedStepIds: [],
  lastCommand: null,
  lastMessage: "準備從固定 package.json fixture 開始。",
  canReset: true,
}
```

固定 registry fixture：

```ts
[
  {
    name: "@workshop/format",
    versions: {
      "1.2.0": { dependencies: { "@workshop/shared": "^1.0.0" } },
      "1.3.0": { dependencies: { "@workshop/shared": "^1.0.0" } },
    },
  },
  {
    name: "@workshop/shared",
    versions: {
      "1.0.0": { dependencies: {} },
    },
  },
]
```

`npm install @workshop/format@^1.2.0` 的 deterministic resolution 必須選擇 `@workshop/format@1.3.0` 與 `@workshop/shared@1.0.0`，並由 fixture 標記 `resolvedFrom = "fixture-registry"`。不得產生真實 registry URL、integrity 以外的網路資料或使用者資訊。

## 4. 固定狀態與完成條件

| event | accepted state／output | 完成 step |
| --- | --- | --- |
| `inspect-manifest` | 顯示空的 dependencies 與 `packageManager = "npm@10.8.2"`，state 保持 initial／active | `inspect-manifest` |
| `add-dependency` | manifest 新增 `"@workshop/format": "^1.2.0"`，`manifestState = "updated"`、`lockfileState = "stale"` | `add-dependency` |
| `install` | lockfile 解析 `@workshop/format@1.3.0` 與 `@workshop/shared@1.0.0`，`lockfileState = "synced"`、`installState = "installed"` | `install` |
| `inspect-lockfile` | 顯示 exact versions、transitive dependency 與 fixture registry 來源 | `inspect-lockfile` |
| `clean-install` | 清空後由 lockfile 重建相同兩個 installed modules，`installState = "clean-installed"` | `clean-install` |

只有 `completedStepIds` 包含 `inspect-manifest`、`add-dependency`、`install`、`inspect-lockfile`、`clean-install`，且 manifest、lockfile 與 clean-installed modules 一致時，Lab 才能標記完成。只修改 manifest、只看到 lockfile，或只完成一次 install 都不能完成 topic。

## 5. 失敗狀態與回饋

| 情境 | 結果 | 必須呈現的概念 |
| --- | --- | --- |
| 新增 registry 不存在的套件 | `phase = "failed"`，manifest 不新增，lockfile 與 installed modules 不變 | package manager 不能把未知套件當成成功安裝 |
| 在 manifest 尚未更新前執行 `npm ci` | `blocked`，保留初始 state | `npm ci` 需要可用且一致的 lockfile |
| manifest 更新後直接執行 `npm ci` | `blocked`，`lockfileState = "stale"` 不變 | `npm ci` 不負責替代 `npm install` 更新 lockfile |
| lockfile 與 manifest dependency 不一致 | `failed`，不得產生部分安裝結果 | lockfile 是可重現安裝的契約，不是裝飾檔 |
| 解析 transitive dependency 失敗 | `failed`，installed modules 保持空或上一個穩定結果 | 失敗不可留下半套依賴 |
| 任一非法 event 或空白 package name | 保留既有 state，不偽造 completed step | 輸入驗證與錯誤回饋必須 deterministic |

每個錯誤至少要說明目前 manifest／lockfile／install 狀態與下一步提示；不可只顯示顏色或例外訊息。

## 6. PACKAGE-02／PACKAGE-03 驗收向量

1. **happy path**：依 `inspect-manifest → add-dependency → install → inspect-lockfile → clean-install` 完成，最後 `phase = "completed"`。
2. **一致性邊界**：manifest、lockfile 或 installed modules 任一不一致時，不得標記完成，也不得留下部分成功結果。
3. **reset**：完成或 failed 後 reset，結果與初始 fixture deep-equal。
4. **determinism**：相同初始 state 加相同 event sequence，必須產生相同 manifest、lockfile、installed modules、feedback 與 completion。

PACKAGE-02 可依本文件的學習目標與 npm command mapping 撰寫教材；PACKAGE-03 必須維持上述 state、event、版本解析、錯誤與 completion 邊界。真實 npm registry、network、credential、postinstall script、native module、使用者檔案與任意 shell 不在本 topic Phase 1 範圍內。
