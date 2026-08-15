# Software Engineering Workshop：專案級 SD

> 狀態：Draft
> 日期：2026-08-15
> 上位文件：[project-plan.md](./project-plan.md)、[project-sa.md](./project-sa.md)
> 基線：`dev` @ `76caf3f`

## 1. 設計目標與原則

本文件將專案 SA 轉成可實作的技術契約。第一階段維持靜態前端、瀏覽器本機進度與 deterministic simulator；後續若需要 backend，透過明確的 adapter 邊界擴充，不把 API、token 或資料庫耦合進教材元件。

設計原則：

- 保護既有 Git／Auth routes、完成 keys、simulator 行為與可及性。
- 新增 topic 優先採 registry／module 方式，不持續擴張 `App.tsx` 的條件分支。
- simulator 是純狀態邏輯；UI、localStorage 與未來 API 不放進 simulator reducer。
- 課程定義、學習者進度與執行中 Lab state 分離。
- 所有 Lab 都能 reset，且同一輸入序列得到同一結果。

## 2. 目標架構

```text
Browser
┌──────────────────────────────────────────────┐
│ App shell                                     │
│  ├─ route registry                            │
│  ├─ curriculum map                            │
│  ├─ topic lesson                              │
│  └─ topic lab                                 │
│       ├─ simulator reducer                    │
│       ├─ lesson/lab fixtures                  │
│       └─ progress repository                  │
└──────────────────────────────────────────────┘
        │
        ├─ shared/curriculum.json
        └─ localStorage（Phase 1）

Repository → GitHub Actions → frontend/dist → GitHub Pages

Phase 2 optional:
Browser → API adapter → external API／serverless → database
```

GitHub Pages 只負責發布靜態輸出；API、認證與資料庫若未來加入，必須是外部服務，不能把 server runtime 假設成 Pages 的能力。

## 3. 目錄與 module 邊界

### 現有結構

- `shared/curriculum.json`：課程清單與 topic metadata
- `frontend/src/App.tsx`：目前 route、進度與頁面組合入口
- `frontend/src/components/`：地圖、教材、Lab UI
- `frontend/src/content/`：教材內容與 fixture
- `frontend/src/git/`、`frontend/src/auth/`：可測試 simulator 與測試
- `frontend/src/styles.css`：全站視覺與響應式規則

### 目標 topic module 結構

```text
frontend/src/topics/<topic-id>/
  lesson.tsx       # Lesson presentation
  lab.tsx          # Lab presentation
  content.ts       # copy and fixtures
  simulator.ts     # pure state machine
  simulator.test.ts
```

現有 Git／Auth 可先維持原路徑；新主題採上述邊界。後續重構以「不改既有 URL 與 persistence key」為前提逐步移動，不一次大改。

## 4. Topic module 契約

每個 `ready` topic 應能提供下列概念資料與能力。這是設計契約，不要求第一版立刻建立完整 runtime registry：

```text
TopicModule {
  id: string
  lesson: LessonDefinition
  lab: LabDefinition
  simulator: SimulatorDefinition
  progress: ProgressDefinition
}

LessonDefinition {
  title: string
  objectives: string[]
  sections: LessonSection[]
}

LabDefinition {
  title: string
  initialState: unknown
  completionRule: (state) → boolean
}

SimulatorDefinition {
  createInitialState() → State
  reduce(state, event) → State
  reset() → State
}

ProgressDefinition {
  completionKey: string
  isComplete() → boolean
  markComplete() → void
}
```

實際 TypeScript 型別由各 topic 的 SD 或 implementation PR 補齊；此處先鎖定責任，不鎖定過度通用的泛型 API。

## 5. Route 與導航設計

### 受保護 routes

以下既有 routes 不得移除或改變語意：

- `#/map`
- `#/git`
- `#/lab`
- `#/auth`
- `#/auth-lab`

### 新 topic route

新主題採可預測命名：

- `#/<topic-id>`：教材
- `#/<topic-id>-lab`：Lab

例如遠端協作使用 `#/remote` 與 `#/remote-lab`。若既有命名與規則不一致，優先保留舊 route，透過 alias 或 registry 兼容，不直接改 URL。

### Route registry

目標是集中管理：

```text
route → page kind → topic id → completion key
```

`App` 只負責讀取 route、選擇 page 與共用 shell；topic-specific lesson、Lab 與 simulator 不應回寫 App 的全域條件分支。

## 6. 課程與進度資料設計

### Curriculum source

`shared/curriculum.json` 維持現有格式：

```text
Curriculum
  tracks: Track[]

Track
  id, title, description, topics

Topic
  id, title, summary, status: planned | ready
```

`status` 表示教材是否已發布，不表示單一學習者是否完成。

### Learner progress

```text
TopicProgress {
  topicId: string
  completed: boolean
}
```

Phase 1 使用以 topic id 命名的 localStorage key：

```text
se-workshop-<topic-id>-complete = "true"
```

