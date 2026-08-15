# Guardrail Workshop Rebuild：Feature Brief

> 狀態：Draft
> 日期：2026-08-15
> 參考來源：`C:\Users\ytwei\Projects\Guardrail-Workshop`
> 依附架構：`docs/project-sa.md`、`docs/project-sd.md`

## 1. 定位

本 feature 不是把 Guardrail Workshop repository 搬進本專案，也不是直接重用它的 React、FastAPI 或 CSS。它是以原專案的教材目標、互動概念與驗收情境為參考，在 Software Engineering Workshop 內重新設計並實作一個符合既有 TopicModule 契約的 AI／LLM Extension topic。

Guardrail Workshop 原本同時包含靜態 Demo 與可選的 FastAPI／SQLite backend；本次 rebuild 第一階段只交付能在 GitHub Pages 執行的 deterministic browser simulator。完整 backend 留作後續 Capstone，不成為本專案 Phase 1 的執行依賴。

## 2. 學習目標

完成本 topic 後，學習者應能：

1. 說明 LLM 應用為何需要輸入、輸出與工具呼叫的驗證層。
2. 分辨 Validator、Guard、Hub 與 OnFailAction 的責任。
3. 操作 exception、fix、reask、pass 四種失敗處理策略。
4. 理解檢查成本、串行／平行延遲與縱深防禦的取捨。
5. 以規則資料與測試案例設計一個最小 guardrail pipeline。

## 3. 第一階段範圍

### In scope

- 新增 `AI／LLM Engineering` Extension track。
- 新增一個 `guardrail` topic，不計入 Core 19 topics 的必修完成總數。
- 以 Lesson 呈現風險、三個掛載點、常見檢查、框架定位、延遲與縱深防禦。
- 以 Lab 操作 input／output／tool 三個 stage 的 deterministic simulator。
- 提供代表性 validator fixture：prompt injection、PII／secret、moderation、off-topic、structured output 與 tool side effect。
- 提供 `exception > reask > fix > pass` 的整體結果優先序。
- 以固定 latency fixture 呈現檢查成本，不呼叫真實模型或外部分類器。
- 完成 Lab 指定情境後，以獨立 progress key 標記完成。

### Out of scope

- FastAPI、SQLite、PostgreSQL 或任何 server runtime。
- 真實 OpenAI、Anthropic、Guardrails AI、NeMo Guardrails 或 LlamaGuard 呼叫。
- 真實 API key、帳號、外部資料或使用者對話收集。
- 直接複製 Guardrail Workshop 的 source code、repository history 或 UI。
- 修改 Core 19 topics 的 learning order、完成條件或既有 Git／Auth contracts。

## 4. 使用者流程

```text
課程地圖
  → AI／LLM Engineering Extension track
  → Guardrail Lesson
  → Guardrail Lab
  → 選擇 stage 與 validators
  → 送出固定情境
  → 顯示每層結果、失敗策略與 latency
  → 完成三個指定情境
  → 標記 guardrail topic complete
```

學習者可以從 Lesson 直接進入 Lab；Lab 的任何失敗都必須能說明原因並可 reset，不得把資料送出瀏覽器。

## 5. TopicModule 接入契約

### Metadata

```text
topic id: guardrail
track id: ai-engineering
track kind: extension
lesson route: #/guardrail
lab route: #/guardrail-lab
completion key: se-workshop-guardrail-complete
```

### 建議 module 邊界

```text
frontend/src/topics/guardrail/
  lesson.tsx
  lab.tsx
  content.ts
  simulator.ts
  simulator.test.ts
```

若規則資料需要與 Lesson fixture 分離，可新增 `shared/guardrail-rules.json`；該檔案只存可版控的教學規則，不存 secret、模型輸出或使用者資料。

### 不可違反的整合規則

- 不新增第二套路由、進度 repository 或 App-level topic-specific 分支。
- 不改名、不覆蓋 `se-workshop-git-complete` 與 `se-workshop-auth-complete`。
- Guardrail progress 與 Core progress 分開計算；完成 Guardrail 不會改變 Core 19 的完成率或 ready gate。
- Lesson、Lab、simulator、completion 與 tests 各自維持 TopicModule 責任邊界。
- Simulator 不直接依賴 React、localStorage、network 或 backend。

## 6. Simulator 最小契約

```text
GuardrailState {
  stage: input | output | tool
  enabledValidators: ValidatorId[]
  lastInput: string
  results: ValidatorResult[]
  outcome: pass | fixed | reask | blocked
  latencyMs: number
  phase: initial | active | failed | completed
}
```

```text
events:
  selectStage(stage)
  setInput(text)
  toggleValidator(id)
  submitScenario(id)
  reset()
```

同一個初始狀態與事件序列必須得到相同結果。Lab 不執行真實 LLM；`reask` 以固定的示範結果呈現，不進行第二次網路呼叫。

## 7. 完成條件

`guardrail` topic 只有在以下條件全部成立時才能標記完成：

- 成功通過一個安全 input scenario。
- 觸發一個 input 或 output 的 `exception`／`fix`／`reask` 情境並能看到原因。
- 完成一個 tool side effect 被攔截的情境。
- 學習者能 reset 並重新執行 Lab。
- refresh 後 progress 仍保留，且不影響 Core 19 progress。

## 8. 依賴與拆分

| Task | 輸出 | 硬依賴 |
| --- | --- | --- |
| GUARDRAIL-01 | topic acceptance、lesson outline、fixture contract | M0 |
| GUARDRAIL-02 | Lesson 與教學 fixture | GUARDRAIL-01 |
| GUARDRAIL-03 | deterministic guardrail simulator | GUARDRAIL-01、CORE-001、CORE-006 |
| GUARDRAIL-04 | Guardrail Lab UI | GUARDRAIL-03、CORE-005 |
| GUARDRAIL-05 | route、progress、integration、QA | GUARDRAIL-02、GUARDRAIL-04、CORE-002、CORE-004 |

`GUARDRAIL-01` 可在 M0 完成後與 `CORE-001` 平行；`GUARDRAIL-02` 與 `GUARDRAIL-03` 可平行。Guardrail 不依賴原本 Guardrail Workshop repository 的 branch 或 commit。

## 9. 驗收方式

- `npm test`：simulator 的正常、非法、reset、優先序與 completion 測試通過。
- `npm run lint`：TypeScript 檢查通過。
- `npm run build`：GitHub Pages 靜態 build 通過。
- 手動驗收：map → lesson → lab → complete → map pageflow 通過。
- 手動驗收：keyboard、mobile、live announcement、reduced motion 通過。
- 手動驗收：瀏覽器 network 不出現真實模型、API 或 secret 傳送。

## 10. 後續 Capstone 邊界

若未來要重建原 Guardrail Workshop 的 FastAPI／SQLite／Live API 能力，必須另立 Capstone 或 Phase 2 feature，透過 API adapter 與本 topic 的 Lesson／Lab 分離。該 Capstone 不得反向要求 GitHub Pages 具備 backend，也不得讓 Phase 1 的 Guardrail simulator 依賴 server。
