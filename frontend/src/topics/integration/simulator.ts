import type { SimulatorDefinition } from "../types";
import {
  integrationFailureFixtures,
  integrationRequiredScenarioIds,
  integrationScenarios,
  type IntegrationBoundaryId,
  type IntegrationScenarioId,
} from "./content";

export type IntegrationStageId = "input" | IntegrationBoundaryId;
export type IntegrationLabPhase = "initial" | "tracing" | "blocked" | "completed";
export type IntegrationResponse = "success" | "contract-error" | "dependency-unavailable";
export type IntegrationSideEffect = "none" | "order-created";

export const integrationStageIds: readonly IntegrationStageId[] = [
  "input",
  "client",
  "service",
  "repository",
  "response",
] as const;

export interface IntegrationLabState {
  selectedScenarioId: IntegrationScenarioId | null;
  activeStageId: IntegrationStageId;
  completedScenarioIds: readonly IntegrationScenarioId[];
  visitedBoundaryIds: readonly IntegrationBoundaryId[];
  phase: IntegrationLabPhase;
  response: IntegrationResponse | null;
  sideEffects: IntegrationSideEffect;
  lastMessage: string;
  canReset: true;
}

export type IntegrationLabEvent =
  | { type: "select-scenario"; scenarioId: IntegrationScenarioId }
  | { type: "trace-next" }
  | { type: "inspect-stage"; stageId: IntegrationStageId }
  | { type: "reset" };

export type IntegrationState = IntegrationLabState;
export type IntegrationEvent = IntegrationLabEvent;

