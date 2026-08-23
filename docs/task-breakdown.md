# Software Engineering Workshop：Milestone／Task Breakdown

> 狀態：Active backlog
> 日期：2026-08-23
> 依據：[project-plan.md](./project-plan.md)、[project-sa.md](./project-sa.md)、[project-sd.md](./project-sd.md)

## 1. 為什麼需要 Milestone

需要。Milestone 是可驗收的交付閘門；Task 是可獨立完成、審查與合併的最小工作單位。

```text
Milestone：一個可對外說明的成果
  → Work package：一個 topic 或共用能力
    → Task：一個清楚輸出、通常一個 PR
```

Milestone 不用來表示每個小步驟，也不先綁死日期；日期與 owner 等 task 進入 GitHub Issues 後再補。

## 2. Task 顆粒度規則

每個 task 必須具備：

- 一個主要輸出：一份規格、一個 simulator、一個 Lab 或一組測試。
- 一個明確驗收條件，不以「大致完成」結案。
- 一個主要 owner 與一個主要依賴；跨 topic 依賴必須寫出來。
- 預設半天到一天可完成；若超過一天，拆成多個 task。
- 可以獨立開 PR；不能把「順便修改其他主題」藏在 task 內。

Task 不等於檔案。若一個 task 同時需要修改多個檔案，但輸出與驗收仍是單一能力，仍可維持一個 task。

## 3. Milestone 總表

| ID | Milestone | 結果 | 依賴 | 狀態 |
| --- | --- | --- | --- | --- |
| M0 | Project Contract | Project Plan、SA、SD、task breakdown 可供開發對齊 | 無 | done |
| M1 | Module Foundation | 新 topic 可依共同契約接入 route、progress、Lab、tests | M0 | done（P2 架構 follow-up） |
| M2 | Foundations／Web | 開發基本功與 Web 主題逐站開放 | M1 | done |
| M3 | Data | SQL、schema、index／transaction、PostgreSQL 開放 | M1 | done |
| M4 | Quality | unit、integration、logs 開放 | M1 | done |
| M5 | Delivery | Docker、CI/CD、deploy 開放 | M1、既有 CI／Pages baseline | planned |
| M6 | Hardening／Release | 19 主題一致性、回歸、文件與正式發布完成 | M2–M5 | planned |

M2、M3、M4 可在 M1 完成後平行進行；M5 的教材可平行製作，但共用 CI／Pages contract 必須維持穩定。

## 4. M0：Project Contract

| Task ID | Task | 輸出 | 依賴 | 狀態 |
| --- | --- | --- | --- | --- |
| PLAN-001 | 撰寫專案計畫 | `docs/project-plan.md` | 無 | done |
| PAGEFLOW-001 | 固化專案級 pageflow | Plan／SA 中的 pageflow 決策可獨立 review | PLAN-001 | done |
| PLAN-002 | 撰寫專案級 SA | `docs/project-sa.md` | PLAN-001 | done |
| PLAN-003 | 撰寫專案級 SD | `docs/project-sd.md` | PLAN-002、PAGEFLOW-001 | done |
| PLAN-004 | 審核 task／Milestone 分解 | 本文件的 backlog 決策 | PLAN-003 | done |

M0 完成條件：專案層級目標、需求、技術邊界、Milestone、task 規則都被確認；未確認的內容不得默默變成 implementation 假設。

## 5. M1：Module Foundation

這些 task 只處理共用能力，不實作特定教材內容。

