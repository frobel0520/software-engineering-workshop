import type { LessonDefinition } from "../../topics/types";

export const cliLesson: LessonDefinition = {
  title: "在工作目錄中讀懂命令列",
  orientation: {
    what: "命令列是用文字指令與作業系統或工具互動的介面；每個指令都會在目前工作目錄中讀取輸入並產生結果。",
    why: "它適合把檢查、建置與部署寫成可重複、可自動化、可被 CI 執行的流程，而不是依賴手動點擊。",
    when: "需要快速處理檔案、搜尋線索、執行專案 script、檢查 exit code，或在本機重現 CI 步驟時使用。",
    how: "先用 pwd 確認 context，再用 cd、ls、cat、grep 讀取檔案，觀察 stdout／stderr 與 exit code，最後重複驗證流程。",
  },
  objectives: [
    "用 pwd 與 cd 建立目前工作目錄的 context。",
    "用 ls、cat 與 grep 讀取檔案並找出線索。",
    "區分 stdout、stderr 與 exit code，並用可重複流程完成檢查。",
  ],
  sections: [
    {
      id: "working-directory",
      title: "命令列先回答你在哪裡",
      body: "pwd 顯示目前工作目錄；相對路徑會以這個 context 為起點。執行其他指令前，先確認自己位於預期的位置。",
    },
    {
      id: "inspect-files",
      title: "先列出檔案，再讀取內容",
      body: "cd 只改變目前目錄，ls 顯示該目錄的檔案。找到目標檔案後，再用 cat 或 grep 讀取內容與搜尋線索。",
    },
    {
      id: "read-results",
      title: "輸出不只是一段文字",
      body: "成功結果寫到 stdout；錯誤寫到 stderr。exit code 讓腳本能用固定規則判斷成功或失敗，而不是只看畫面顏色。",
    },
    {
      id: "repeatable-check",
      title: "把檢查做成可重複流程",
      body: "固定檔案與命令順序能讓結果可重現。若走錯路徑或流程失敗，先讀懂回饋，再 reset 回到相同起點。",
    },
  ],
};

export interface CliLessonStep {
  id: CliStepId;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const cliLessonSteps: readonly CliLessonStep[] = [
  {
    id: "context",
    title: "確認目前工作目錄",
    command: "pwd",
    explanation: "先確認命令列目前位於 project 目錄，避免用錯相對路徑。",
    takeaway: "先確認 context，再解讀其他命令的結果。",
  },
  {
    id: "navigate",
    title: "進入來源目錄",
    command: "cd src",
    explanation: "cd 只改變目前工作目錄；成功後，後續相對路徑會從 src 開始計算。",
    takeaway: "目錄狀態會影響同一個檔名是否找得到。",
  },
  {
    id: "inspect",
    title: "列出目前檔案",
    command: "ls",
    explanation: "用 ls 確認來源目錄實際有哪些檔案，再決定要讀取或搜尋哪一個。",
    takeaway: "先觀察檔案結構，不要猜路徑。",
  },
  {
    id: "search",
    title: "搜尋 TODO 線索",
    command: "grep TODO app.ts",
    explanation: "grep 只搜尋指定檔案；相對路徑是否成立，取決於目前的 cwd。",
    takeaway: "搜尋結果要連同路徑與行號一起解讀。",
  },
  {
    id: "verify",
    title: "執行固定檢查",
    command: "npm test",
    explanation: "在正確的來源目錄執行檢查，成功時會回報 stdout 與 exit code 0。",
    takeaway: "可重複的檢查流程比一次性的手動觀察可靠。",
  },
] as const;

export type CliLabPhase = "initial" | "active" | "failed" | "completed";
export type CliStream = "stdout" | "stderr";
export type CliStepId = "context" | "navigate" | "inspect" | "search" | "verify";
export type CliCommandEventType =
  | "print-working-directory"
  | "change-directory"
  | "list-files"
  | "search-file"
  | "run-check";

export interface CliFileFixture {
  path: string;
  content: string;
}

export interface CliLabState {
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

export interface CliCommandFixture {
  stepId: CliStepId;
  eventType: CliCommandEventType;
  command: string;
  stdout: string;
  exitCode: 0;
}

export const cliCommandFixtures: readonly CliCommandFixture[] = [
  {
    stepId: "context",
    eventType: "print-working-directory",
    command: "pwd",
    stdout: "/workspace/project",
    exitCode: 0,
  },
  {
    stepId: "navigate",
    eventType: "change-directory",
    command: "cd src",
    stdout: "現在位於 /workspace/project/src",
    exitCode: 0,
  },
  {
    stepId: "inspect",
    eventType: "list-files",
    command: "ls",
    stdout: "app.ts",
    exitCode: 0,
  },
  {
    stepId: "search",
    eventType: "search-file",
    command: "grep TODO app.ts",
    stdout: "app.ts:1: TODO: add example",
    exitCode: 0,
  },
  {
    stepId: "verify",
    eventType: "run-check",
    command: "npm test",
    stdout: "Tests: 3 passed",
    exitCode: 0,
  },
] as const;

export interface CliFailureFixture {
  command: string;
  stderr: string;
  exitCode: number;
  expectedCwd: CliLabState["cwd"];
  message: string;
}

export const cliFailureFixtures: readonly CliFailureFixture[] = [
  {
    command: "unknown",
    stderr: "unknown: command not found",
    exitCode: 127,
    expectedCwd: "/workspace/project",
    message: "命令不存在；請確認拼字或回到教材中的固定指令。",
  },
  {
    command: "cd missing",
    stderr: "cd: missing: no such directory",
    exitCode: 1,
    expectedCwd: "/workspace/project",
    message: "目錄不存在；錯誤路徑不會改變目前 cwd。",
  },
  {
    command: "grep TODO app.ts",
    stderr: "grep: app.ts: file not found",
    exitCode: 2,
    expectedCwd: "/workspace/project",
    message: "相對路徑從 project root 計算；先進入 src 再搜尋 app.ts。",
  },
  {
    command: "npm test",
    stderr: "npm test: blocked until the source directory is selected",
    exitCode: 1,
    expectedCwd: "/workspace/project",
    message: "先完成 pwd 與 cd src，再執行固定檢查。",
  },
] as const;

export const cliLabInitialState: CliLabState = {
  cwd: "/workspace/project",
  files: [
    { path: "README.md", content: "# CLI project" },
    { path: "package.json", content: '{"scripts":{"test":"vitest run"}}' },
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
  lastMessage: "先確認目前工作目錄。",
  canReset: true,
};