export interface IntegrationEventResult {
  state: IntegrationLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface IntegrationRunResult {
  state: IntegrationLabState;
  results: readonly IntegrationEventResult[];
  accepted: boolean;
}

function cloneState(state: IntegrationLabState): IntegrationLabState {
  return {
    ...state,
    completedScenarioIds: [...state.completedScenarioIds],
    visitedBoundaryIds: [...state.visitedBoundaryIds],
  };
}

function appendUnique<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function scenarioFor(scenarioId: IntegrationScenarioId | null) {
  return scenarioId ? integrationScenarios.find((scenario) => scenario.id === scenarioId) : undefined;
}

function stageIndex(stageId: IntegrationStageId): number {
  return integrationStageIds.indexOf(stageId);
}

function terminalStageFor(scenario: NonNullable<ReturnType<typeof scenarioFor>>): IntegrationStageId {
  return scenario.expected.failureBoundary ?? "response";
}

function nextStageFor(
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  currentStageId: IntegrationStageId,
): IntegrationStageId | null {
  const nextIndex = stageIndex(currentStageId) + 1;
  return nextIndex <= stageIndex(terminalStageFor(scenario)) ? integrationStageIds[nextIndex] : null;
}

function boundaryObservation(
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  boundary: IntegrationBoundaryId,
) {
  return scenario.trace.find((observation) => observation.boundary === boundary);
}

function failureFixtureFor(scenarioId: IntegrationScenarioId) {
  return integrationFailureFixtures.find((fixture) => fixture.scenarioId === scenarioId);
}

function isComplete(state: IntegrationLabState): boolean {
  return (
    state.phase === "completed" &&
    integrationRequiredScenarioIds.every((scenarioId) => state.completedScenarioIds.includes(scenarioId))
  );
}

function accepted(
  current: IntegrationLabState,
  changes: Partial<IntegrationLabState>,
  message: string,
  output: readonly string[] = [message],
): IntegrationEventResult {
  return {
    state: { ...cloneState(current), ...changes, phase: "tracing", lastMessage: message },
    output,
    accepted: true,
  };
}

function blocked(current: IntegrationLabState, message: string): IntegrationEventResult {
  const state = cloneState(current);
  return {
    state: {
      ...state,
      phase: state.phase === "completed" ? "completed" : "blocked",
      lastMessage: message,
    },
    output: [message],
    accepted: false,
  };
}

function selectedScenarioMessage(scenario: NonNullable<ReturnType<typeof scenarioFor>>): string {
  return `${scenario.title} fixture 已載入；下一步觀察 client boundary。`;
}

function boundaryMessage(
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  boundary: IntegrationBoundaryId,
): string {
  const observation = boundaryObservation(scenario, boundary);
  const nextStage = nextStageFor(scenario, boundary);
  const nextMessage = nextStage ? `下一步觀察 ${nextStage} boundary。` : "這是目前 scenario 的 terminal boundary。";
  return `${boundary} boundary 通過：${observation?.evidence ?? "已保留固定 fixture 證據"} ${nextMessage}`;
}

function failureMessage(
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  boundary: IntegrationBoundaryId,
): string {
  const fixture = failureFixtureFor(scenario.id);
  const observation = boundaryObservation(scenario, boundary);
  return `${fixture?.message ?? `${boundary} boundary failure。`} 證據：${fixture?.evidence ?? observation?.evidence ?? "固定 fixture outcome"}`;
}

function terminalResult(
  current: IntegrationLabState,
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  stageId: IntegrationStageId,
): IntegrationEventResult {
  const visitedBoundaryIds = appendUnique(current.visitedBoundaryIds, stageId as IntegrationBoundaryId);
  const completedScenarioIds = appendUnique(current.completedScenarioIds, scenario.id);
  const outcome = scenario.expected.kind;
  const sideEffects: IntegrationSideEffect = outcome === "success" ? "order-created" : "none";
  const response: IntegrationResponse = outcome;
  const completed = integrationRequiredScenarioIds.every((scenarioId) => completedScenarioIds.includes(scenarioId));

  let message: string;
  let output: readonly string[];
  if (outcome === "success") {
    message = "response boundary 通過：看見 orderId ord-001、total 90 與 status created；成功建立訂單。";
    output = [message, "statusCode: 201", "sideEffect: order-created"];
  } else {
    message = failureMessage(scenario, stageId as IntegrationBoundaryId);
    output = [message, `response: ${outcome}`, "sideEffect: none"];
  }

  return {
    state: {
      ...cloneState(current),
      activeStageId: stageId,
      visitedBoundaryIds,
      completedScenarioIds,
      phase: completed ? "completed" : outcome === "success" ? "tracing" : "blocked",
      response,
      sideEffects,
      lastMessage: message,
    },
    output,
    accepted: true,
  };
}

function advanceToStage(
  current: IntegrationLabState,
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  stageId: IntegrationStageId,
): IntegrationEventResult {
  const currentIndex = stageIndex(current.activeStageId);
  const requestedIndex = stageIndex(stageId);
  const terminalIndex = stageIndex(terminalStageFor(scenario));
  const nextStage = nextStageFor(scenario, current.activeStageId);

  if (requestedIndex > terminalIndex) {
    return blocked(current, `${scenario.id} 在 ${terminalStageFor(scenario)} boundary 結束；不可跳到 ${stageId}。`);
  }

  if (requestedIndex > currentIndex + 1) {
    return blocked(current, `請先觀察 ${nextStage ?? terminalStageFor(scenario)} boundary，再進入 ${stageId}；不要跳過必要證據。`);
  }

  if (requestedIndex <= currentIndex) {
    const message = `${stageId} boundary 已觀察；${nextStage ? `下一步是 ${nextStage}。` : "請選擇下一個 scenario 或 reset。"}`;
    return accepted(current, {}, message);
  }

  if (stageId === "input") {
    return accepted(current, { activeStageId: "input" }, "固定 input fixture 已確認；下一步觀察 client boundary。");
  }

  const visitedBoundaryIds = appendUnique(current.visitedBoundaryIds, stageId);
  if (stageId === terminalStageFor(scenario)) {
    return terminalResult(
      { ...current, visitedBoundaryIds },
      scenario,
      stageId,
    );
  }

  const message = boundaryMessage(scenario, stageId);
  return accepted(current, { activeStageId: stageId, visitedBoundaryIds, response: null, sideEffects: "none" }, message);
}

export function createInitialIntegrationState(): IntegrationLabState {
  return {
    selectedScenarioId: null,
    activeStageId: "input",
    completedScenarioIds: [],
    visitedBoundaryIds: [],
    phase: "initial",
    response: null,
    sideEffects: "none",
    lastMessage: "請先選擇固定 scenario fixture，再開始 trace。",
    canReset: true,
  };
}

export function resetIntegrationLab(): IntegrationLabState {
  return createInitialIntegrationState();
}

export function isIntegrationLabComplete(state: IntegrationLabState): boolean {
  return isComplete(state);
}

export function runIntegrationEvent(current: IntegrationLabState, event: IntegrationLabEvent): IntegrationEventResult {
  if (event.type === "reset") {
    return { state: resetIntegrationLab(), output: ["Integration Lab 已重設，可以重新開始。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, "Integration Lab 已完成；如要重練，請先 reset。 ");
  }

  if (event.type === "select-scenario") {
    const scenario = scenarioFor(event.scenarioId);
    if (!scenario) return blocked(current, `找不到 ${event.scenarioId} scenario fixture。`);
    const state = cloneState(current);
    return {
      state: {
        ...state,
        selectedScenarioId: scenario.id,
        activeStageId: "input",
        visitedBoundaryIds: [],
        phase: "initial",
        response: null,
        sideEffects: "none",
        lastMessage: selectedScenarioMessage(scenario),
      },
      output: [selectedScenarioMessage(scenario)],
      accepted: true,
    };
  }

  const state = cloneState(current);
  const scenario = scenarioFor(state.selectedScenarioId);
  if (!scenario) return blocked(state, "尚未選擇 scenario；請先載入固定 fixture，再開始 trace。");

  if (state.response !== null) {
    return blocked(state, `${scenario.title} 已到 terminal outcome；請先選擇另一個 scenario 或 reset。`);
  }

  if (event.type === "trace-next") {
    const nextStage = nextStageFor(scenario, state.activeStageId);
    if (!nextStage) return blocked(state, `${scenario.title} 已到 terminal boundary；請選擇另一個 scenario 或 reset。`);
    return advanceToStage(state, scenario, nextStage);
  }

  const requestedIndex = stageIndex(event.stageId);
  if (requestedIndex < 0) return blocked(state, `找不到 ${event.stageId} integration stage。`);
  return advanceToStage(state, scenario, event.stageId);
}

export const integrationSimulator: SimulatorDefinition<IntegrationLabState, IntegrationLabEvent> = {
  createInitialState: createInitialIntegrationState,
  reduce: (state, event) => runIntegrationEvent(state, event).state,
  reset: resetIntegrationLab,
};

export function runIntegrationEvents(
  events: readonly IntegrationLabEvent[],
  initialState: IntegrationLabState = createInitialIntegrationState(),
): IntegrationRunResult {
  let state = cloneState(initialState);
  const results: IntegrationEventResult[] = [];

  for (const event of events) {
    const result = runIntegrationEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
