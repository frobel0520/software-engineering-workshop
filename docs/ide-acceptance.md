# IDE-01：IDE／除錯器 acceptance

> 類型：Topic acceptance／fixture contract
> 狀態：可供 IDE-02、IDE-03 開發
> 依賴：M1 module foundation
> 範圍：瀏覽器內 deterministic editor／debugger sandbox；不執行真實 process、不讀取使用者檔案

本文件只鎖定 IDE／除錯器主題的學習目標、Lab pageflow、固定程式、debug state 與驗收邊界，不新增 feature-level SA／SD。

## 1. 學習目標

完成主題後，學習者應能：

1. 在固定專案中開啟指定檔案，理解 editor context 與目前執行位置是兩種不同狀態。
2. 在明確的程式行設定 breakpoint，知道 breakpoint 是暫停條件，不是錯誤修正本身。
3. 啟動固定函式並閱讀 call stack、目前行號與 variables，而不是只看最後輸出。
4. 用 step over 與 continue 控制執行，觀察變數如何在每一行後改變。
5. 區分「程式已完成」、「程式在 breakpoint 暫停」與「debugger 操作不合法」三種結果。

## 2. Pageflow 與 Lab happy path

```text
map → /ide lesson → /ide-lab
  → 開啟 src/order.ts
  → 在第 3 行設定 breakpoint
  → 執行 calculateTotal(10, 2, 3)
  → 觀察 paused state 與 variables
  → step over 到 return
  → continue 完成程式
  → completion treatment → map
```

Lab 使用固定 `order.ts` 與固定函式參數；所有 editor、debugger、call stack 與 variables 都由 fixture 決定，不會啟動瀏覽器外的 process。

概念操作與 simulator event 對應如下：

| 概念操作 | 教學指令／UI 動作 | event |
| --- | --- | --- |
| 開啟檔案 | `open src/order.ts` | `open-file` |
| 設定 breakpoint | `breakpoint 3` | `set-breakpoint` |
| 啟動函式 | `run calculateTotal(10, 2, 3)` | `run` |
| 讀取目前變數 | `inspect variables` | `inspect` |
| 執行下一行 | `step over` | `step-over` |
| 繼續到結束 | `continue` | `continue` |

## 3. Fixture contract

IDE-03 應以以下固定 fixture 作為初始狀態：

```ts
type IdeLabPhase = "initial" | "active" | "paused" | "failed" | "completed";
type IdeStepId = "open" | "breakpoint" | "run" | "inspect" | "step" | "continue";

interface IdeFileFixture {
  path: "src/order.ts";
  content: string;
  language: "typescript";
}

interface IdeLabState {
  phase: IdeLabPhase;
  selectedFile: string | null;
  breakpointLines: readonly number[];
  currentLine: number | null;
  callStack: readonly string[];
  variables: Readonly<Record<string, string>>;
  output: readonly string[];
  lastStream: "stdout" | "stderr" | null;
  exitCode: number | null;
  completedStepIds: readonly IdeStepId[];
  lastMessage: string;
  canReset: true;
}
```

固定檔案：

```ts
{
  path: "src/order.ts",
  language: "typescript",
  content: [
    "export function calculateTotal(price: number, quantity: number, discount: number) {",
    "  const subtotal = price * quantity;",
    "  const discounted = subtotal - discount;",
    "  return discounted;",
    "}",
  ].join("\\n"),
}
```

固定執行參數：`price = 10`、`quantity = 2`、`discount = 3`。

## 4. 固定狀態與完成條件

| event | accepted state／output | 完成 step |
| --- | --- | --- |
| `open-file` | `selectedFile = "src/order.ts"`，editor 顯示第 1–5 行 | `open` |
| `set-breakpoint` | `breakpointLines = [3]` | `breakpoint` |
| `run` | `phase = "paused"`、`currentLine = 3`、`callStack = ["calculateTotal"]`、variables 含 `subtotal = "20"` | `run` |
| `inspect` | 保留 paused state，顯示 `price=10`、`quantity=2`、`discount=3`、`subtotal=20` | `inspect` |
| `step-over` | `currentLine = 4`、variables 新增 `discounted = "17"` | `step` |
| `continue` | `phase = "completed"`、`currentLine = null`、output 為 `17` | `continue` |

只有 `completedStepIds` 包含 `open`、`breakpoint`、`run`、`inspect`、`step`、`continue` 時，Lab 才能標記完成。只看到最後 output 或只設定 breakpoint 都不能完成 topic。

## 5. 失敗狀態與回饋

| 情境 | 結果 | 必須呈現的概念 |
| --- | --- | --- |
| 開啟未知檔案 | `stderr` 顯示 file not found，selected file 不變，exit code `1` | editor context 不等於任意路徑都存在 |
| 設定第 99 行 breakpoint | `stderr` 顯示 invalid line，breakpoint 不變，exit code `1` | breakpoint 必須落在檔案有效行號 |
| 沒有 breakpoint 就執行 `run` | `phase = "failed"`，提示先設定 breakpoint，call stack 保持空值，exit code `2` | 跑完程式不等於完成 debug 流程 |
| 尚未 paused 就 `step over` | `stderr` 顯示 debugger is not paused，current line 不變，exit code `2` | step 操作需要 paused state |
| 尚未 paused 就 inspect | `stderr` 顯示 no active frame，variables 不變，exit code `2` | variables 必須從 active frame 讀取 |
| 在 run 前 continue | `stderr` 顯示 program has not started，output 不變，exit code `2` | continue 不會代替 run |
| 空白輸入 | 不新增 history／progress，保留既有 state | 無效輸入不可誤算進度 |

每個錯誤至少要說明 stream、exit code、目前 phase／current line 與下一步提示；不可只用顏色或 breakpoint 圖示表達結果。

## 6. IDE-02／IDE-03 驗收向量

1. **happy path**：依 `open-file → set-breakpoint → run → inspect → step-over → continue` 完成，最後 `phase = "completed"` 且 output 為 `17`。
2. **錯誤保留狀態**：未知檔案、無效 breakpoint、未 paused 的 step／inspect 不破壞 selected file、breakpoint、call stack 或 variables。
3. **debug state**：run 後必須能看見 current line、call stack 與 variables；step-over 後 `discounted` 才能出現。
4. **reset**：完成或 failed 後 reset，結果與初始 fixture deep-equal。
5. **determinism**：相同初始 state 加相同 event sequence，必須得到相同 phase、line、variables、output 與 completion。

IDE-02 可依本文件撰寫教材與 debug mental model；IDE-03 必須維持上述 state、event、current line、error、reset 與 completion 邊界。真實 editor workspace、process、extension、network、使用者檔案與 secret 不在本 topic Phase 1 範圍內。
