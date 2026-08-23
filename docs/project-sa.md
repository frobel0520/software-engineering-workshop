# Software Engineering Workshop：專案級 SA

> 狀態：Approved
> 日期：2026-08-16
> 上位文件：[project-plan.md](./project-plan.md)
> 基線：`dev`（目前 ready topics 與 route guard 已合併）

## 1. 分析目的

本文件把專案計畫轉成可驗證的系統需求，定義教材站服務誰、解決什麼問題、有哪些核心流程與規則。專案包含 19 個 Core topics，以及遵守相同模組契約的可選 Extension tracks。實作細節、component、route 命名、TypeScript 型別與 simulator API 留到專案級 SD。

## 2. 問題與目標

### 現況問題

軟體工程知識常被拆成零散文章與指令，學習者知道名詞，卻不一定能把概念串成可重複的工程流程。真實 GitHub、雲端帳號、secret 與資料庫又會增加初學者的操作風險與環境成本。

### 系統目標

- 讓初學者沿著 19 個 Core topics 的路線圖逐步學習。
- 讓進階學習者能從 Extension track 進入專門主題，例如 AI／LLM Engineering 的 Guardrail rebuild。
- 每個已開放主題都能完成「教材 → Lab → 驗證 → 完成」閉環。
- 用 deterministic simulator 將高風險或外部依賴轉成安全的練習情境。
- 讓學習者看見指令、狀態、錯誤與工程取捨之間的因果關係。
- 讓後續主題能沿用相同模組契約，不破壞已完成教材。

## 3. 角色與邊界

| 角色 | 目標 | 本階段能力 |
| --- | --- | --- |
| 學習者 | 瀏覽路線、理解概念、完成 Lab | 在瀏覽器內操作，不需登入外部服務 |
| 教材維護者 | 新增主題、更新教材、驗證互動流程 | 透過 repository、CI 與 Pages 交付 |
| GitHub Pages | 提供公開靜態網站 | 發布建置後的 HTML、CSS、JavaScript |
| 未來 API／服務 | 同步資料或連接真實平台 | Phase 1 不啟用；保留 Phase 2 擴充邊界 |

本階段沒有學習者帳號、教師後台、多人協作資料或 server-side session。

## 4. 核心概念

- **Curriculum**：Core 19 topics 與 Extension tracks 的唯一清單。
- **Track**：依能力領域分組的主題集合，分為 Core 與 Extension。
- **Topic**：一個可被 planned 或 ready 管理的學習主題。
- **Lesson**：主題的概念說明、示例與工程取捨。
- **Lab**：讓學習者完成任務並得到回饋的互動場景。
- **Simulator session**：Lab 的可重設、可預測操作狀態。
- **Topic progress**：該學習者在目前瀏覽器上的完成狀態。
- **Release**：經過測試、build、PR 與部署的教材版本。

### Core 與 Extension 邊界

- Core curriculum 目前固定包含 19 個 topics，維持既有學習路線與完成統計。
- Extension track 使用同一套 Lesson、Lab、TopicModule、simulator、progress 與 release 契約，但不改變 Core 19 的必修範圍。
- Extension topic 的完成狀態獨立計算；完成 Extension topic 不會增加 Core 19 的完成數，也不會解鎖或阻塞 Core topic。
- Guardrail rebuild 是第一個規劃中的 Extension topic，完整定義見 `docs/guardrail-rebuild-feature-brief.md`。

概念關係：

```text
Curriculum
  → Track
    → Topic
      → Lesson + Lab
        → Simulator session
          → Topic progress
```

## 5. 主要使用情境

| 編號 | 使用情境 | 結果 |
| --- | --- | --- |
| UC-01 | 學習者開啟課程地圖 | 看見 19 個 Core topics、Extension tracks 與 planned／ready 狀態 |
| UC-02 | 學習者選擇 ready 主題 | 進入該主題教材，不需要外部登入 |
| UC-03 | 學習者閱讀教材 | 理解概念、流程、指令或設定值及其取捨 |
| UC-04 | 學習者進入 Lab | 依提示操作 simulator，得到即時成功或錯誤回饋 |
| UC-05 | 學習者遇到錯誤或想重練 | 可 reset Lab，回到明確的初始狀態 |
| UC-06 | 學習者完成 Lab | 系統驗證完成條件，更新該 topic 的本機進度 |
| UC-07 | 學習者重新整理或回訪 | 已完成 topic 的狀態仍保留在同一瀏覽器 |
| UC-08 | 維護者發布版本 | CI 通過後由 GitHub Pages 發布靜態教材 |

## 6. 專案級 Pageflow 與狀態

### 正常流程

```text
課程地圖
  → 選擇 Core／Extension track
  → 選擇 track 中的 ready topic
  → Lesson
  → Lab 初始狀態
  → 學習者操作
  → 驗證完成條件
  → Topic marked complete
  → 回到原 track
```

### Topic 可見性規則

- `planned` topic：可在地圖看見標題與摘要，但不可進入未完成的教材流程。
- Track：可在課程地圖進入分類頁；分類頁列出該分類所有 topic 與 ready／planned 狀態。
- `ready` topic：可進入 Lesson 與 Lab。
- `complete` 不取代 curriculum 的 `ready` 狀態；它是學習者在本機的個人進度。

### Lab 狀態規則

每個 Lab 至少要能表達以下概念狀態，實際狀態名稱由 SD 定義：

- 初始／尚未完成
- 操作中
- 可理解的失敗或拒絕
- 可重設
- 完成