| Task ID | Task | 主要輸出 | 依賴 | 狀態 |
| --- | --- | --- | --- | --- |
| CORE-001 | 固化 TopicModule contract | module 欄位、責任邊界、最小 fixture 介面 | M0 | done |
| CORE-002 | 建立 ProgressRepository | localStorage adapter，保護 Git／Auth keys | M0 | done |
| CORE-003 | 建立 route registry | topic route、lab route、既有 route alias | M0 | done |
| CORE-004 | 重作 progress aggregation | 從 curriculum + repository 計算總進度 | CORE-002、`curriculum.json` | done |
| CORE-005 | 建立共用 Lesson／Lab shell | topic header、status feedback、reset、completion treatment | CORE-001 | done |
| CORE-006 | 建立 simulator test harness | 共用測試 fixture、reset、completion assertion pattern | CORE-001 | done |
| CORE-007 | 建立共用可及性檢查清單 | keyboard、live region、mobile、reduced motion 驗收點 | M0 | done（完整 audit pending） |
| CORE-008 | App registry-driven dispatcher | 移除 App 中 topic-specific render 分支，讓 route registry／module contract 成為唯一 dispatch 入口 | CORE-001、CORE-003、CORE-005 | backlog |

M1 的 foundation contract、progress、route resolver、test harness 與 checklist 已完成。原始的「App 不新增 topic-specific 分支」目標仍是 P2 架構 follow-up，追蹤於 `CORE-008`；目前不阻塞既有 ready topics 的 pageflow。

M1 的可平行工作線：

```text
CORE-001 ─┬─ CORE-005
          └─ CORE-006
CORE-002 ─── CORE-004
CORE-003（獨立）
CORE-007（獨立）
```

因此只有 `CORE-004`、`CORE-005`、`CORE-006` 需要等待上游；Progress、route registry、accessibility checklist 不互相卡住。

## 6. Topic Task Packet

所有未完成 topic 使用同一組五 task。這是「可獨立且清楚」的基本模板，不代表每個 topic 必須共用同一份程式碼。

| 後綴 | Task | 輸出 | 驗收 |
| --- | --- | --- | --- |
| -01 | Topic acceptance | 該 topic 的學習目標、Lab happy path、失敗狀態與完成條件 | 可用於 review，不新增 feature-level SA／SD 文件 |
| -02 | Lesson + fixtures | 教材內容、示例、fixture 與 GitHub／GitLab 或其他概念 mapping | 文案能解釋做什麼、為什麼、失敗代表什麼 |
| -03 | Simulator | 純 reducer、事件、initial state、reset、completion predicate | unit tests 覆蓋正常、非法、reset、完成 |
| -04 | Lab UI | 操作介面、狀態回饋、keyboard／mobile 行為 | 可依 pageflow 完成 Lab，不直接操作外部服務 |
| -05 | Integration + QA | route、progress、map status、tests、build 修正 | 完成後才標記 ready，既有回歸測試通過 |

依賴關係：

```text
-01 ─┬─ -02
     └─ -03 ── -04
-02 ──────────┘
-04 + -02 + CORE-002 + CORE-004 → -05
```

更精確地說：

- `-01` 只依賴 M0 的 project contract，可先開始。
- `-02` 與 `-03` 可平行；`-03` 另外依賴 `CORE-001`、`CORE-006`。
- `-04` 依賴 `-03` 與 `CORE-005`；可使用 `-01` 已定義的 fixture contract，不必等待全部文案完成。
- `-05` 才整合 lesson、Lab、progress 與 QA，因此是 topic 的唯一收尾 task。
- 不同 topic 之間沒有 hard dependency；課程學習順序是 soft dependency，不應阻塞工程開發。

## 7. M2：Foundations／Web Backlog

每個 topic 都展開為 `-01` 到 `-05` 五個 task：

| Topic ID | 主題 | 第一個 task prefix | 狀態 |
| --- | --- | --- | --- |
| remote | GitHub／GitLab 遠端協作 | REMOTE | ready |
| cli | 命令列 | CLI | ready |
| ide | IDE／除錯器 | IDE | ready |
| package | 套件管理 | PACKAGE | ready |
| env | 環境變數 | ENV | ready |
| build | 建置工具 | BUILD | ready |
| rest | REST API／FastAPI | REST | ready |

