# LOGS-01：結構化日誌與可追蹤線索驗收規格

> 狀態：Accepted for implementation
> 日期：2026-08-22
> Task：LOGS-01
> 上位契約：`docs/project-sa.md`、`docs/project-sd.md`

本文件鎖定 Logs 主題的學習目標、Lesson／Lab pageflow、fixture、結構化 log event、失敗回饋與完成邊界。後續 task 可以調整 TypeScript type 或視覺分段名稱，但不可改變本文件定義的 observable semantics。

## 1. 學習目標

完成本主題後，學習者應能：

1. 分辨 logs、metrics 與 traces 的用途；Logs Lab 只練習以事件留下可讀、可搜尋的執行線索。
2. 讀懂結構化 log event，知道穩定的 machine-readable 欄位與人類可讀的 message 如何並存。
3. 依事件嚴重性選擇 `debug`、`info`、`warn` 或 `error`，不把所有事件都記成 error。
4. 用固定的 `correlationId` 把同一個 request 的事件串成一條可追蹤的時間線。
5. 在格式化與輸出前移除 authorization、password、token、cookie 與 PII，不依賴 UI 遮罩假裝完成 redaction。
6. 用 deterministic fixture 比較正常、輸入被拒絕與依賴逾時三條路徑，從 log 證據判斷結果而不是猜測根因。

## 2. Lesson／Lab Pageflow

```text
Logs Lesson
  → logs、metrics、traces 的責任邊界
  → 結構化 log event 的欄位
  → severity 與 event naming
  → correlationId 與 request timeline
  → redaction 與 safe context
  → Logs Lab
  → 選擇 deterministic scenario
  → 逐筆檢視 log events
  → 驗證 level、correlationId、terminal outcome 與 redaction
  → 完成 success、validation rejection、dependency timeout 三個 scenarios
  → reset 後重跑固定 regression flow
  → 標記 Logs topic complete
```

Lab 只呈現可重現的狀態轉換，不寫入檔案、不連線 logging backend、不使用目前時間或 random UUID，也不把真實帳號、token 或 request body 傳出瀏覽器。

## 3. Lesson outline

| Section | 要回答的問題 | 必須留下的判斷線索 |
| --- | --- | --- |
| Responsibility | Logs、metrics、traces 各自看什麼？ | Logs 保存事件與上下文；metrics 聚合數值；traces 串起跨邊界的執行路徑。本主題只實作前者。 |
| Event schema | 一筆 log 怎樣既能搜尋又能閱讀？ | `level`、`event`、`source`、`correlationId`、`outcome` 是穩定欄位；`message` 不能取代結構化欄位。 |
| Severity | 什麼值得 warn，什麼才是 error？ | 可預期的輸入拒絕是 `warn`；依賴逾時造成請求失敗是 `error`；正常完成是 `info`。 |
| Correlation | 如何把同一個 request 的事件連起來？ | 同一 scenario 的每筆 event 都使用同一個 `correlationId`，不可靠 message 文字或事件順序猜測。 |
| Redaction | 如何避免 log 洩漏秘密？ | 使用 safe context allowlist；敏感欄位在格式化前被移除，raw value 不得出現在 `message`、`context` 或 serialized output。 |
| Evidence | 日誌能證明什麼，不能證明什麼？ | Log 能證明事件、時間線與輸出結果；不能單獨證明根因、效能趨勢或跨服務完整 trace。 |
| Regression | 修正 log mapping 後如何避免倒退？ | reset 後用同一 event sequence 重跑三條路徑，結果、欄位與 redaction 必須一致。 |

## 4. Required scenarios

| Scenario | Fixture outcome | 教學重點 |
| --- | --- | --- |
| `request-success` | `POST /orders` 完成，回傳固定 `201`，terminal event 為 `info`／`success` | 正常完成不是 error；同一個 `correlationId` 可以連起 received 與 completed events。 |
| `validation-rejected` | 缺少固定欄位 `amount`，回傳固定 `400`，terminal event 為 `warn`／`rejected` | 可預期的輸入問題要保留可修正的證據，不應升級成 dependency error，也不得記錄整個 request body。 |
| `dependency-timeout` | `payment-provider` 固定逾時 `3000ms`，回傳固定 `503`，terminal event 為 `error`／`failed` | 依賴失敗要留下 dependency、timeout 與 correlation 證據，不得偽造成功或產生付款副作用。 |

每個 scenario 都必須讓學習者看見：目前 event、`source`、`level`、`correlationId`、安全的 `context`、terminal `outcome`，以及敏感欄位已被 redacted 的證據。

## 5. Log event contract

### 5.1 Event schema

後續 simulator 應維持下列語意；欄位名稱可以配合既有 shared types 調整，但不得移除必要資訊。

```ts
type LogLevel = "debug" | "info" | "warn" | "error";
type LogOutcome = "started" | "success" | "rejected" | "failed";
type LogSource = "api" | "validation" | "dependency";

interface LogEvent {
  sequence: number;
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  source: LogSource;
  correlationId: string;
  context: Readonly<Record<string, string | number | boolean>>;
  outcome: LogOutcome;
  redactedFields: readonly string[];
}
```

