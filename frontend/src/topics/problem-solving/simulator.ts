import {
  problemSolvingLabInitialState,
  problemSolvingLessonSteps,
  problemSolvingResults,
  type ProblemSolvingLabEvent,
  type ProblemSolvingLabResult,
  type ProblemSolvingLabState,
  type ProblemSolvingStepId,
} from "./content";

export interface ProblemSolvingCommandResult {
  state: ProblemSolvingLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface ProblemSolvingRunResult {
  state: ProblemSolvingLabState;
  results: readonly ProblemSolvingCommandResult[];
  accepted: boolean;
}

export function createInitialProblemSolvingState(): ProblemSolvingLabState {
  return {
    ...problemSolvingLabInitialState,
    completedStepIds: [],
    evidence: [],
  };
}

export function resetProblemSolvingLab(): ProblemSolvingLabState {
  return createInitialProblemSolvingState();
}

export function isProblemSolvingLabComplete(state: ProblemSolvingLabState): boolean {
  return (
    state.phase === "completed" &&
    state.completedStepIds.length === problemSolvingLessonSteps.length &&
    state.reproduction === "stable" &&
    state.comparison === "release-regression" &&
    state.hypothesis === "payment-timeout" &&
    state.errorBoundary === "caught-at-boundary" &&
    state.fixApplied &&
    state.verification === "passed" &&
    state.prevention === "written"
  );
}

function nextIncompleteStep(state: ProblemSolvingLabState): ProblemSolvingStepId | undefined {
  return problemSolvingLessonSteps.find((step) => !state.completedStepIds.includes(step.id))?.id;
}

function resultLines(result: ProblemSolvingLabResult): readonly string[] {
  return [
    result.title,
    ...result.observations.map((observation) => `${observation.label}: ${observation.value}`),
  ];
}

function accepted(
  current: ProblemSolvingLabState,
  stepId: ProblemSolvingStepId,
  changes: Partial<ProblemSolvingLabState>,
  message: string,
): ProblemSolvingCommandResult {
  const completedStepIds = [...current.completedStepIds, stepId];
  const nextStepId = problemSolvingLessonSteps.find((step) => !completedStepIds.includes(step.id))?.id ?? stepId;
  const result = problemSolvingResults[stepId];
  const nextPhase = completedStepIds.length === problemSolvingLessonSteps.length ? "completed" : "active";

  return {
    state: {
      ...current,
      ...changes,
      phase: nextPhase,
      selectedStepId: nextStepId,
      completedStepIds,
      lastResult: result,
      lastMessage: message,
    },
    output: [message, ...resultLines(result)],
    accepted: true,
  };
}

function blocked(current: ProblemSolvingLabState, message: string): ProblemSolvingCommandResult {
  return {
    state: { ...current, phase: "blocked", lastMessage: message },
    output: [message],
    accepted: false,
  };
}

export function runProblemSolvingEvent(
  current: ProblemSolvingLabState,
  event: ProblemSolvingLabEvent,
): ProblemSolvingCommandResult {
  if (event.type === "reset") {
    return {
      state: resetProblemSolvingLab(),
      output: ["問題處理 Lab 已重設；從問題陳述開始。"],
      accepted: true,
    };
  }

  if (isProblemSolvingLabComplete(current)) {
    return blocked(current, "Lab 已完成；如要重練，請先 reset。" );
  }

  const expectedStepId = nextIncompleteStep(current);
  if (expectedStepId && event.type !== expectedStepId) {
    const expectedStep = problemSolvingLessonSteps.find((step) => step.id === expectedStepId);
    return blocked(current, `目前先做「${expectedStep?.title ?? expectedStepId}」，再往下一個檢查。`);
  }

  switch (event.type) {
    case "frame-problem":
      return accepted(
        current,
        event.type,
        { problemStatement: "POST /orders 在 release/2026.08.22 後穩定回傳 HTTP 500。" },
        "問題已被寫成可觀察的陳述；現在建立最小重現。",
      );
    case "reproduce":
      return accepted(
        current,
        event.type,
        { reproduction: "stable" },
        "同一組 orders 測試資料連續 3 次得到 500；失敗可以被驗證。",
      );
    case "collect-evidence":
      return accepted(
        current,
        event.type,
        { evidence: ["trace_42", "payment-provider timeout=3000ms", "retry=0"] },
        "已將 request、trace 與付款依賴延遲接成同一條時間線。",
      );
    case "compare-baseline":
      return accepted(
        current,
        event.type,
        { comparison: "release-regression" },
        "最後正常版本是 release/2026.08.21；變化點縮到 payment client timeout path。",
      );
    case "test-hypothesis":
      return accepted(
        current,
        event.type,
        { hypothesis: "payment-timeout" },
        "固定付款依賴延遲後重現同一條 500 path；timeout 假設成立。",
      );
    case "choose-error-boundary":
      return accepted(
        current,
        event.type,
        { errorBoundary: "caught-at-boundary" },
        "API 邊界處理可恢復的 TimeoutError；核心 client 保留原始錯誤，retry 只允許 1 次。",
      );
    case "apply-fix":
      return accepted(
        current,
        event.type,
        { fixApplied: true },
        "已套用 timeout=1500ms、bounded retry=1，並要求 idempotency key。",
      );
    case "verify-fix":
      return accepted(
        current,
        event.type,
        { verification: "passed" },
        "timeout 案例回傳可追蹤的 503；正常付款仍回傳 201，unit + integration 通過。",
      );
    case "prevent-recurrence":
      return accepted(
        current,
        event.type,
        { prevention: "written" },
        "已加入 timeout 告警與 rollback runbook；問題處理閉環完成。",
      );
  }
}

export function runProblemSolvingEvents(
  events: readonly ProblemSolvingLabEvent[],
  initialState: ProblemSolvingLabState = createInitialProblemSolvingState(),
): ProblemSolvingRunResult {
  let state: ProblemSolvingLabState = {
    ...initialState,
    completedStepIds: [...initialState.completedStepIds],
    evidence: [...initialState.evidence],
  };
  const results: ProblemSolvingCommandResult[] = [];

  for (const event of events) {
    const result = runProblemSolvingEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