例如第一個主題會產生：`REMOTE-01` acceptance、`REMOTE-02` lesson、`REMOTE-03` simulator、`REMOTE-04` Lab、`REMOTE-05` integration／QA。

M2 的 9 個 Core topic（含既有 Git 與 Auth）均已 ready。M2 的 hard dependency 只有 M1；Remote、CLI、IDE、Package、Env、Build、REST 之間的先後是學習順序，不是工程阻塞。若某 topic 需要共用 fixture，應把 fixture contract 放進該 topic 的 `-01`，不要直接依賴另一個 topic 的完成。

Git 與 Auth 都已有可執行 implementation；Git 的 cowork／pipeline 上線門檻與 accessibility release review 已通過。兩者仍需在 M6 建立 regression／migration 檢查。

| Task ID | Task | 輸出 | 依賴 | 狀態 |
| --- | --- | --- | --- | --- |
| GIT-REVIEW | Git 基礎、cowork 與 pipeline release gate | `docs/git-acceptance.md`、12 項操作與 pipeline 驗收 | M1 | done（2026-08-16；manual keyboard／mobile／reduced-motion review passed） |

## 8. Extension track backlog

Guardrails 是第一個 Extension topic；問題處理方法是第二個。兩者都使用既有 TopicModule、route、progress 與 simulator 契約，但不計入 Core 19。

| Task ID | Task | 依賴 | 狀態 |
| --- | --- | --- | --- |
| GUARDRAIL-01 | topic acceptance、lesson outline、fixture contract | M0 | done |
| GUARDRAIL-02 | Lesson 與教學 fixture | GUARDRAIL-01 | done |
| GUARDRAIL-03 | deterministic guardrail simulator | GUARDRAIL-01、CORE-001、CORE-006 | done |
| GUARDRAIL-04 | Guardrail Lab UI | GUARDRAIL-03、CORE-005 | done |
| GUARDRAIL-05 | route、progress、integration、QA | GUARDRAIL-02、GUARDRAIL-04、CORE-002、CORE-004 | done |

Guardrail 的完成狀態與 Core progress 分離；未來其他 Extension topic 可沿用同一組五 task packet。

| Task ID | Task | 依賴 | 狀態 |
| --- | --- | --- | --- |
| PROBLEM-01 | 問題處理 acceptance、lesson outline、fixture contract | M0 | done |
| PROBLEM-02 | 問題處理 Lesson 與教學 fixture | PROBLEM-01 | done |
| PROBLEM-03 | 問題處理 deterministic simulator | PROBLEM-01、CORE-001、CORE-006 | done |
| PROBLEM-04 | 問題處理 Lab UI | PROBLEM-03、CORE-005 | done |
| PROBLEM-05 | route、progress、integration、QA | PROBLEM-02、PROBLEM-04、CORE-002、CORE-004 | done |

## 9. M3：Data Backlog

| Topic ID | 主題 | Task prefix |
| --- | --- | --- |
| sql | SQL | SQL |
| schema | 資料庫設計 | SCHEMA |
| index | 索引與交易 | INDEX |
| postgresql | PostgreSQL | PGSQL |

每個 topic 使用 Topic Task Packet 五個 task。資料庫主題第一版仍以 fixture／模擬資料呈現，不因教學內容而提前引入正式 database。

M3 的 4 個 Data topic 均已 ready；上述建議學習順序只描述學習路徑，不是工程阻塞。

建議學習順序是 `SQL → Schema → Index／Transaction → PostgreSQL`。這是 soft dependency；只有實際共用的 fixture 或 module contract 才建立 hard dependency。

## 10. M4：Quality Backlog

| Topic ID | 主題 | Task prefix |
| --- | --- | --- |
| unit | 單元測試 | UNIT |
| integration | 整合測試 | INTEGRATION |
| logs | 日誌 | LOGS |

每個 topic 使用 Topic Task Packet 五個 task；共用測試工具的改動歸 M1 或獨立 task，不重複塞進每個 topic。