欄位規則：

- `sequence` 是從 `1` 開始的固定整數；Lab 依它顯示順序，不依賴陣列排序以外的副作用。
- `timestamp` 使用 fixture 提供的 ISO 8601 字串；不得呼叫 `Date.now()`、讀取使用者時鐘或在每次重跑時產生新值。
- `level` 只能是四種固定值；`validation-rejected` 必須是 `warn`，`dependency-timeout` 必須是 `error`。
- `event` 是穩定的 machine-readable 名稱，例如 `request.received`、`request.completed`、`request.validation_rejected`、`dependency.timeout`；不可只留下任意例外文字。
- `message` 說明人類可讀的事實與下一個判斷線索；不可把唯一重要資訊藏在 message，亦不可包含 raw secret。
- `source` 指出事件來自 API boundary、validation boundary 或 dependency boundary。
- `correlationId` 在同一 scenario 的所有 events 中必須完全相同；不同 scenario 要有不同固定值。
- `context` 只能放 safe context allowlist 內的欄位，例如 route、method、statusCode、field、dependency、timeoutMs、durationMs、reason；不得直接塞入整個 request 或 response。
- `outcome` 表示事件在流程中的結果，不等同於 HTTP status；terminal event 才能使用 `success`、`rejected` 或 `failed`。
- `redactedFields` 是 deterministic 的驗收證據，列出被移除的 input keys；清單排序固定，且不得包含被移除的 raw value。

### 5.2 Deterministic fixture

三個 scenarios 共用下列測試輸入。值是教學用 placeholder，但必須視為敏感資料處理；它們不應出現在任何輸出的 `message` 或 `context`。

```ts
const baseRequest = {
  method: "POST",
  route: "/orders",
  authorization: "Bearer test-secret-001",
  email: "learner@example.test",
  payload: { sku: "book", quantity: 1 },
};

const expectedCorrelationIds = {
  "request-success": "req-logs-001",
  "validation-rejected": "req-logs-002",
  "dependency-timeout": "req-logs-003",
} as const;
```

Terminal outcome 固定如下：

| Scenario | Terminal event | `source` | `level` | `context` 必須包含 | `outcome` |
| --- | --- | --- | --- | --- | --- |
| `request-success` | `request.completed` | `api` | `info` | `statusCode: 201`、`durationMs: 42` | `success` |
| `validation-rejected` | `request.validation_rejected` | `validation` | `warn` | `statusCode: 400`、`field: "amount"` | `rejected` |
| `dependency-timeout` | `dependency.timeout` | `dependency` | `error` | `dependency: "payment-provider"`、`timeoutMs: 3000`、`statusCode: 503` | `failed` |

Fixture rules：

- 每個 scenario 至少先產生 `request.received`，再產生一筆固定 terminal event；兩筆 event 的 `correlationId` 必須相同。
- `request.received` 的 `level` 固定為 `debug`、`source` 固定為 `api`、`outcome` 固定為 `started`。
- `request-success` 只能改變 terminal success outcome；不得同時加入 timeout 或 validation failure。
- `validation-rejected` 只能因缺少 `amount` 被拒絕；不得輸出 `authorization`、`email` 或完整 payload。
- `dependency-timeout` 只能因固定 `payment-provider` 在 `3000ms` 逾時失敗；不得產生成功付款或訂單副作用。
- 相同 initial state 加上相同 event sequence，必須得到相同的 events、feedback、terminal outcome 與 completion 結果。
- 不可使用目前時間、random UUID、網路回應、真實 provider、瀏覽器 local state 以外的外部輸入。

### 5.3 Redaction contract

Redaction 必須在 event 格式化前完成，而不是只在畫面上用 CSS 或字串替換遮住結果：

- `authorization`、`password`、`accessToken`、`cookie` 與 `email` 的 raw value 不得出現在 `message`、`context`、`redactedFields` 或 serialized event output。
- `redactedFields` 必須至少記錄本 fixture 中被移除的 `authorization` 與 `email`，並以固定順序輸出。
- 安全輸出只能使用 allowlist 欄位；不得透過 `JSON.stringify(baseRequest)` 再事後刪除一部分文字。
- 任一 raw sensitive value 被找到時，scenario 必須進入 `redaction-failed` feedback，不能完成，也不能把該 event 當作有效證據。
- reset 後 redaction 結果必須與第一次執行完全一致。

### 5.4 Lab state boundary

後續 `LOGS-03` simulator 應能表達下列概念；欄位名稱可微調，但不可移除其可觀察語意：

```text
LogsLabState {
  phase: initial | inspecting | blocked | completed
  selectedScenarioId: request-success | validation-rejected | dependency-timeout | null
  activeEventIndex: number
  visibleEventIds: string[]
  completedScenarioIds: string[]
  correlationCheck: pending | passed | failed
  redactionCheck: pending | passed | failed
  terminalOutcome: success | rejected | failed | null
  lastFeedback: none | success | blocked | redaction-failed
  lastMessage: string
  canReset: true
}
```

