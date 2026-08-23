# INTEGRATION-01：整合測試驗收規格

> 狀態：Accepted for implementation
> 日期：2026-08-22
> Task：INTEGRATION-01
> 上位契約：`docs/project-sa.md`、`docs/project-sd.md`

## 1. 學習目標

完成本主題後，學習者應能：

1. 分辨 unit boundary 與整合測試 boundary；整合測試要驗證多個真實模組如何透過公開契約協作。
2. 用一個小而完整的 fixture，追蹤輸入如何經過 client adapter、service 與 repository adapter。
3. 說明整合測試何時保留真實模組，何時在外部服務邊界使用 deterministic fake。
4. 從錯誤位置判斷是資料契約不一致、依賴失敗，還是測試 fixture 沒有表達必要條件。
5. 分辨整合測試與 unit、E2E、load test 的責任，不用一種測試取代所有層級。

## 2. Lesson／Lab Pageflow

```text
Integration Lesson
  → unit boundary 與 integration boundary 的對照
  → 讀懂 checkout fixture 的 module contract
  → Integration Lab
  → 選擇 deterministic scenario
  → 依序觀察 client adapter → service → repository adapter → response
  → 檢查每個邊界的輸入、輸出與 failure consequence
  → 完成 success、contract failure、dependency failure 三個 scenarios
  → 重跑固定 regression flow
  → 標記 Integration topic complete
```

Lab 只呈現可重現的狀態轉換，不連線真實 HTTP server、database、queue 或第三方服務。

## 3. 核心概念與 Lesson outline

| Section | 要回答的問題 | 必須留下的判斷線索 |
| --- | --- | --- |
| Boundary | 哪些模組必須一起測？ | `checkoutClient`、`orderService` 與 `orderRepository` 的公開 contract 是整合邊界；純計算仍可由 unit test 保護。 |
| Fixture | 測試需要準備什麼？ | 小型 order input、固定 repository rows、明確的 expected response，以及可控制的 dependency outcome。 |
| Success trace | 正常協作如何完成？ | input 經過 adapter、service、repository 後，回傳同一個可驗證的 `orderId`、`total` 與 `status`。 |
| Contract failure | 契約不一致如何被看見？ | 缺少必要 response 欄位或型別不符時，在模組邊界失敗；測試不可自行補預設值掩蓋問題。 |
| Dependency failure | 外部依賴失敗如何傳遞？ | repository 的 deterministic failure 必須成為可讀的 service error，且不得假裝訂單已建立。 |
| Regression | 為什麼要重跑整組流程？ | 修正一個 adapter contract 後，success 與兩個 failure behaviors 都仍然成立。 |

## 4. Required scenarios

| Scenario | Fixture outcome | 教學重點 |
| --- | --- | --- |
| `create-order-success` | `checkout` input 經過三個模組後回傳 `201`、`orderId: "ord-001"`、`total: 90` | 多個真實模組以公開 contract 協作；不是只測一個函式的 return value。 |
| `response-contract-error` | response 缺少 `orderId` 時在 response boundary 失敗，結果為 `contract-error` | 不可用 `|| "unknown"` 或其他預設值掩蓋 producer／consumer 契約漂移。 |
| `repository-unavailable` | repository 回傳固定 `dependency-unavailable`，service 回傳可讀錯誤且不建立 order | 整合測試要驗證錯誤傳遞與副作用邊界，不只驗證 happy path。 |

每個 scenario 都必須顯示：目前 stage、已通過的 module boundary、下一個可觀察的輸入／輸出，以及失敗時沒有發生的副作用。

## 5. Fixture contract

### 5.1 Module boundaries

```text
checkoutClient
  → orderService
  → orderRepository
  → orderResponse
```

| Module | Input contract | Output contract | 整合測試觀察點 |
| --- | --- | --- | --- |
| `checkoutClient` | `{ items: [{ sku, quantity, unitPrice }], discount }` | `CreateOrderRequest` | request mapping 不遺漏 item、quantity 或 discount。 |
| `orderService` | `CreateOrderRequest` | `OrderDraft` 或 typed error | business rule 使用已驗證資料；不直接讀取 UI state。 |
| `orderRepository` | `OrderDraft` | `{ orderId, total, status }` 或 `dependency-unavailable` | repository 是可控制的外部邊界；failure 不得被吞掉。 |
| `orderResponse` | repository result | `{ orderId, total, status }` | consumer 驗證必要欄位與型別，再宣告 success。 |

### 5.2 Deterministic data

