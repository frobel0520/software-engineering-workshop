# Software Engineering Workshop：專案計畫

> 狀態：Active
> 日期：2026-08-16
> 基線：`dev`（route guard 與目前 ready topics 已合併）

## 1. 專案目標

建立一個面向繁體中文初學工程師的互動式軟體工程教材站，將 19 個工程能力拆成可閱讀、可操作、可測試、可重複練習的主題模組。

每個已開放主題應包含：

- 短教材：解釋概念與工程取捨
- Interactive Lab：讓使用者完成一個安全的模擬任務
- Deterministic simulator：不連線真實服務，狀態可重設、可測試
- 完成條件：完成 Lab 後才更新課程進度

## 2. 現況基線

- 課程清單：`shared/curriculum.json`，共 19 個主題
- Core 已開放：Git、GitHub／GitLab 遠端協作、命令列、IDE／除錯器、套件管理、環境變數、建置工具、REST API／FastAPI、身分驗證與授權、SQL、資料庫設計、索引與交易、PostgreSQL、單元測試、整合測試、日誌、Docker、CI/CD、部署，共 19 / 19
- Git v1 release gate：已完成 cowork／pipeline、keyboard、mobile、200% zoom 與 reduced-motion 驗收，`GIT-REVIEW` 已於 2026-08-16 通過。
- Extension 已開放：Guardrails、問題處理方法，共 2 個；不計入 Core 19 的完成分母
- 學習者完成數：依瀏覽器 `localStorage` 個別計算，不在專案文件中固定寫死
- 前端：Vite + React + TypeScript，靜態站點
- 持久化：瀏覽器 `localStorage`
- 交付：GitHub Actions CI、GitHub Pages
- 協作：`feature/* → dev → main → GitHub Pages`
- 既有保護契約：Git／Auth routes、完成 key、Git simulator、鍵盤與 mobile 行為

## 3. 專案範圍

### In scope

- 19 個主題的課程地圖與狀態管理
- 統一的「教材 → Lab → 完成」模組模式
- Git、Auth 與後續 CLI、Web、資料庫、品質、交付主題
- 可測試的互動 simulator 與 fixture-first 教學資料
- 鍵盤操作、live announcement、mobile layout 與 reduced motion
- 測試、TypeScript 檢查、production build、GitHub Pages 部署

### Out of scope

- 第一階段不建立後端、帳號系統或資料庫
- 不連線使用者的真實 GitHub／GitLab、Microsoft 或其他外部服務
- 不保存真實 token、secret、帳號資料或 repository 內容
- 不把教材站變成企業管理後台、dashboard 或一般產品 SaaS

## 4. 專案級 Pageflow

```text
課程地圖
  → 選擇能力分類
  → 選擇該分類中的已開放主題
  → 閱讀教材
  → 進入該主題 Lab
  → 完成操作與驗證
  → 寫入該主題完成狀態
  → 回到原分類查看進度
```

分類是導覽與學習順序，不是跨分類的完成 gate；每個主題都遵守相同的高階契約，主題內部的教材節奏、Lab 狀態與錯誤情境，則由該主題的 pageflow 規格補充。

## 5. 架構方向

- `shared/curriculum.json` 是課程清單與 planned／ready 狀態的唯一來源。
- 前端以 topic module 為邊界，分離 lesson copy、Lab UI、simulator、tests 與完成持久化。
- 新主題優先採 fixture-first；未來若接真實 API，替換資料來源，不改變教材核心任務契約。
- 既有 `#/map`、`#/git`、`#/lab` 與 Auth routes 視為受保護介面；新增 route 不得破壞既有連結。
- 每個主題的完成狀態使用獨立、命名清楚的 persistence key；不得改寫既有 Git／Auth key。

## 6. 交付路線

### Phase 0：專案契約與規格

1. 專案級 Pageflow
2. 專案級 SA
3. 專案級 SD
4. Topic module、完成狀態、simulator 與測試契約
5. Milestone 與 task breakdown

### Phase 1：開發基本功與 Web

- Git（已完成）
- GitHub／GitLab 遠端協作（已完成）
- 命令列（已完成）
- IDE／除錯器（已完成）
- 套件管理（已完成）
- 環境變數（已完成）
- 建置工具（已完成）
- REST API／FastAPI（已完成）
- 身分驗證與授權（已完成）

### Extension track

- Guardrails／AI／LLM Engineering（已完成；不改變 Core 19 的學習順序與完成統計）
- 問題處理方法（已完成；不改變 Core 19 的學習順序與完成統計）

### Phase 2：資料庫

- SQL（已完成）
- 資料庫設計（已完成）
- 索引與交易（已完成）
- PostgreSQL（已完成）

### Phase 3：品質與可觀測性

- 單元測試
- 整合測試
- 日誌

### Phase 4：交付與部署

- Docker 基礎
- CI/CD
- 部署

CI、GitHub Pages 與 branch protection 已是專案交付基礎；對應的 CI/CD／部署教材仍需另外製作，不因基礎設施已存在而自動標記完成。

## 7. 專案交付物

1. 專案級 Pageflow、SA、SD
2. 可重用的 topic module 開發契約
3. 19 個主題的課程地圖與狀態更新
4. 各已開放主題的教材、Lab、simulator 與測試
5. CI、build、部署與交接文件
6. 可轉換成 GitHub Issues／Milestones 的 task breakdown

Feature-level pageflow 或 SA／SD 只在專案級契約確認後，針對需要複雜互動的主題追加；不再把單一 feature 計畫誤當成專案計畫。

## 8. 專案完成條件

- 19 個主題都在課程地圖中可見，狀態與唯一課程清單一致。
- 每個 `ready` 主題都有教材、Lab、完成判定與至少一組自動化測試。
- Git／Auth 既有 routes、完成狀態、鍵盤與 mobile 行為不回歸。
- 使用者不需要外部帳號或 secret，就能完成所有第一階段互動教材。
- `npm test`、TypeScript 檢查與 `npm run build` 通過。
- `dev` 與 `main` 依既有 PR、required check、release merge 規則交付。

## 9. 主要風險與決策

| 風險 | 專案決策 | 後續 rework 影響 |
| --- | --- | --- |
| 19 個主題範圍過大 | 以 topic module 逐站交付，不追求一次完成 | 各主題需遵守共同契約 |
| 既有路由與 persistence 互相耦合 | 先鎖 protected contracts，再擴充 route | 新主題需新增而非改寫既有 key |
| 真實外部服務導致帳號與網路依賴 | 第一階段採 deterministic simulator | 未來接 API 時需替換資料邊界 |
| 不同主題各自發展造成 UI／教學不一致 | 先定 project-level pageflow、SA、SD | 新主題需通過規格 review |
| CI／部署基礎與教材主題混淆 | 基礎設施與學習模組分開計算 | `cicd`、`deploy` 仍需獨立教材 |

## 10. 開發閘門

此計畫確認後，依序進行：

1. Project-level Pageflow review
2. Project-level SA review
3. Project-level SD review
4. 以第一個主題（GitHub／GitLab 遠端協作）驗證 module 契約
5. 逐主題開發、測試、PR → `dev`
6. 依 release 規則合併到 `main` 並部署

本計畫本身不授權真實外部服務連線，也不改變既有 `main` release 流程。