M4 的 3 個 Quality topic 均已 ready；Logs 以 deterministic fixture 與結構化事件呈現可觀測性，不連線真實 logging backend。

Unit、Integration、Logs 都只依賴 M1 的共用 contract；Integration 可在 Unit 教材完成前開發，避免把「測試概念順序」誤當成程式依賴。

## 11. M5：Delivery Backlog

| Topic ID | 主題 | Task prefix |
| --- | --- | --- |
| docker | Docker 基礎 | DOCKER |
| cicd | CI/CD | CICD |
| deploy | 部署 | DEPLOY |

既有 GitHub Actions、Pages 與 branch protection 是產品交付基礎，不直接等同於這三個教材完成；教材 task 仍需解釋概念、取捨與可操作 Lab。

M5 的 topic tasks 可平行開發。對教材內容而言，Docker、CI/CD、Deploy 不互相阻塞；只有 M6 的實際 release audit 需要等待相關教材與 workflow 都完成。

## 12. M6：Hardening／Release

| Task ID | Task | 驗收 |
| --- | --- | --- |
| RELEASE-001 | 19 topic status audit | `curriculum.json`、map、route、progress 一致 |
| RELEASE-002 | Git／Auth regression audit | 既有 route、completion key、simulator、keyboard 行為不回歸 |
| RELEASE-003 | Cross-topic UX audit | lesson、Lab、錯誤、reset、completion UI 一致 |
| RELEASE-004 | Accessibility／mobile audit | keyboard、live announcement、responsive、reduced motion 通過 |
| RELEASE-005 | Full test／lint／build audit | CI required checks 綠燈 |
| RELEASE-006 | Release／Pages audit | `main` release merge 與 Pages deployment 可追蹤 |
| RELEASE-007 | Documentation handoff | Plan、SA、SD、task breakdown 與進度交接一致 |

M6 的 task 依賴分成兩層：`RELEASE-001`、`RELEASE-002`、`RELEASE-003`、`RELEASE-004` 可在各 Milestone 完成後分批執行；`RELEASE-005` 依賴所有 topic integration，`RELEASE-006` 依賴 `RELEASE-005`，`RELEASE-007` 最後執行。

## 13. Definition of Ready / Done

### Task Ready

- Task ID、目標、輸出、驗收條件、依賴與 out-of-scope 已寫清楚。
- 所需的上游 contract 已確認，沒有以「等資料」掩蓋未決策的格式。
- 不會同時修改另一個 topic 的未聲明行為。

### Task Done

- 輸出已存在並符合驗收條件。
- 必要的 simulator／UI／integration test 已加入或更新。
- `npm test`、`npm run lint`、`npm run build` 通過（若 task 只改文件，至少通過 diff／文件檢查）。
- PR 描述列出 task ID、測試結果與已知風險。

## 14. GitHub 對應方式

本文件先是 repository 內的 canonical backlog；經 review 後再轉成 GitHub 管理物件：

- Milestone：使用 `M0` 到 `M6`。
- Issue title：`[REMOTE-03] 建立遠端協作 simulator`。
- Labels：`area:*`、`type:spec|content|simulator|ui|qa|release`。
- Dependencies：寫在 issue body，以 `Blocked by #...` 或 task ID 表示。
- 每個 task 一個主要 PR；跨 task 變更必須先更新依賴關係。

本輪不直接建立 GitHub Milestones／Issues；先讓 task 顆粒度與 Milestone 邊界被確認，避免把錯誤拆分同步到遠端。

## 15. 目前下一個可開工 task

目前 16 / 19 Core topic 已 ready，M2、M3、M4 已完成。下一個可開工的是 M5 Delivery 的 `DOCKER-01`；`CICD-01` 與 `DEPLOY-01` 可平行規劃。若先處理架構債務，仍可開 `CORE-008`；它不阻塞 M5 教材 task。M6 的 release audit 要等所有 Core topic integration 完成後再收斂。
