import type { LessonDefinition } from "../../topics/types";

export const guardrailLesson: LessonDefinition = {
  title: "在模型邊界放一道可解釋的防線",
  objectives: [
    "分辨 Validator、Guard、Hub 與 OnFailAction 的責任。",
    "理解 input、output、tool 三個 guardrail 掛載點。",
    "用固定規則與測試案例設計最小 guardrail pipeline。",
    "比較 exception、fix、reask、pass 的 UX 與安全取捨。",
  ],
  sections: [
    {
      id: "responsibilities",
      title: "先分清楚每一層的責任",
      body: "Validator 判斷一個具體風險；Guard 組合規則並決定何時執行；Hub 統一管理多個 Guard；OnFailAction 定義失敗後要阻擋、修正、重問或放行。",
    },
    {
      id: "mounting-points",
      title: "三個掛載點各自守住不同風險",
      body: "Input 檢查使用者請求，避免 prompt injection 或敏感資料進入模型；Output 檢查模型結果，處理 moderation、off-topic 與 structured output；Tool 檢查外部副作用，避免未授權的刪除或寫入。",
    },
    {
      id: "failure-actions",
      title: "失敗策略是產品決策",
      body: "exception 讓系統明確中止；fix 對內容做可追蹤的修正；reask 要求模型重新產生；pass 表示目前檢查沒有阻擋理由。策略必須回饋原因，不應只顯示一個紅色狀態。",
    },
    {
      id: "latency-defense",
      title: "安全性、延遲與縱深防禦要一起看",
      body: "每個 validator 都有成本。串行檢查易於追蹤但會累加 latency；平行檢查可降低等待但要處理結果彙整。高風險工具操作通常值得多一道檢查，不能只追求最快。",
    },
  ],
};

export type GuardrailStage = "input" | "output" | "tool";
export type ValidatorId =
  | "prompt-injection"
  | "pii-secret"
  | "moderation"
  | "off-topic"
  | "structured-output"
  | "tool-side-effect";
export type GuardrailFailureAction = "exception" | "fix" | "reask" | "pass";
export type GuardrailOutcome = "pass" | "fixed" | "reask" | "blocked";

export interface ValidatorFixture {
  id: ValidatorId;
  label: string;
  stage: GuardrailStage;
  purpose: string;
  latencyMs: number;
}

export const guardrailValidators: readonly ValidatorFixture[] = [
  {
    id: "prompt-injection",
    label: "Prompt injection",
    stage: "input",
    purpose: "辨識試圖改寫系統規則或繞過限制的輸入。",
    latencyMs: 12,
  },
  {
    id: "pii-secret",
    label: "PII／Secret",
    stage: "input",
    purpose: "辨識個資、token 與其他不應進入模型上下文的敏感資料。",
    latencyMs: 14,
  },
  {
    id: "moderation",
    label: "Moderation",
    stage: "output",
    purpose: "檢查輸出是否包含需要攔截或人工處理的內容。",
    latencyMs: 18,
  },
  {
    id: "off-topic",
    label: "Off-topic",
    stage: "output",
    purpose: "確認輸出仍然回答允許的任務範圍。",
    latencyMs: 10,
  },
  {
    id: "structured-output",
    label: "Structured output",
    stage: "output",
    purpose: "確認 JSON 或其他結構化結果符合必要欄位與型別。",
    latencyMs: 9,
  },
  {
    id: "tool-side-effect",
    label: "Tool side effect",
    stage: "tool",
    purpose: "在外部寫入、刪除或其他不可逆副作用前再次確認授權與參數。",
    latencyMs: 22,
  },
] as const;

export const guardrailOutcomePriority: readonly GuardrailFailureAction[] = [
  "exception",
  "reask",
  "fix",
  "pass",
];

export interface GuardrailScenarioFixture {
  id: "safe-input" | "pii-fix" | "ambiguous-output" | "tool-side-effect";
  title: string;
  stage: GuardrailStage;
  input: string;
  enabledValidators: readonly ValidatorId[];
  expectedValidator: ValidatorId | null;
  expectedAction: GuardrailFailureAction;
  expectedOutcome: GuardrailOutcome;
  latencyMs: number;
  learnerTakeaway: string;
}

export const guardrailScenarios: readonly GuardrailScenarioFixture[] = [
  {
    id: "safe-input",
    title: "安全的工作清單請求",
    stage: "input",
    input: "請整理今天的工作清單。",
    enabledValidators: ["prompt-injection", "pii-secret"],
    expectedValidator: null,
    expectedAction: "pass",
    expectedOutcome: "pass",
    latencyMs: 26,
    learnerTakeaway: "沒有觸發風險時，pipeline 應以可預測成本放行。",
  },
  {
    id: "pii-fix",
    title: "移除輸入中的示範 secret",
    stage: "input",
    input: "請把這段設定整理好：[demo-secret]。",
    enabledValidators: ["pii-secret"],
    expectedValidator: "pii-secret",
    expectedAction: "fix",
    expectedOutcome: "fixed",
    latencyMs: 14,
    learnerTakeaway: "可安全修正的風險要說明修正內容，而不是假裝沒有發生。",
  },
  {
    id: "ambiguous-output",
    title: "重新要求範圍內的回答",
    stage: "output",
    input: "模型輸出一段與目前課程無關的答案。",
    enabledValidators: ["off-topic", "structured-output"],
    expectedValidator: "off-topic",
    expectedAction: "reask",
    expectedOutcome: "reask",
    latencyMs: 19,
    learnerTakeaway: "可重新產生的問題要留下 reask 原因，不把錯誤靜默吞掉。",
  },
  {
    id: "tool-side-effect",
    title: "攔截未確認的工具副作用",
    stage: "tool",
    input: "執行 delete_account()。",
    enabledValidators: ["tool-side-effect"],
    expectedValidator: "tool-side-effect",
    expectedAction: "exception",
    expectedOutcome: "blocked",
    latencyMs: 22,
    learnerTakeaway: "不可逆的工具操作應在副作用發生前中止並要求明確處理。",
  },
] as const;

export const guardrailRequiredScenarioIds: readonly GuardrailScenarioFixture["id"][] = [
  "safe-input",
  "pii-fix",
  "tool-side-effect",
];
