import type { SimulatorDefinition } from "../types";
import {
  schemaLabHappyPath,
  schemaLabInitialState,
  schemaLessonSteps,
  schemaResults,
  type SchemaLabEvent,
  type SchemaLabState,
  type SchemaStepId,
} from "./content";

export interface SchemaEventResult {
  state: SchemaLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface SchemaRunResult {
  state: SchemaLabState;
  results: readonly SchemaEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly SchemaStepId[] = schemaLabHappyPath
  .map((event) => event.type)
  .filter((event): event is SchemaStepId => event !== "reset");

function cloneState(state: SchemaLabState): SchemaLabState {
  return { ...state, completedStepIds: [...state.completedStepIds] };
}

function hasCompleted(state: SchemaLabState, stepId: SchemaStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: SchemaLabState, stepId: SchemaStepId): readonly SchemaStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function requiredStep(stepId: SchemaStepId): SchemaStepId | null {
  if (stepId === "define-keys") return "identify-entities";
  if (stepId === "link-project-task") return "define-keys";
  if (stepId === "mark-nullable") return "link-project-task";
  if (stepId === "validate-integrity") return "mark-nullable";
  return null;
}

function codeFor(stepId: SchemaStepId): string {
  return schemaLessonSteps.find((step) => step.id === stepId)?.code ?? stepId;
}

function isComplete(state: SchemaLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.result?.id === "validate-integrity"
  );
}

function accepted(
  current: SchemaLabState,
  stepId: SchemaStepId,
  message: string,
  phase: SchemaLabState["phase"] = "active",
): SchemaEventResult {
  const result = schemaResults[stepId];
  return {
    state: {
      ...current,
      phase,
      selectedStepId: stepId,
      completedStepIds: withStep(current, stepId),
      result,
      lastCode: codeFor(stepId),
      lastMessage: message,
    },
    output: [codeFor(stepId), `${result.rows.length} checks`, result.caption],
    accepted: true,
  };
}

function blocked(current: SchemaLabState, stepId: SchemaStepId, message: string): SchemaEventResult {
  return {
    state: { ...current, phase: "blocked", selectedStepId: stepId, lastCode: codeFor(stepId), lastMessage: message },
    output: [message],
    accepted: false,
  };
}

export function createInitialSchemaState(): SchemaLabState {
  return cloneState(schemaLabInitialState);
}

export function resetSchemaLab(): SchemaLabState {
  return createInitialSchemaState();
}

export function isSchemaLabComplete(state: SchemaLabState): boolean {
  return isComplete(state);
}

export function runSchemaEvent(current: SchemaLabState, event: SchemaLabEvent): SchemaEventResult {
  if (event.type === "reset") {
    return { state: resetSchemaLab(), output: ["SCHEMA Lab 已重設，可以重新建立資料模型。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "SCHEMA Lab 已完成；如要重練，請先 reset。");
  }

  const required = requiredStep(event.type);
  if (required && !hasCompleted(current, required)) {
    const message =
      event.type === "define-keys"
        ? "請先拆出 projects 與 tasks，再為每張表設定 key。"
        : event.type === "link-project-task"
          ? "請先為兩張表建立 primary key，foreign key 才有可指向的目標。"
          : event.type === "mark-nullable"
            ? "請先連接 project 與 task，再決定哪些欄位可以是 NULL。"
            : "請先標記 required 與 nullable，再檢查 fixture 的完整性。";
    return blocked(current, event.type, message);
  }

  if (event.type === "identify-entities") {
    return accepted(current, event.type, "實體邊界已建立：projects 與 tasks 各自保存一種可辨識的東西。");
  }

  if (event.type === "define-keys") {
    return accepted(current, event.type, "兩張表都有穩定 primary key，其他資料可以安全地指向 row。");
  }

  if (event.type === "link-project-task") {
    return accepted(current, event.type, "tasks.project_id 已連到 projects.id，建立 many-to-one 關係。");
  }

  if (event.type === "mark-nullable") {
    return accepted(current, event.type, "required 與 nullable 已分開：必要資料不能空，未知資料保留 NULL。");
  }

  return accepted(current, event.type, "完整性檢查通過：沒有 duplicate key、orphan task 或缺少 required 欄位。", "completed");
}

export const schemaSimulator: SimulatorDefinition<SchemaLabState, SchemaLabEvent> = {
  createInitialState: createInitialSchemaState,
  reduce: (state, event) => runSchemaEvent(state, event).state,
  reset: resetSchemaLab,
};

export function runSchemaEvents(
  events: readonly SchemaLabEvent[],
  initialState: SchemaLabState = createInitialSchemaState(),
): SchemaRunResult {
  let state = cloneState(initialState);
  const results: SchemaEventResult[] = [];

  for (const event of events) {
    const result = runSchemaEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