Git 的 `se-workshop-git-complete` 與 Auth 的 `se-workshop-auth-complete` 是既有 protected keys，不改名、不遷移、不覆蓋。

### Progress aggregation

完成數量應由 curriculum 中的 topics 與 progress repository 計算，不再只把 Git／Auth completion boolean 相加。planned topic 不得因為 localStorage 有未知值而被算入 ready 或完成。

## 7. Simulator 設計

### 狀態模型

每個 simulator 至少分離：

```text
SimulatorState {
  phase: initial | active | failed | completed
  workspace: topic-specific state
  lastMessage: learner-facing feedback
  canReset: boolean
}
```

不同主題可以擴充 `workspace`，但不得把瀏覽器、網路、localStorage 或 React state 放入純 simulator 核心。

### 事件模型

```text
reduce(state, event) → nextState

event = topic-specific action
```

規則：

- 相同 `state + event` 必須得到相同 `nextState`。
- 非法操作產生可理解的失敗狀態，不直接丟失整個 session。
- `reset` 回到固定初始 fixture。
- `completed` 只能由明確 completion predicate 判定。
- UI 只呈現狀態與派送事件，不自行複製規則。

## 8. Progress repository 與 Phase 2 adapter

Phase 1 定義最小 repository 邊界：

```text
ProgressRepository {
  read(topicId) → boolean
  markComplete(topicId) → void
  clear(topicId) → void
}
```

目前實作可由 localStorage adapter 提供。Phase 2 若加入帳號與同步，改以 API adapter 實作相同概念介面；前端 topic module 不直接知道 token、資料庫或 provider SDK。

不得把敏感資料放進：

- `shared/curriculum.json`
- `frontend/public/`
- bundle、localStorage 或 GitHub Pages 靜態輸出

## 9. UI 與可及性設計契約

- App shell 統一提供 sidebar、breadcrumb、mobile menu 與總進度。
- Lesson 與 Lab 使用相同的 topic header、status feedback 與 completion treatment。
- 互動控制項必須使用可識別的 button／input 語意，不以純點擊 div 取代。
- route 變更後將焦點與 scroll 狀態移到新頁面可理解的位置。
- Lab 的錯誤、成功與 reset 結果需提供可讀文字與 live announcement。
- 操作流程不可只依賴 hover、顏色或拖曳；需支援鍵盤與 mobile viewport。
- reduced-motion 狀態下不依賴動畫傳達必要資訊。

## 10. 測試設計

### Unit tests

- 每個 simulator 的初始狀態、正常事件、非法事件、reset、完成 predicate。
- Progress repository 的 read／mark／clear 行為；既有 Git／Auth key 不回歸。
- curriculum aggregation 對 planned／ready／complete 的計算。

### Integration／UI checks

- map → lesson → lab → complete → map 的 pageflow。
- planned topic 不可進入，ready topic 可進入。
- refresh 後 progress 保留。
- keyboard navigation、live announcement、mobile menu 不破壞。

### Delivery checks

```text
npm test
npm run lint
npm run build
```

CI 必須在 PR 進入 `dev` 與 `main` 前執行；Pages 僅部署通過 build 的 `frontend/dist`。

## 11. 分階段實作順序

1. 保持現有 Git／Auth route 與 simulator 不動。
2. 抽出或建立 progress repository 的共用邊界，先以既有 keys 驗證。
3. 建立 topic route registry，但保留既有 route alias。
4. 用 GitHub／GitLab 遠端協作作為第一個新 topic，驗證 Lesson、Lab、simulator、completion 與 tests 契約。
5. 依相同 module contract 擴充其餘主題。
6. 需要跨裝置、帳號或真實 provider 時，再實作 Phase 2 API adapter。

## 12. 技術風險與處理

| 風險 | 處理方式 |
| --- | --- |
| App 目前集中管理 route 與 completion | 先保留舊行為，再以 registry／repository 漸進抽離 |
| 19 個 topic 導致型別過度抽象 | 先鎖責任與事件邊界，不急著建立萬用 generic |
| simulator 與 UI 規則重複 | reducer 是唯一狀態規則來源，UI 只派送事件 |
| 未來接 backend 需要重做前端 | 先定 ProgressRepository／API adapter 邊界 |
| GitHub Pages 不能執行 backend | Phase 1 靜態部署，Phase 2 將 API 部署到外部服務 |

## 13. SD 驗收條件

- 新工程師可依本文件新增一個 topic，而不需修改既有 Git／Auth simulator 規則。
- 新 topic 有明確 lesson、lab、simulator、progress 與 test 邊界。
- 既有 route、completion key、課程清單格式與 CI／Pages 流程保持相容。
- Phase 1 不需要 backend 也能完整執行教材；Phase 2 的 API 擴充點清楚。
- 任何超出本 SD 的技術選擇，先更新 SD 或建立決策紀錄，再進入 implementation。
