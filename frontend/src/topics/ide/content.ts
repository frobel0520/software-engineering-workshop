import type { LessonDefinition } from "../../topics/types";

export const ideLesson: LessonDefinition = {
  title: "用除錯器看見程式正在做什麼",
  objectives: [
    "在固定 editor fixture 中開啟檔案並設定 breakpoint。",
    "從 paused state 閱讀 current line、call stack 與 variables。",
    "用 step over 與 continue 控制執行，區分暫停、完成與非法操作。",
  ],
  sections: [
    {
      id: "editor-context",
      title: "先確認你正在看哪個檔案",
      body: "Editor 顯示檔案內容；debugger 顯示程式執行位置。開啟 src/order.ts 後，才有明確的程式 context 可以設定 breakpoint。",
    },
    {
      id: "breakpoint-condition",
      title: "Breakpoint 是暫停條件",
      body: "在第 3 行設定 breakpoint，讓 calculateTotal 在 discounted 計算前暫停。Breakpoint 不會替你修正程式，也不代表程式已經失敗。",
    },
    {
      id: "paused-state",
      title: "Paused state 提供三種線索",
      body: "程式暫停時，同時讀 current line、call stack 與 variables。這些線索能說明程式走到哪裡，以及每個輸入目前的值。",
    },
    {
      id: "controlled-execution",
      title: "一步一步縮小問題",
      body: "inspect 先記錄目前 frame；step over 執行下一行但不進入其他函式；continue 則讓程式跑到下一個 breakpoint 或結束。",
    },
  ],
};

export type IdeLabPhase = "initial" | "active" | "paused" | "failed" | "completed";
export type IdeStepId = "open" | "breakpoint" | "run" | "inspect" | "step" | "continue";
export type IdeLabEventType = "open-file" | "set-breakpoint" | "run" | "inspect" | "step-over" | "continue";

export interface IdeFileFixture {
  path: "src/order.ts";
  content: string;
  language: "typescript";
}

export interface IdeLabState {
  phase: IdeLabPhase;
  selectedFile: string | null;
  breakpointLines: readonly number[];
  currentLine: number | null;
  callStack: readonly string[];
  variables: Readonly<Record<string, string>>;
  output: readonly string[];
  completedStepIds: readonly IdeStepId[];
  lastMessage: string;
  canReset: true;
}

export interface IdeLessonStep {
  id: IdeStepId;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const ideLessonSteps: readonly IdeLessonStep[] = [
  {
    id: "open",
    title: "開啟固定檔案",
    command: "open src/order.ts",
    explanation: "先把 editor context 固定在 order.ts，後續 breakpoint 與執行位置都以這個檔案為準。",
    takeaway: "先確認正在看的檔案，再解讀執行狀態。",
  },
  {
    id: "breakpoint",
    title: "在第 3 行暫停",
    command: "breakpoint 3",
    explanation: "第 3 行會計算 discounted，設定 breakpoint 後，程式會在這個計算前停下來。",
    takeaway: "Breakpoint 是觀察點，不是修正動作。",
  },
  {
    id: "run",
    title: "啟動固定函式",
    command: "run calculateTotal(10, 2, 3)",
    explanation: "固定參數讓每次執行都可重現；有 breakpoint 時，執行會進入 paused state。",
    takeaway: "先讓問題穩定重現，才有可靠線索。",
  },
  {
    id: "inspect",
    title: "讀取目前 frame",
    command: "inspect variables",
    explanation: "查看 price、quantity、discount 與 subtotal，確認 debugger 顯示的是目前 frame 的值。",
    takeaway: "變數值比猜測更接近原因。",
  },
  {
    id: "step",
    title: "執行下一行",
    command: "step over",
    explanation: "step over 執行第 3 行但不離開目前函式；current line 會移到 return，並新增 discounted。",
    takeaway: "一次只前進一行，觀察哪個值發生變化。",
  },
  {
    id: "continue",
    title: "繼續到程式結束",
    command: "continue",
    explanation: "沒有下一個 breakpoint 時，continue 會完成固定函式並輸出 17。",
    takeaway: "完成輸出是流程終點，不代表跳過中間證據。",
  },
] as const;

export const ideFileFixture: IdeFileFixture = {
  path: "src/order.ts",
  language: "typescript",
  content: [
    "export function calculateTotal(price: number, quantity: number, discount: number) {",
    "  const subtotal = price * quantity;",
    "  const discounted = subtotal - discount;",
    "  return discounted;",
    "}",
  ].join("\n"),
};

export const ideInitialState: IdeLabState = {
  phase: "initial",
  selectedFile: null,
  breakpointLines: [],
  currentLine: null,
  callStack: [],
  variables: {},
  output: [],
  completedStepIds: [],
  lastMessage: "準備從固定的 order.ts fixture 開始。",
  canReset: true,
};

export const idePausedVariables = {
  price: "10",
  quantity: "2",
  discount: "3",
  subtotal: "20",
} as const;

export const ideCompletedVariables = {
  ...idePausedVariables,
  discounted: "17",
} as const;

export interface IdeCommandFixture {
  stepId: IdeStepId;
  eventType: IdeLabEventType;
  command: string;
  expectedPhase: IdeLabPhase;
  expectedLine: number | null;
}

export const ideCommandFixtures: readonly IdeCommandFixture[] = [
  { stepId: "open", eventType: "open-file", command: "open src/order.ts", expectedPhase: "active", expectedLine: null },
  { stepId: "breakpoint", eventType: "set-breakpoint", command: "breakpoint 3", expectedPhase: "active", expectedLine: null },
  { stepId: "run", eventType: "run", command: "run calculateTotal(10, 2, 3)", expectedPhase: "paused", expectedLine: 3 },
  { stepId: "inspect", eventType: "inspect", command: "inspect variables", expectedPhase: "paused", expectedLine: 3 },
  { stepId: "step", eventType: "step-over", command: "step over", expectedPhase: "paused", expectedLine: 4 },
  { stepId: "continue", eventType: "continue", command: "continue", expectedPhase: "completed", expectedLine: null },
] as const;