建議的 observable stage 順序為 `select → inspect-event → verify-correlation → verify-redaction → verify-terminal-outcome`。視覺上可以把檢查合併，但必須保留目前 event、固定 correlation、redaction 結果與 terminal outcome。

## 6. Failure feedback contract

- 未選擇 scenario 就執行 inspect：阻擋，提示先選擇一個 fixture。
- 跳過目前 event 或直接要求 terminal outcome：阻擋，指出尚未檢查的 `sequence` 與下一步。
- 同一 scenario 的 events 出現不同 `correlationId`：保留目前事件，顯示 correlation failure，不得標記 scenario 完成。
- `validation-rejected` 使用 `error` 或 `dependency-timeout` 使用 `warn`：阻擋並指出 severity 與 fixture evidence 不一致。
- 任一 raw sensitive value 出現在輸出：進入 `redaction-failed`，清楚指出被洩漏的欄位名稱；不顯示該 raw value 作為錯誤訊息的一部分。
- 未完成前一個 scenario 就宣告全部完成：阻擋，指出尚未完成的 scenario ids。
- 已完成的 scenario 再次操作：提示先 reset，避免重複累加 events 或副作用。
- reset：回到固定 initial fixture，清除目前 scenario、visible events、checks、feedback、terminal outcome 與 completion state。

每個錯誤訊息都必須說明「目前看到的證據、哪個 contract 不符、下一步要檢查什麼」，不可只顯示 `failed`、顏色或未處理 exception。

## 7. Completion contract

只有下列條件全部成立時，Logs Lab 才算完成：

- 三個 required scenarios 都完成各自的 terminal outcome。
- `request-success` 顯示 `info`／`201`／`success`，並保留固定 `req-logs-001`。
- `validation-rejected` 顯示 `warn`／`400`／`rejected`，並保留 `field: "amount"`。
- `dependency-timeout` 顯示 `error`／`503`／`failed`，並保留 `payment-provider` 與 `3000ms` 證據。
- 三個 scenarios 的 raw sensitive values 都沒有出現在 serialized log output；redaction checks 全部通過。
- 每個 scenario 的 events 都有一致的 `correlationId`，且 correlation checks 全部通過。
- reset 後重跑固定 regression flow，events、feedback、checks 與 terminal outcomes 與第一次一致。
- 完成後使用 `se-workshop-logs-complete` 保存進度。
- 本 task 只定義 contract；在 `LOGS-05` 前不得把 `logs` 改成 curriculum `ready`。

單獨看見一筆 log、通過 redaction、完成一條 scenario 或顯示 terminal event，都不得單獨標記 topic 完成。

## 8. Out of scope

- 真實 logger SDK、stdout／file sink、log collector、search backend、retention 或 production alerting。
- OpenTelemetry、distributed tracing、metrics aggregation、dashboard、SLO／告警門檻與跨服務 trace propagation。
- 真實 HTTP server、payment provider、資料庫、網路、登入帳號或 CI provider。
- 完整 production PII classification、加密、access control、audit retention policy；本 task 只鎖定 Lab 可驗證的敏感欄位 redaction。
- 使用真實時鐘、random UUID、瀏覽器 telemetry 或第三方分析服務。
- E2E browser automation、snapshot testing、load testing，以及重複 M1 共用 simulator harness 的改動。
- 修改既有 Git／Auth persistence key、共用 route registry、ProgressRepository 或 `CORE-008` dispatcher。

## 9. LOGS-01 驗收

- 文件明確描述學習目標、Lesson／Lab pageflow、lesson outline、三個 scenarios、event schema、deterministic fixture、redaction、state boundary、failure feedback、completion 與 out-of-scope。
- `LOGS-02` 可直接依本文件撰寫教材，不需要重新決定 logs／metrics／traces 的責任邊界、severity 或 completion key。
- `LOGS-03` 可直接依本文件建立純 simulator；不需要真實 logger、network、clock 或 provider。
- `LOGS-04` 可依本文件設計 Lab 的 inspect、reset、錯誤回饋、keyboard、mobile 與 reduced-motion interaction。
- 後續 `LOGS-05` 可使用固定 completion key、route 與 progress contract 接入，且不改變既有 topic 的完成統計。
- 文件檢查與 `git diff --check` 通過；本 task 不要求重新執行完整 frontend test suite。

## 10. 已知 rework 風險

- 若後續產品契約要求即時 timestamp，Lab 仍應保留 fixture timestamp 或 sequence 作為驗收依據；否則 reset／regression 會失去 deterministic boundary。
- `correlationId` 目前只代表單一 request 的教學關聯，不等同完整 distributed trace；若未來要加入 trace propagation，應新增契約欄位，不要偷換本 task 的語意。
- 敏感欄位清單未來可能擴充；實作應以 safe context allowlist 為邊界，讓新增敏感欄位不必依賴 UI 遮罩修補。
- 若共用 simulator harness 需要增加 event replay、redaction 或 feedback primitive，改動應歸 M1 或獨立 task，不把 framework change 偷塞進 LOGS topic。
