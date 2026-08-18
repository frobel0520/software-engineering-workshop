import type { SimulatorDefinition } from "../types";
import {
  sqlLabHappyPath,
  sqlLabInitialState,
  sqlLessonSteps,
  sqlQueryResults,
  type SqlLabEvent,
  type SqlLabState,
  type SqlStepId,
} from "./content";

export interface SqlEventResult {
  state: SqlLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface SqlRunResult {
  state: SqlLabState;
  results: readonly SqlEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly SqlStepId[] = sqlLabHappyPath.map((event) => event.type as SqlStepId);

function cloneState(state: SqlLabState): SqlLabState {
  return { ...state, completedStepIds: [...state.completedStepIds] };
}

function hasCompleted(state: SqlLabState, stepId: SqlStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: SqlLabState, stepId: SqlStepId): readonly SqlStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function requiredStep(stepId: SqlStepId): SqlStepId | null {
  if (stepId === "select-columns") return "inspect-schema";
  if (stepId === "filter-paid") return "select-columns";
  if (stepId === "group-customers") return "filter-paid";
  if (stepId === "order-total") return "group-customers";
  return null;
}

function queryFor(stepId: SqlStepId): string {
  return sqlLessonSteps.find((step) => step.id === stepId)?.query ?? stepId;
}

function isComplete(state: SqlLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.result?.id === "order-total"
  );
}

function accepted(
  current: SqlLabState,
  stepId: SqlStepId,
  message: string,
  phase: SqlLabState["phase"] = "active",
): SqlEventResult {
  const result = sqlQueryResults[stepId];
  return {
    state: {
      ...current,
      phase,
      selectedStepId: stepId,
      completedStepIds: withStep(current, stepId),
      result,
      lastQuery: queryFor(stepId),
      lastMessage: message,
    },
    output: [queryFor(stepId), `${result.rows.length} rows`, result.caption],
    accepted: true,
  };
}

function blocked(current: SqlLabState, stepId: SqlStepId, message: string): SqlEventResult {
  return {
    state: { ...current, phase: "blocked", selectedStepId: stepId, lastQuery: queryFor(stepId), lastMessage: message },
    output: [message],
    accepted: false,
  };
}

export function createInitialSqlState(): SqlLabState {
  return cloneState(sqlLabInitialState);
}

export function resetSqlLab(): SqlLabState {
  return createInitialSqlState();
}

export function isSqlLabComplete(state: SqlLabState): boolean {
  return isComplete(state);
}

export function runSqlEvent(current: SqlLabState, event: SqlLabEvent): SqlEventResult {
  if (event.type === "reset") {
    return { state: resetSqlLab(), output: ["SQL Lab 已重設，可以重新開始。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "SQL Lab 已完成；如要重練，請先 reset。");
  }

  const required = requiredStep(event.type);
  if (required && !hasCompleted(current, required)) {
    const message =
      event.type === "select-columns"
        ? "請先確認 orders schema，再執行 SELECT。"
        : event.type === "filter-paid"
          ? "請先選出 orders 欄位，確認資料列已進入查詢流程。"
          : event.type === "group-customers"
            ? "請先用 WHERE 篩出 paid orders，再進行 customer 聚合。"
            : "請先 GROUP BY customer 產生 total_spend，再排序聚合結果。";
    return blocked(current, event.type, message);
  }

  if (event.type === "inspect-schema") {
    return accepted(current, event.type, "schema 已確認：customer 是分組欄位，status 是過濾條件，amount 是加總來源。");
  }

  if (event.type === "select-columns") {
    return accepted(current, event.type, "SELECT 已保留每筆 order 的 id、customer、status 與 amount。 ");
  }

  if (event.type === "filter-paid") {
    return accepted(current, event.type, "WHERE status = 'paid' 已排除 pending 與 refunded，剩下 4 筆可統計資料。");
  }

  if (event.type === "group-customers") {
    return accepted(current, event.type, "GROUP BY customer 已將 4 筆 paid orders 聚合成 3 位 customer。 ");
  }

  return accepted(current, event.type, "ORDER BY total_spend DESC 已完成；最高消費 customer 排在第一列。", "completed");
}

export const sqlSimulator: SimulatorDefinition<SqlLabState, SqlLabEvent> = {
  createInitialState: createInitialSqlState,
  reduce: (state, event) => runSqlEvent(state, event).state,
  reset: resetSqlLab,
};

export function runSqlEvents(
  events: readonly SqlLabEvent[],
  initialState: SqlLabState = createInitialSqlState(),
): SqlRunResult {
  let state = cloneState(initialState);
  const results: SqlEventResult[] = [];

  for (const event of events) {
    const result = runSqlEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