錯誤不應破壞整個課程路線，也不應造成真實外部副作用。

## 7. 功能需求

| ID | 需求 | 驗證方式 |
| --- | --- | --- |
| FR-01 | 系統必須從唯一課程清單呈現 19 個 Core topics 與 Extension tracks | 檢查地圖與 `curriculum.json` 一致 |
| FR-02 | 系統必須區分 planned 與 ready topic 的可進入性 | 點擊與 route 行為測試 |
| FR-03 | ready topic 必須提供 Lesson | UI 與內容 review |
| FR-04 | ready topic 必須提供可重複操作的 Lab | Lab happy path 與 reset 測試 |
| FR-05 | Lab 必須以 deterministic 結果回應操作 | simulator 單元測試 |
| FR-06 | 只有完成 Lab 驗證後才能標記 topic 完成 | 完成條件測試 |
| FR-07 | 完成狀態必須能在同一瀏覽器重新整理後保留 | persistence 測試 |
| FR-08 | 課程地圖必須顯示總進度與個別完成狀態 | map UI 測試 |
| FR-09 | 學習者必須能從 Lab reset 並重新開始 | reset 行為測試 |
| FR-10 | 維護者必須能透過既有 CI／Pages 流程發布版本 | workflow 與 build 驗證 |
| FR-11 | Extension topic 必須使用既有 TopicModule、route、progress 與 test 契約 | Guardrail rebuild integration review |
| FR-12 | Extension progress 不得污染 Core 19 的完成統計或可見性規則 | progress aggregation 測試 |

## 8. 非功能需求

- **安全與隱私**：Phase 1 不要求帳號，不收集 secret，不對真實 repository 或外部 API 發出變更。
- **可理解性**：繁體中文文案需說明「做什麼、為什麼、失敗代表什麼」，而非只展示正確答案。
- **可及性**：互動控制項可用鍵盤完成；重要狀態變化可被 live announcement 感知。
- **響應式**：桌面與 mobile 都能完成 Lesson 與 Lab；不得依賴 hover 才能操作。
- **可重現性**：相同初始狀態與操作序列必須得到相同 simulator 結果。
- **可維護性**：新增 topic 不得複製整個 App 的路由與進度邏輯，也不得破壞 Git／Auth 保護契約。
- **範圍隔離**：Extension topic 可以擴充課程，但不得改變 Core 19 的學習順序、完成統計或既有保護契約。
- **交付可靠性**：測試、TypeScript 檢查與 production build 必須在 PR gate 中通過。

## 9. 資料與持久化規則

- 課程定義屬於 repository 內容，以 `shared/curriculum.json` 為準；Core 與 Extension 的 track metadata 也由此檔案管理。
- Lesson、Lab 與 simulator 的教學 fixture 可隨版本發布，不需要後端資料庫。
- Phase 1 的 Topic progress 只存在使用者瀏覽器的 localStorage。
- Git 與 Auth 現有 persistence key 視為不可破壞契約；新增 topic 使用獨立 key。
- Guardrail rebuild 使用 `se-workshop-guardrail-complete`，不得重用 Core topic key。
- 若 Phase 2 需要跨裝置同步、帳號、分析或教師檢視，新增 API／資料庫同步層，不直接把 secret 放進 Pages 前端。

## 10. 驗收與完成定義

專案級 SA 可接受的條件：

1. 19 個 Core topics、Extension tracks 與 planned／ready 規則清楚。
2. 學習者從 map 到 topic completion 的正常與失敗流程清楚。
3. Lesson、Lab、simulator、progress、release 的責任邊界清楚。
4. Phase 1 無後端的理由與 Phase 2 擴充條件清楚。
5. 既有 Git／Auth routes、completion keys、可及性與部署契約被列為保護條件。
6. Guardrail rebuild 如何接入 TopicModule、如何隔離 Core progress 與如何維持 Phase 1 無 backend 已被定義。

## 11. 待決策但不阻塞 Phase 1

以下問題刻意保留為 Phase 2／產品治理決策；Phase 1 目前維持靜態教材、deterministic simulator 與 simulator-first 的外部副作用邊界：

- **Phase 2 backend 觸發條件**：跨裝置進度、登入、教師 dashboard、真實 provider integration，或其他需求何時足以啟動 backend，仍待產品決策。
- **Phase 2 API／資料庫的 hosting 與成本**：只有 backend 觸發條件成立後，才進入 hosting、資料庫與維運成本評估。
- **匿名學習分析**：Phase 1 不收集匿名分析；是否收集、保存哪些資料以及保存多久，仍待隱私與產品決策。
- **GitHub／GitLab 真實整合**：Phase 1 維持 simulator-first；若要產生真實外部副作用，必須先另立整合契約與授權邊界。
- **Extension ready 規則**：Guardrails 與問題處理方法目前已是 ready 的 Extension，不計入 Core denominator；未來新增 Extension 仍須先通過 feature-level review，再決定是否開放。

這些問題由後續 project-level SD 或 Phase 2 計畫處理；不阻塞第一階段的靜態教材、simulator 與目前 16 / 19 Core topic 的交付。

## 12. 與 SD 的交界

本 SA 已確定「系統要提供什麼」；SD 下一步需定義：

- topic module 的實作邊界
- Core／Extension track metadata 與 progress aggregation 的資料邊界
- route 與導航資料模型
- simulator state machine 與事件契約
- progress persistence adapter
- 測試分層與 CI 交付流程

SD 不得反向改變本文件的學習目標、外部副作用邊界與既有保護契約；若需要改變，先回到 SA review。
