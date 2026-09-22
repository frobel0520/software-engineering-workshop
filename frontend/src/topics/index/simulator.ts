import type { SimulatorDefinition } from "../types";
import {
  indexLabHappyPath,
  indexLabInitialState,
  indexLessonSteps,
  indexQueryPlans,
  indexResults,
  type IndexLabEvent,
  type IndexLabState,
  type IndexStepId,
} from "./content";

export interface IndexEventResult {
  state: IndexLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface IndexRunResult {
  state: IndexLabState;
  results: readonly IndexEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly IndexStepId[] = indexLabHappyPath
  .map((event) => event.type)
  .filter((event): event is IndexStepId => event !== "reset");

function cloneState(state: IndexLabState): IndexLabState {
  return { ...state, completedStepIds: [...state.completedStepIds] };
}

function hasCompleted(state: IndexLabState, stepId: IndexStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: IndexLabState, stepId: IndexStepId): readonly IndexStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function requiredStep(stepId: IndexStepId): IndexStepId | null {
  if (stepId === "create-index") return "inspect-plan";
  if (stepId === "verify-plan") return "create-index";
  if (stepId === "rollback-batch") return "verify-plan";
  if (stepId === "commit-batch") return "rollback-batch";
  return null;
}

function codeFor(stepId: IndexStepId): string {
  return indexLessonSteps.find((step) => step.id === stepId)?.code ?? stepId;
}

function isComplete(state: IndexLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.transactionStatus === "committed" &&
    state.result?.id === "commit-batch"
  );
}

function accepted(
  current: IndexLabState,
  stepId: IndexStepId,
  message: string,
  phase: IndexLabState["phase"] = "active",
): IndexEventResult {
  const result = indexResults[stepId];
  const plan = stepId === "inspect-plan"
    ? indexQueryPlans["before-index"]
    : stepId === "verify-plan"
      ? indexQueryPlans["after-index"]
      : current.plan;

  return {
    state: {
      ...current,
      phase,
      selectedStepId: stepId,
      completedStepIds: withStep(current, stepId),
      indexCreated: current.indexCreated || stepId === "create-index" || stepId === "verify-plan",
      plan,
      transactionStatus: stepId === "rollback-batch"
        ? "rolled-back"
        : stepId === "commit-batch"
          ? "committed"
          : current.transactionStatus,
      result,
      lastCode: codeFor(stepId),
      lastMessage: message,
    },
    output: [codeFor(stepId), String(result.rows.length) + " rows", result.caption],
    accepted: true,
  };
}

function blocked(current: IndexLabState, stepId: IndexStepId, message: string): IndexEventResult {
  return {
    state: {
      ...current,
      phase: "blocked",
      selectedStepId: stepId,
      lastCode: codeFor(stepId),
      lastMessage: message,
    },
    output: [message],
    accepted: false,
  };
}

export function createInitialIndexState(): IndexLabState {
  return cloneState(indexLabInitialState);
}

export function resetIndexLab(): IndexLabState {
  return createInitialIndexState();
}

export function isIndexLabComplete(state: IndexLabState): boolean {
  return isComplete(state);
}

export function runIndexEvent(current: IndexLabState, event: IndexLabEvent): IndexEventResult {
  if (event.type === "reset") {
    return {
      state: resetIndexLab(),
      output: ["Index + Transaction Lab 已重設，可以重新開始。"],
      accepted: true,
    };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "Index + Transaction Lab 已完成；如要重練，請先 reset。");
  }

  const required = requiredStep(event.type);
  if (required && !hasCompleted(current, required)) {
    const messages: Readonly<Record<IndexStepId, string>> = {
      "inspect-plan": "",
      "create-index": "請先查看原始查詢計畫，再決定要優化哪個欄位。",
      "verify-plan": "請先建立 idx_orders_customer_id，再重新查看查詢計畫。",
      "rollback-batch": "請先確認索引已生效，再進入交易一致性練習。",
      "commit-batch": "請先撤回不完整的轉帳，確認交易邊界後再提交完整寫入。",
    };
    return blocked(current, event.type, messages[event.type]);
  }

  if (event.type === "inspect-plan") {
    return accepted(current, event.type, "目前是 table scan：查詢需要檢查整張 orders table。");
  }

  if (event.type === "create-index") {
    return accepted(current, event.type, "idx_orders_customer_id 已建立，下一步要重新查看相同查詢的 plan。");
  }

  if (event.type === "verify-plan") {
    return accepted(current, event.type, "查詢已改走 index search：從 6 筆 rows 縮小到 2 筆候選資料。");
  }

  if (event.type === "rollback-batch") {
    return accepted(current, event.type, "第二筆更新驗證失敗，ROLLBACK 讓 Ada 與 Lin 回到交易前餘額。");
  }

  return accepted(current, event.type, "兩筆更新都通過驗證，COMMIT 讓轉帳結果正式生效。", "completed");
}

export const indexSimulator: SimulatorDefinition<IndexLabState, IndexLabEvent> = {
  createInitialState: createInitialIndexState,
  reduce: (state, event) => runIndexEvent(state, event).state,
  reset: resetIndexLab,
};

export function runIndexEvents(
  events: readonly IndexLabEvent[],
  initialState: IndexLabState = createInitialIndexState(),
): IndexRunResult {
  let state = cloneState(initialState);
  const results: IndexEventResult[] = [];

  for (const event of events) {
    const result = runIndexEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
