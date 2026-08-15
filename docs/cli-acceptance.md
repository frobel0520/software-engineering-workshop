# CLI-01：命令列 acceptance

> 類型：Topic acceptance／fixture contract
> 狀態：可供 CLI-02、CLI-03 開發
> 依賴：M1 module foundation
> 範圍：瀏覽器內 deterministic shell simulator；不執行使用者本機 shell、不讀取真實檔案系統

本文件只鎖定命令列主題的學習目標、Lab pageflow、失敗狀態與 simulator 邊界，不新增 feature-level SA／SD。

## 1. 學習目標

完成主題後，學習者應能：

1. 用 `pwd` 確認目前工作目錄，理解相對路徑必須依賴目前 context。
2. 用 `cd` 在固定工作目錄中移動，知道目錄錯誤不應靜默改變狀態。
3. 用 `ls`、`cat` 與 `grep` 讀取檔案與篩選線索，而不是盲目重跑指令。
4. 理解 stdout、stderr 與 exit code 的差別，能判斷命令是否成功。
5. 用一組可重複的命令完成檢查，並在失敗後 reset 回到相同初始 fixture。

## 2. Pageflow 與 Lab happy path

```text
map → /cli lesson → /cli-lab
  → 確認 cwd
  → 進入 src
  → 列出檔案
  → 搜尋 TODO 線索
  → 執行固定檢查
  → completion treatment → map
```

Lab 從 `/workspace/project` 開始，所有檔案、輸出與 exit code 都由 fixture 決定。學習者不會真的碰到瀏覽器外的 shell 或檔案系統。

概念操作與 simulator event 對應如下：

| 概念操作 | 教學指令／UI 動作 | event |
| --- | --- | --- |
| 確認目前目錄 | `pwd` | `print-working-directory` |
| 進入來源目錄 | `cd src` | `change-directory` |
| 查看目前檔案 | `ls` | `list-files` |
| 搜尋待辦線索 | `grep TODO app.ts` | `search-file` |
| 執行固定檢查 | `npm test` | `run-check` |

## 3. Fixture contract

CLI-03 應以以下固定 fixture 作為初始狀態：

```ts
type CliLabPhase = "initial" | "active" | "failed" | "completed";
type CliStream = "stdout" | "stderr";
type CliStepId = "context" | "navigate" | "inspect" | "search" | "verify";

interface CliFileFixture {
  path: string;
  content: string;
}

interface CliLabState {
  cwd: "/workspace/project" | "/workspace/project/src";
  files: readonly CliFileFixture[];
  commandHistory: readonly string[];
  stdout: readonly string[];
  stderr: readonly string[];
  lastStream: CliStream | null;
  exitCode: number | null;
  phase: CliLabPhase;
  completedStepIds: readonly CliStepId[];
  lastMessage: string;
  canReset: true;
}
```

初始 fixture：

```ts
{
  cwd: "/workspace/project",
  files: [
    { path: "README.md", content: "# CLI fixture" },
    { path: "package.json", content: "{\"scripts\":{\"test\":\"vitest run\"}}" },
    { path: "src/app.ts", content: "export const ready = true; // TODO: add example" },
    { path: ".env.example", content: "API_URL=https://example.invalid" },
  ],
  commandHistory: [],
  stdout: [],
  stderr: [],
  lastStream: null,
  exitCode: null,
  phase: "initial",
  completedStepIds: [],
  lastMessage: "準備從固定的 project fixture 開始。",
  canReset: true,
}
```

## 4. 固定輸出與完成條件

| event | accepted output | exit code | 完成 step |
| --- | --- | --- | --- |
| `print-working-directory` | `/workspace/project` 或目前 cwd | `0` | `context` |
| `change-directory` | `現在位於 /workspace/project/src` | `0` | `navigate` |
| `list-files` | `app.ts` | `0` | `inspect` |
| `search-file` | `app.ts:1: TODO: add example` | `0` | `search` |
| `run-check` | `Tests: 3 passed` | `0` | `verify` |

只有 `completedStepIds` 包含 `context`、`navigate`、`inspect`、`search`、`verify` 時，Lab 才能標記完成。單獨看到 stdout 或 exit code 不能標記 topic 完成。

## 5. 失敗狀態與回饋

| 情境 | 結果 | 必須呈現的概念 |
| --- | --- | --- |
| 未知命令 | `stderr` 顯示 command not found，exit code `127`，cwd 不變 | shell 錯誤不等於整個 session 消失 |
| `cd missing` | `stderr` 顯示 no such directory，exit code `1`，cwd 不變 | 路徑錯誤不可靜默成功 |
| 在 project root 執行 `grep TODO app.ts` | `stderr` 顯示 file not found，exit code `2` | 相對路徑依賴 cwd |
| 在尚未進入 src 前執行 `npm test` | blocked，提示先完成 context／navigate | 可重複流程需要先確認工作位置 |
| 空白輸入 | 不新增 history，保留既有 state | 不把無效輸入誤算成進度 |

每個錯誤至少要說明 stream、exit code、目前 cwd 與下一步提示；不可只用顏色表達結果。

## 6. CLI-02／CLI-03 驗收向量

1. **happy path**：依 `print-working-directory → change-directory → list-files → search-file → run-check` 完成，最後 `phase = "completed"`。
2. **錯誤保留狀態**：未知命令與錯誤路徑不改變 cwd，也不偽造 completed step。
3. **stream／exit code**：成功輸出走 stdout、錯誤走 stderr，且 exit code 固定可測。
4. **reset**：完成或 failed 後 reset，結果與初始 fixture deep-equal。
5. **determinism**：相同初始 state 加相同 event sequence，必須得到相同 state、history 與輸出。

CLI-02 可依本文件的目標與 command mapping 撰寫教材；CLI-03 必須維持上述 state、event、stream、exit code、錯誤與 completion 邊界。真實 OS、shell、使用者檔案、process、network 與 secret 不在本 topic Phase 1 範圍內。