```ts
const createOrderInput = {
  items: [
    { sku: "book", quantity: 2, unitPrice: 50 },
  ],
  discount: 10,
};

const successfulRepositoryResult = {
  orderId: "ord-001",
  total: 90,
  status: "created",
};
```

Fixture rules：

- `subtotal` 是 `2 × 50 = 100`，`discount` 是 `10`，因此成功結果的 `total` 固定為 `90`。
- `orderId`、`status` 與 error code 都是固定值；不可使用目前時間、random UUID 或真實資料。
- `response-contract-error` 只改變 response contract，不能同時改變輸入或 repository outcome。
- `repository-unavailable` 只改變 dependency outcome；它不得產生 `orderId` 或寫入成功狀態。
- 相同 initial state 與 event sequence 必須得到相同 stage、output、error 與 completion 結果。

### 5.3 Lab state boundary

後續 `INTEGRATION-03` simulator 應能表達下列概念；欄位名稱可微調，但不可移除其可觀察語意：

```text
IntegrationLabState {
  selectedScenarioId
  activeStageId
  completedScenarioIds
  visitedBoundaryIds
  phase: initial | tracing | blocked | completed
  response: success | contract-error | dependency-unavailable | null
  sideEffects: none | order-created
  lastMessage
  canReset: true
}
```

建議 stage 順序為 `input → client → service → repository → response`。後續 implementation 可以合併或拆分視覺 stage，但必須保留 module boundary、failure location 與 side-effect 結果。

## 6. Failure feedback contract

- 在未選擇 scenario 前執行 trace：阻擋並提示先選擇 fixture。
- 未完成前一個 boundary 就跳到後面：阻擋並指出 required boundary，不直接完成。
- response 缺少 `orderId`：顯示 contract error，保留失敗位置，不產生 `order-created`。
- repository 回傳 `dependency-unavailable`：顯示 dependency failure，保留 error code，不產生成功 response。
- 已完成後再次操作：提示先 reset，不偷偷累加 scenario 或 side effect。
- reset：回到固定 initial fixture，清除 visited boundaries、responses、errors 與 completion state。

錯誤訊息必須說明「哪個 boundary 失敗、看見什麼證據、下一步要檢查什麼」，不可只顯示 `failed`。

## 7. 完成條件

- 三個 required scenarios 都完成各自的 terminal outcome。
- Success scenario 走過 `client → service → repository → response`，並產生固定 `ord-001`。
- 兩個 failure scenarios 都在正確 boundary 停止，且 side effect 與 response 狀態正確。
- Regression flow 能重跑三個 scenarios，結果與第一次一致。
- 完成後使用 `se-workshop-integration-complete` 保存進度。
- 本 task 只定義 contract；在 `INTEGRATION-05` 前不得把 `integration` 改成 curriculum `ready`。

## 8. Out of scope

- 真實 HTTP server、database、message queue、container 或第三方 API。
- E2E browser automation、snapshot testing、load testing、contract testing platform 或 CI provider 整合。
- 重複 `UNIT` 已驗證的純函式 edge cases；本主題只觀察模組協作與 boundary behavior。
- 修改既有 Git／Auth persistence key、共用 route registry、ProgressRepository 或 `CORE-008` dispatcher。
- 在本 task 建立 backend、migration 或正式 production adapter。

## 9. INTEGRATION-01 驗收

- 文件明確描述學習目標、Lesson／Lab pageflow、lesson outline、三個 scenarios、module contract、deterministic fixture、failure feedback、completion 與 out-of-scope。
- `INTEGRATION-02` 可依本文件撰寫文案與 fixture，不需要重新決定 success／failure semantics。
- `INTEGRATION-03` 可依本文件建立純 simulator；不需要真實 network 或 database。
- `INTEGRATION-04` 可依本文件設計 Lab feedback、reset、keyboard 與 mobile interaction。
- 後續 `INTEGRATION-05` 可用固定 completion key、route 與 progress contract 接入，且不改變既有 topic 的完成統計。
- 文件檢查與 `git diff --check` 通過；本 task 不要求重新執行完整 frontend test suite。

## 10. 已知 rework 風險

- 後續 UI 可能把五個 trace stages 合併成較少的視覺步驟；只要保留四個 module boundary、failure location 與 side-effect semantics，不視為契約破壞。
- 若 `INTEGRATION-02` 發現更適合的 domain 名稱，可調整文案與 TypeScript type 名稱，但應維持三個 scenario 的 observable outcomes 與 completion key。
- 若既有共用 simulator harness 增加欄位，應由共用契約 task 處理，不把 framework change 偷塞進本 topic。
