# REST／FastAPI Workshop 驗收規格

> 狀態：Accepted for implementation
> 日期：2026-08-16
> Task：REST-01～REST-05
> 上位契約：`docs/project-sa.md`、`docs/project-sd.md`

## 1. 學習目標

完成本主題後，學習者應能：

1. 從 React `fetch` 追蹤一個 HTTP request 如何進入 FastAPI。
2. 說明 CORS、routing、Pydantic validation 與 dependency injection 的執行順序。
3. 分辨 FastAPI、SQLModel Session、database engine 與 SQLite 的責任。
4. 說明 request model、table model 與 response model 為何要分離。
5. 從實際程式碼判斷 `201`、`404` 與 `422` 在哪一層產生。

## 2. Lesson／Lab Pageflow

```text
REST Lesson
  → FastAPI request lifecycle mental model
  → REST Lab
  → 選擇 request scenario
  → 送出 deterministic request
  → 逐站追蹤 React／FastAPI／Pydantic／Session／SQLite／response
  → 點選每一行閱讀執行時機、連接關係與錯誤後果
  → 完成四個 required scenarios
  → 標記 REST topic complete
```

## 3. Required scenarios

| Scenario | 預期結果 | 教學重點 |
| --- | --- | --- |
| `create-success` | `POST /items` → `201` | request body、validation、Session、INSERT、response model |
| `read-success` | `GET /items/1` → `200` | path parameter、SELECT、serialization |
| `not-found` | `GET /items/99` → `404` | 查詢成功執行，但 resource 不存在 |
| `validation-error` | invalid `POST /items` → `422` | validation 在 route 與 database 前拒絕 request |

## 4. 程式碼教學契約

- 顯示 `frontend/src/api.ts`、`backend/database.py`、`backend/models.py`、`backend/main.py`。
- 每個非空白程式碼行都有對應說明。
- 每行說明至少包含：做什麼、何時執行、如何連到相鄰層、刪除或寫錯的後果。
- 「學習模式」顯示逐行摘要；「原始碼模式」保留可直接複製的乾淨程式碼。
- request trace 必須同步標示目前執行階段與相關程式碼行。

## 5. Simulator 契約

```text
RestLabState {
  selectedScenarioId
  requestStarted
  activeStageId
  currentVisitedStageIds
  learnedStageIds
  completedScenarioIds
  databaseItems
  response
  phase: initial | tracing | error | completed
  lastMessage
}
```

```text
events:
  selectScenario(id)
  startRequest()
  inspectStage(id)
  nextStage()
  reset()
```

相同 initial state 與 event sequence 必須得到相同 state。Simulator 不執行 network、Python、SQLModel 或 SQLite。

## 6. 完成條件

- 四個 required scenarios 全部執行到各自的 terminal stage。
- 學習者至少跨情境走過七個 lifecycle stages。
- `validation-error` 不得產生 SQL 或改變 database fixture。
- `create-success` 只能產生 deterministic item `id=3`；重跑不重複新增。
- 完成後使用 `se-workshop-rest-complete` 保存進度。

## 7. Out of scope

- 任意 Python 執行、Pyodide 或真實 FastAPI server。
- 真實 database、transaction concurrency、migration 或 authentication。
- 完整 Swagger UI 複製。
- 把 GitHub Pages 當成 backend runtime。

## 8. 驗收

- Simulator tests：happy path、`404`、`422`、非法 stage、reset、determinism、completion。
- Content tests：每個非空白 code line 都有四欄解說，scenario 與 code stage mapping 完整。
- Integration tests：route、completion key、Core progress denominator 與 curriculum ready 狀態一致。
- `npm test`、`npm run lint`、`npm run build` 通過。
- Keyboard、mobile、live announcement 與 reduced-motion 行為符合共用 checklist。
