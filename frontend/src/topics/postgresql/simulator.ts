import type { SimulatorDefinition } from "../types";
import {
  postgresqlLabHappyPath,
  postgresqlLabInitialState,
  postgresqlLessonSteps,
  postgresqlPlans,
  postgresqlResults,
  postgresqlSession,
  type PostgreSqlLabEvent,
  type PostgreSqlLabState,
  type PostgreSqlStepId,
} from "./content";

export interface PostgreSqlEventResult {
  state: PostgreSqlLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface PostgreSqlRunResult {
  state: PostgreSqlLabState;
  results: readonly PostgreSqlEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly PostgreSqlStepId[] = postgresqlLabHappyPath
  .map((event) => event.type)
  .filter((event): event is PostgreSqlStepId => event !== "reset");

function cloneState(state: PostgreSqlLabState): PostgreSqlLabState {
  return { ...state, completedStepIds: [...state.completedStepIds] };
}

function hasCompleted(state: PostgreSqlLabState, stepId: PostgreSqlStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: PostgreSqlLabState, stepId: PostgreSqlStepId): readonly PostgreSqlStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function requiredStep(stepId: PostgreSqlStepId): PostgreSqlStepId | null {
  if (stepId === "define-contract") return "inspect-session";
  if (stepId === "insert-returning") return "define-contract";
  if (stepId === "read-jsonb") return "insert-returning";
  if (stepId === "create-jsonb-index") return "read-jsonb";
  if (stepId === "explain-query") return "create-jsonb-index";
  if (stepId === "commit-transaction") return "explain-query";
  return null;
}

function codeFor(stepId: PostgreSqlStepId): string {
  return postgresqlLessonSteps.find((step) => step.id === stepId)?.code ?? stepId;
}

function isComplete(state: PostgreSqlLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.transactionStatus === "committed" &&
    state.result?.id === "commit-transaction"
  );
}

function accepted(
  current: PostgreSqlLabState,
  stepId: PostgreSqlStepId,
  message: string,
  phase: PostgreSqlLabState["phase"] = "active",
): PostgreSqlEventResult {
  const result = postgresqlResults[stepId];
  const plan = stepId === "explain-query" ? postgresqlPlans["after-index"] : current.plan;

  return {
    state: {
      ...current,
      phase,
      selectedStepId: stepId,
      completedStepIds: withStep(current, stepId),
      session: stepId === "inspect-session" ? postgresqlSession : current.session,
      schemaReady: current.schemaReady || stepId === "define-contract",
      returnedId: stepId === "insert-returning" ? 104 : current.returnedId,
      jsonbMatchCount: stepId === "read-jsonb" ? 2 : current.jsonbMatchCount,
      plan,
      indexCreated: current.indexCreated || stepId === "create-jsonb-index",
      transactionStatus: stepId === "commit-transaction" ? "committed" : current.transactionStatus,
      result,
      lastCode: codeFor(stepId),
      lastMessage: message,
    },
    output: [codeFor(stepId), String(result.rows.length) + " rows", result.caption],
    accepted: true,
  };
}

function blocked(current: PostgreSqlLabState, stepId: PostgreSqlStepId, message: string): PostgreSqlEventResult {
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

export function createInitialPostgreSqlState(): PostgreSqlLabState {
  return cloneState(postgresqlLabInitialState);
}

export function resetPostgreSqlLab(): PostgreSqlLabState {
  return createInitialPostgreSqlState();
}

export function isPostgreSqlLabComplete(state: PostgreSqlLabState): boolean {
  return isComplete(state);
}

export function runPostgreSqlEvent(
  current: PostgreSqlLabState,
  event: PostgreSqlLabEvent,
): PostgreSqlEventResult {
  if (event.type === "reset") {
    return {
      state: resetPostgreSqlLab(),
      output: ["PostgreSQL Lab 已重設，可以重新開始。"],
      accepted: true,
    };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "PostgreSQL Lab 已完成；如要重練，請先 reset。");
  }

  const required = requiredStep(event.type);
  if (required && !hasCompleted(current, required)) {
    const messages: Readonly<Record<PostgreSqlStepId, string>> = {
      "inspect-session": "",
      "define-contract": "請先確認 psql session，再建立資料契約。",
      "insert-returning": "請先建立 events schema，RETURNING 才有明確的資料邊界。",
      "read-jsonb": "請先用 INSERT ... RETURNING 建立並取得 event row。",
      "create-jsonb-index": "請先完成 JSONB containment 查詢，再建立 GIN index。",
      "explain-query": "請先建立 JSONB GIN index，再閱讀 PostgreSQL plan。",
      "commit-transaction": "請先讀完 EXPLAIN plan，再提交完整 transaction。",
    };
    return blocked(current, event.type, messages[event.type]);
  }

  if (event.type === "inspect-session") {
    return accepted(current, event.type, "已連線到 workshop：student 使用 PostgreSQL 16.4 操作 events table。");
  }

  if (event.type === "define-contract") {
    return accepted(current, event.type, "events schema 已固定 identity、timestamptz、jsonb 與 NOT NULL 契約。");
  }

  if (event.type === "insert-returning") {
    return accepted(current, event.type, "INSERT 成功，RETURNING 立即取得新 event id 104。");
  }

  if (event.type === "read-jsonb") {
    return accepted(current, event.type, "JSONB @> 找到 2 筆 signup events，->> 取出 kind 文字值。");
  }

  if (event.type === "create-jsonb-index") {
    return accepted(current, event.type, "idx_events_payload_gin 已建立並完成 ANALYZE；可以檢查 planner plan。");
  }

  if (event.type === "explain-query") {
    return accepted(current, event.type, "EXPLAIN 顯示 Bitmap Index Scan；真實 planner 仍要依資料量與成本驗證。");
  }

  return accepted(current, event.type, "events 的新增與更新都完成，COMMIT 讓 transaction 正式可見。", "completed");
}

export const postgresqlSimulator: SimulatorDefinition<PostgreSqlLabState, PostgreSqlLabEvent> = {
  createInitialState: createInitialPostgreSqlState,
  reduce: (state, event) => runPostgreSqlEvent(state, event).state,
  reset: resetPostgreSqlLab,
};

export function runPostgreSqlEvents(
  events: readonly PostgreSqlLabEvent[],
  initialState: PostgreSqlLabState = createInitialPostgreSqlState(),
): PostgreSqlRunResult {
  let state = cloneState(initialState);
  const results: PostgreSqlEventResult[] = [];

  for (const event of events) {
    const result = runPostgreSqlEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
