import type { SimulatorDefinition } from "../types";
import {
  unitLabHappyPath,
  unitLabInitialState,
  unitLessonSteps,
  unitResults,
  unitTestCases,
  type UnitLabEvent,
  type UnitLabState,
  type UnitStepId,
} from "./content";

export interface UnitEventResult {
  state: UnitLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface UnitRunResult {
  state: UnitLabState;
  results: readonly UnitEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly UnitStepId[] = unitLabHappyPath
  .map((event) => event.type)
  .filter((event): event is UnitStepId => event !== "reset");

function cloneState(state: UnitLabState): UnitLabState {
  return { ...state, completedStepIds: [...state.completedStepIds] };
}

function hasCompleted(state: UnitLabState, stepId: UnitStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: UnitLabState, stepId: UnitStepId): readonly UnitStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function requiredStep(stepId: UnitStepId): UnitStepId | null {
  if (stepId === "arrange-fixture") return "identify-boundary";
  if (stepId === "run-red") return "arrange-fixture";
  if (stepId === "fix-green") return "run-red";
  if (stepId === "cover-edge") return "fix-green";
  if (stepId === "run-regression") return "cover-edge";
  return null;
}

function codeFor(stepId: UnitStepId): string {
  return unitLessonSteps.find((step) => step.id === stepId)?.code ?? stepId;
}

function isComplete(state: UnitLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.boundary === "pure-function" &&
    state.implementationStatus === "fixed" &&
    state.suiteStatus === "green" &&
    state.passedTests === state.totalTests &&
    state.result?.id === "run-regression"
  );
}

function accepted(
  current: UnitLabState,
  stepId: UnitStepId,
  message: string,
  phase: UnitLabState["phase"] = "active",
): UnitEventResult {
  const result = unitResults[stepId];
  const passedTests = stepId === "fix-green" ? 1 : stepId === "cover-edge" || stepId === "run-regression" ? unitTestCases.length : current.passedTests;
  const suiteStatus = stepId === "run-red" ? "red" : stepId === "fix-green" || stepId === "cover-edge" || stepId === "run-regression" ? "green" : current.suiteStatus;

  return {
    state: {
      ...current,
      phase,
      selectedStepId: stepId,
      completedStepIds: withStep(current, stepId),
      boundary: stepId === "identify-boundary" ? "pure-function" : current.boundary,
      suiteStatus,
      implementationStatus: stepId === "fix-green" || stepId === "cover-edge" || stepId === "run-regression" ? "fixed" : current.implementationStatus,
      passedTests,
      result,
      lastCode: codeFor(stepId),
      lastMessage: message,
    },
    output: [codeFor(stepId), `${result.rows.length} test rows`, result.caption],
    accepted: true,
  };
}

function blocked(current: UnitLabState, stepId: UnitStepId, message: string): UnitEventResult {
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

export function createInitialUnitState(): UnitLabState {
  return cloneState(unitLabInitialState);
}

export function resetUnitLab(): UnitLabState {
  return createInitialUnitState();
}

export function isUnitLabComplete(state: UnitLabState): boolean {
  return isComplete(state);
}

export function runUnitEvent(current: UnitLabState, event: UnitLabEvent): UnitEventResult {
  if (event.type === "reset") {
    return {
      state: resetUnitLab(),
      output: ["Unit Testing Lab 已重設，可以重新觀察 red → green。"],
      accepted: true,
    };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "Unit Testing Lab 已完成；如要重練，請先 reset。");
  }

  const required = requiredStep(event.type);
  if (required && !hasCompleted(current, required)) {
    const messages: Readonly<Record<UnitStepId, string>> = {
      "identify-boundary": "",
      "arrange-fixture": "請先選定 calculateOrderTotal 的 unit boundary。",
      "run-red": "請先 Arrange 一個小而明確的標準案例。",
      "fix-green": "請先執行測試，讓 red result 提供修復證據。",
      "cover-edge": "請先修復標準案例並回到 green，再補邊界案例。",
      "run-regression": "請先補上空購物車與超額 discount 的邊界案例。",
    };
    return blocked(current, event.type, messages[event.type]);
  }

  if (event.type === "identify-boundary") {
    return accepted(current, event.type, "calculateOrderTotal 已切成 pure-function unit，沒有 HTTP 或 database 依賴。")
  }

  if (event.type === "arrange-fixture") {
    return accepted(current, event.type, "標準案例已準備：subtotal 150、discount 10，expected total 是 140。")
  }

  if (event.type === "run-red") {
    return accepted(current, event.type, "測試呈現 red：expected 140，但 buggy implementation 得到 150。")
  }

  if (event.type === "fix-green") {
    return accepted(current, event.type, "最小修復已計入 discount，標準案例回到 green：1 / 1 passed。")
  }

  if (event.type === "cover-edge") {
    return accepted(current, event.type, "空購物車與超額 discount 都得到 0，2 個 edge cases 通過。")
  }

  return accepted(current, event.type, `完整 suite 通過：${unitTestCases.length} / ${unitTestCases.length} tests green。`, "completed");
}

export const unitSimulator: SimulatorDefinition<UnitLabState, UnitLabEvent> = {
  createInitialState: createInitialUnitState,
  reduce: (state, event) => runUnitEvent(state, event).state,
  reset: resetUnitLab,
};

export function runUnitEvents(
  events: readonly UnitLabEvent[],
  initialState: UnitLabState = createInitialUnitState(),
): UnitRunResult {
  let state = cloneState(initialState);
  const results: UnitEventResult[] = [];

  for (const event of events) {
    const result = runUnitEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
