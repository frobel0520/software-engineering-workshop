import type { LessonDefinition } from "../types";

export type ProblemSolvingStepId =
  | "frame-problem"
  | "reproduce"
  | "collect-evidence"
  | "compare-baseline"
  | "test-hypothesis"
  | "choose-error-boundary"
  | "apply-fix"
  | "verify-fix"
  | "prevent-recurrence";

export interface ProblemSolvingLessonStep {
  id: ProblemSolvingStepId;
  title: string;
  method: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export type ProblemSolvingLabEventType = ProblemSolvingStepId | "reset";

export interface ProblemSolvingLabEvent {
  type: ProblemSolvingLabEventType;
}

export type ProblemSolvingLabPhase = "initial" | "active" | "blocked" | "completed";
export type ProblemSolvingReproduction = "not-run" | "stable";
export type ProblemSolvingComparison = "not-run" | "release-regression";
export type ProblemSolvingErrorBoundary = "undecided" | "caught-at-boundary";
export type ProblemSolvingVerification = "not-run" | "passed";
export type ProblemSolvingPrevention = "not-written" | "written";

export interface ProblemSolvingObservation {
  label: string;
  value: string;
}

export interface ProblemSolvingLabResult {
  id: ProblemSolvingStepId;
  title: string;
  observations: readonly ProblemSolvingObservation[];
  takeaway: string;
}

export interface ProblemSolvingLabState {
  phase: ProblemSolvingLabPhase;
  selectedStepId: ProblemSolvingStepId;
  completedStepIds: readonly ProblemSolvingStepId[];
  problemStatement: string | null;
  reproduction: ProblemSolvingReproduction;
  evidence: readonly string[];
  comparison: ProblemSolvingComparison;
  hypothesis: "unknown" | "payment-timeout";
  errorBoundary: ProblemSolvingErrorBoundary;
  fixApplied: boolean;
  verification: ProblemSolvingVerification;
  prevention: ProblemSolvingPrevention;
  lastResult: ProblemSolvingLabResult | null;
  lastMessage: string;
  canReset: true;
}

export const problemSolvingIncident = {
  title: "POST /orders 回傳 500",
  summary: "release/2026.08.22 上線後，付款依賴逾時讓訂單請求失敗。",
  request: "POST /orders · req_7f3c · trace_42",
  fixture: "orders-api / payment-provider",
} as const;

export const problemSolvingLesson: LessonDefinition = {
  title: "把問題變成一條可驗證的路",
  orientation: {
    what: "問題處理是一套從症狀、證據、假設到驗證的可重複工作流，不是憑直覺猜答案。",
    why: "它把模糊的錯誤拆成可觀察的步驟，降低修錯風險，也讓團隊能重現與分享推理過程。",
    when: "遇到 bug、部署事故、效能退化、資料不一致或任何「看起來不對」但原因未知的情況時使用。",
    how: "先定義影響並重現，再用證據縮小範圍；提出可被推翻的假設，修復後用測試與觀測確認。",
  },
  objectives: [
    "把症狀改寫成包含影響、範圍與重現條件的問題陳述。",
    "使用重現、log、trace、基線比較與最小案例縮小問題範圍。",
    "建立可被驗證的假設，而不是一次修改很多地方後祈禱結果變好。",
    "分辨 return／Result、throw／exception 與 try/catch 應該放在哪個邊界。",
    "用修復驗證、回歸測試與事後預防，讓同一個問題不再原樣回來。",
  ],
  sections: [
    {
      id: "frame",
      title: "先把症狀寫成問題",
      body: "「系統壞了」不是可操作的問題。先記錄誰受到影響、哪個請求失敗、何時開始、是否能重現，讓團隊對同一個現象對焦。",
    },
    {
      id: "reproduce",
      title: "重現優先於修復",
      body: "沒有穩定重現，就無法判斷修改是否真的有效。建立最小重現案例，固定輸入、環境與預期結果，再開始縮小範圍。",
    },
    {
      id: "evidence",
      title: "先收證據，再提出猜測",
      body: "log、stack trace、request id、metrics 與最近變更是線索，不是答案。先保留時間線與可觀察事實，避免把猜測寫成結論。",
    },
    {
      id: "baseline",
      title: "和正常基線做比較",
      body: "比較最後一個正常版本、正常輸入與異常輸入，常比盲目閱讀整個系統更快找到變化點；Git bisect 就是把比較系統化。",
    },
    {
      id: "hypothesis",
      title: "每次只驗證一個假設",
      body: "好假設必須能被實驗推翻，例如「付款依賴 timeout 導致 500」。用最小觀測或測試驗證它，而不是一次改動多個模組。",
    },
    {
      id: "error-boundary",
      title: "在正確邊界處理錯誤",
      body: "可恢復的錯誤在邊界轉成 Result 或友善回應；無法由目前函式決定的錯誤就 throw／raise 給上層。try/catch 只捕捉能處理的例外，並搭配有上限的 retry、timeout 或 fallback。",
    },
    {
      id: "fix",
      title: "先做最小且可回退的修復",
      body: "修復要針對已驗證的根因，並保留 rollback 或 workaround。小變更比較容易 review、比較容易定位副作用，也比較容易在失敗時撤回。",
    },
    {
      id: "verify",
      title: "驗證結果，不只看錯誤消失",
      body: "重新執行原始重現案例，再跑相關的單元、整合與回歸測試；同時檢查成功率、延遲與錯誤率，避免只把問題藏到另一條路徑。",
    },
    {
      id: "prevent",
      title: "把學到的線索變成防線",
      body: "記錄根因、觸發條件、修復與監測訊號，補上測試、告警、runbook 或 deploy guard。問題處理的終點是降低下一次發生時的成本。",
    },
  ],
};

export const problemSolvingLessonSteps: readonly ProblemSolvingLessonStep[] = [
  {
    id: "frame-problem",
    title: "寫出問題陳述",
    method: "定義問題 · 影響／範圍／時間線",
    code: "POST /orders → 500 · started after release/2026.08.22",
    explanation: "先把模糊的事故改寫成可觀察的請求、版本與開始時間。",
    takeaway: "問題要先能被團隊用同一句話描述，才有共同的起點。",
  },
  {
    id: "reproduce",
    title: "建立穩定重現",
    method: "重現問題 · 最小案例",
    code: "curl -i -X POST /orders -d '{...}' # 3 / 3 → 500",
    explanation: "固定輸入與環境，確認相同操作連續得到相同結果。",
    takeaway: "可重現的失敗，才是可以被驗證的工程問題。",
  },
  {
    id: "collect-evidence",
    title: "收集可追蹤證據",
    method: "蒐證 · log／trace／metrics",
    code: "trace=42 · payment timeout=3000ms · retry=0",
    explanation: "用 request id、trace、時間線與指標把錯誤連到實際執行路徑。",
    takeaway: "證據描述發生了什麼；它不應被過早寫成根因。",
  },
  {
    id: "compare-baseline",
    title: "比較最後正常基線",
    method: "隔離變化 · baseline／git bisect",
    code: "good: release/2026.08.21 · bad: release/2026.08.22",
    explanation: "比較最後正常版本與異常版本，將搜尋範圍縮到付款 client 的 timeout 變更。",
    takeaway: "先找變化點，再決定要讀哪一段程式。",
  },
  {
    id: "test-hypothesis",
    title: "驗證一個可推翻假設",
    method: "假設驅動除錯 · 實驗",
    code: "hypothesis: payment provider timeout causes 500",
    explanation: "用測試資料將付款依賴延遲固定在 3000ms，確認 500 只在 timeout path 出現。",
    takeaway: "一次只驗證一個假設，才能知道哪個改變帶來結果。",
  },
  {
    id: "choose-error-boundary",
    title: "選擇錯誤處理邊界",
    method: "Result／exception · try/catch · bounded retry",
    code: "catch TimeoutError at API boundary → 503 + bounded retry",
    explanation: "核心 client 不吞掉錯誤；API 邊界捕捉可恢復的 timeout，回傳可理解的 503 並限制重試。",
    takeaway: "catch 不是消除錯誤，而是把能處理的錯誤轉成正確的邊界行為。",
  },
  {
    id: "apply-fix",
    title: "套用最小修復",
    method: "最小變更 · rollback／workaround",
    code: "timeout=1500ms · retry=1 · idempotency-key required",
    explanation: "只修改已驗證的 timeout path，保留 bounded retry 與冪等條件，避免重試造成重複扣款。",
    takeaway: "最小修復讓因果、review 與回退都保持清楚。",
  },
  {
    id: "verify-fix",
    title: "重現並跑回歸",
    method: "驗證 · unit／integration／regression",
    code: "incident case → 503 · healthy provider → 201 · tests pass",
    explanation: "重新執行原始事故案例，再確認正常付款仍可建立訂單，並保留測試防止回歸。",
    takeaway: "錯誤消失只是起點；正常路徑與失敗路徑都要驗證。",
  },
  {
    id: "prevent-recurrence",
    title: "留下預防措施",
    method: "postmortem · observability · runbook",
    code: "alert: payment timeout rate > 2% for 5m",
    explanation: "把根因、訊號、處置與告警條件寫進 runbook，讓下次能更早發現、更快恢復。",
    takeaway: "真正的完成，是下一次處理成本下降。",
  },
] as const;

export const problemSolvingLabHappyPath: readonly ProblemSolvingLabEvent[] = problemSolvingLessonSteps.map((step) => ({ type: step.id }));

export const problemSolvingLabInitialState: ProblemSolvingLabState = {
  phase: "initial",
  selectedStepId: "frame-problem",
  completedStepIds: [],
  problemStatement: null,
  reproduction: "not-run",
  evidence: [],
  comparison: "not-run",
  hypothesis: "unknown",
  errorBoundary: "undecided",
  fixApplied: false,
  verification: "not-run",
  prevention: "not-written",
  lastResult: null,
  lastMessage: "先定義問題，再沿著證據與假設往根因走。",
  canReset: true,
};

export const problemSolvingResults: Readonly<Record<ProblemSolvingStepId, ProblemSolvingLabResult>> = {
  "frame-problem": {
    id: "frame-problem",
    title: "問題陳述已固定",
    observations: [
      { label: "IMPACT", value: "新版本後的付款訂單請求失敗" },
      { label: "SCOPE", value: "POST /orders · 500" },
      { label: "STARTED", value: "release/2026.08.22" },
    ],
    takeaway: "先固定問題邊界，團隊才不會各自修不同的症狀。",
  },
  reproduce: {
    id: "reproduce",
    title: "失敗已穩定重現",
    observations: [
      { label: "RUNS", value: "3 / 3" },
      { label: "INPUT", value: "same order case" },
      { label: "OUTPUT", value: "HTTP 500" },
    ],
    takeaway: "固定重現路徑後，任何修復都能被同一個案例驗證。",
  },
  "collect-evidence": {
    id: "collect-evidence",
    title: "證據已連成時間線",
    observations: [
      { label: "TRACE", value: "trace_42" },
      { label: "DEPENDENCY", value: "payment-provider" },
      { label: "TIMEOUT", value: "3000ms" },
    ],
    takeaway: "trace 讓失敗請求與外部依賴的延遲對得上。",
  },
  "compare-baseline": {
    id: "compare-baseline",
    title: "變化點已縮小",
    observations: [
      { label: "GOOD", value: "release/2026.08.21" },
      { label: "BAD", value: "release/2026.08.22" },
      { label: "CHANGE", value: "payment client timeout path" },
    ],
    takeaway: "比較正常與異常版本，讓搜尋從整個系統縮到一條路徑。",
  },
  "test-hypothesis": {
    id: "test-hypothesis",
    title: "假設通過最小實驗",
    observations: [
      { label: "HYPOTHESIS", value: "payment provider timeout" },
      { label: "TEST DELAY", value: "3000ms" },
      { label: "RESULT", value: "timeout path reproduced" },
    ],
    takeaway: "假設不是結論；它要靠可重複的實驗支持或被推翻。",
  },
  "choose-error-boundary": {
    id: "choose-error-boundary",
    title: "錯誤邊界已決定",
    observations: [
      { label: "CORE", value: "preserve TimeoutError" },
      { label: "BOUNDARY", value: "API catches recoverable timeout" },
      { label: "RETRY", value: "1 bounded attempt" },
    ],
    takeaway: "只在有能力處理的邊界 catch；其餘錯誤要保留上下文往上傳。",
  },
  "apply-fix": {
    id: "apply-fix",
    title: "最小修復已套用",
    observations: [
      { label: "TIMEOUT", value: "1500ms" },
      { label: "RETRY", value: "1 attempt" },
      { label: "SAFETY", value: "idempotency key required" },
    ],
    takeaway: "修復同時要處理失敗與副作用，不能只把錯誤訊息壓掉。",
  },
  "verify-fix": {
    id: "verify-fix",
    title: "修復通過回歸檢查",
    observations: [
      { label: "TIMEOUT CASE", value: "503 with trace" },
      { label: "HEALTHY CASE", value: "201 created" },
      { label: "TESTS", value: "unit + integration pass" },
    ],
    takeaway: "失敗路徑要可理解，正常路徑也不能被修復破壞。",
  },
  "prevent-recurrence": {
    id: "prevent-recurrence",
    title: "預防措施已留下",
    observations: [
      { label: "ALERT", value: "timeout rate > 2% for 5m" },
      { label: "RUNBOOK", value: "rollback + provider check" },
      { label: "OWNER", value: "orders on-call" },
    ],
    takeaway: "把線索變成告警、runbook 與測試，下一次才能更快處理。",
  },
};

export interface ProblemSolvingFailureFixture {
  event: ProblemSolvingStepId;
  message: string;
}

export const problemSolvingFailureFixtures: readonly ProblemSolvingFailureFixture[] = [
  { event: "reproduce", message: "請先寫出問題陳述，否則還不知道要重現哪個症狀。" },
  { event: "collect-evidence", message: "請先穩定重現，再收集能對應到同一條請求的證據。" },
  { event: "apply-fix", message: "請先選定錯誤邊界，確認哪些錯誤能處理、哪些要往上傳。" },
] as const;
