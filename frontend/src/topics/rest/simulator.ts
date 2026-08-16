import type { SimulatorDefinition } from "../types";
import {
  findRestScenario,
  restDatabaseFixture,
  restRequiredScenarioIds,
  restTraceStages,
  type RestItem,
  type RestLabEvent,
  type RestLabState,
  type RestScenarioId,
  type RestTraceStageId,
} from "./content";

export interface RestEventResult {
  state: RestLabState;
  accepted: boolean;
}

function appendUnique<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function cloneItems(items: readonly RestItem[]): RestItem[] {
  return items.map((item) => ({ ...item }));
}

function cloneState(state: RestLabState): RestLabState {
  return {
    ...state,
    currentVisitedStageIds: [...state.currentVisitedStageIds],
    learnedStageIds: [...state.learnedStageIds],
    completedScenarioIds: [...state.completedScenarioIds],
    databaseItems: cloneItems(state.databaseItems),
  };
}

function stageIndex(stageId: RestTraceStageId): number {
  return restTraceStages.findIndex((stage) => stage.id === stageId);
}

function isKnownStage(stageId: RestTraceStageId): boolean {
  return stageIndex(stageId) >= 0;
}

function isComplete(state: RestLabState): boolean {
  return (
    restRequiredScenarioIds.every((scenarioId) => state.completedScenarioIds.includes(scenarioId)) &&
    restTraceStages.every((stage) => state.learnedStageIds.includes(stage.id))
  );
}

function terminalMessage(scenarioId: RestScenarioId): string {
  if (scenarioId === "create-success") return "201：資料通過 validation，ORM 完成 INSERT，response model 輸出公開欄位。";
  if (scenarioId === "read-success") return "200：path parameter 進入 SELECT，找到的 ORM object 已序列化為 JSON。";
  if (scenarioId === "not-found") return "404：SQL 正常執行，但查無 resource；route 將空結果轉成 HTTPException。";
  return "422：dependency 已準備但沒有執行 SQL；Pydantic body validation 失敗，因此 path operation 不會執行。";
}

function withStage(current: RestLabState, stageId: RestTraceStageId): RestLabState {
  const state = cloneState(current);
  const scenario = findRestScenario(state.selectedScenarioId);
  const terminalIndex = stageIndex(scenario.terminalStageId);
  const nextIndex = stageIndex(stageId);

  if (!state.requestStarted || !isKnownStage(stageId) || nextIndex > terminalIndex) {
    return { ...state, lastMessage: "這個 stage 不會在目前 request 執行；請依 lifecycle 前進。" };
  }

  state.activeStageId = stageId;
  state.currentVisitedStageIds = appendUnique(state.currentVisitedStageIds, stageId);
  state.learnedStageIds = appendUnique(state.learnedStageIds, stageId);

  if (stageId === "database" && state.selectedScenarioId === "create-success" && !state.databaseItems.some((item) => item.id === 3)) {
    state.databaseItems = [...state.databaseItems, { id: 3, name: "Keyboard", price: 1200 }];
  }

  if (nextIndex === terminalIndex) {
    state.responseReady = true;
    state.completedScenarioIds = appendUnique(state.completedScenarioIds, state.selectedScenarioId);
    state.phase = isComplete(state) ? "completed" : scenario.tone === "error" ? "error" : "tracing";
    state.lastMessage = isComplete(state) ? "四個 request 情境與七個 lifecycle stages 都已完成。" : terminalMessage(state.selectedScenarioId);
  } else {
    state.responseReady = false;
    state.phase = "tracing";
    const stage = restTraceStages[nextIndex];
    state.lastMessage = `${stage.actor}：${stage.summary}`;
  }

  return state;
}

export function createInitialRestState(): RestLabState {
  return {
    selectedScenarioId: "create-success",
    requestStarted: false,
    activeStageId: "browser",
    currentVisitedStageIds: [],
    learnedStageIds: [],
    completedScenarioIds: [],
    databaseItems: cloneItems(restDatabaseFixture),
    responseReady: false,
    phase: "initial",
    lastMessage: "選擇情境，送出 request，接著逐站追蹤實際程式碼。",
  };
}

export function isRestLabComplete(state: RestLabState): boolean {
  return isComplete(state);
}

export function runRestEvent(current: RestLabState, event: RestLabEvent): RestEventResult {
  if (event.type === "reset") {
    return { state: createInitialRestState(), accepted: true };
  }

  const state = cloneState(current);

  if (event.type === "select-scenario") {
    const scenario = findRestScenario(event.scenarioId);
    return {
      accepted: true,
      state: {
        ...state,
        selectedScenarioId: scenario.id,
        requestStarted: false,
        activeStageId: "browser",
        currentVisitedStageIds: [],
        responseReady: false,
        phase: isComplete(state) ? "completed" : "initial",
        lastMessage: `${scenario.method} ${new URL(scenario.url).pathname} 已準備好；送出 request 開始追蹤。`,
      },
    };
  }

  if (event.type === "start-request") {
    const started: RestLabState = {
      ...state,
      requestStarted: true,
      activeStageId: "browser",
      currentVisitedStageIds: [],
      responseReady: false,
      phase: "tracing",
      lastMessage: "React：fetch 正在組成 HTTP request。",
    };
    return { state: withStage(started, "browser"), accepted: true };
  }

  if (!state.requestStarted) {
    return { state: { ...state, lastMessage: "請先送出 request。" }, accepted: false };
  }

  if (event.type === "inspect-stage") {
    const scenario = findRestScenario(state.selectedScenarioId);
    const accepted = isKnownStage(event.stageId) && stageIndex(event.stageId) <= stageIndex(scenario.terminalStageId);
    return { state: withStage(state, event.stageId), accepted };
  }

  const scenario = findRestScenario(state.selectedScenarioId);
  const currentIndex = stageIndex(state.activeStageId);
  const terminalIndex = stageIndex(scenario.terminalStageId);
  if (currentIndex >= terminalIndex) {
    return { state: { ...state, lastMessage: "這次 request 已結束；請切換情境或重新送出。" }, accepted: false };
  }

  return { state: withStage(state, restTraceStages[currentIndex + 1].id), accepted: true };
}

export function resetRestLab(): RestLabState {
  return createInitialRestState();
}

export const restSimulator: SimulatorDefinition<RestLabState, RestLabEvent> = {
  createInitialState: createInitialRestState,
  reduce: (state, event) => runRestEvent(state, event).state,
  reset: resetRestLab,
};

export function runRestEvents(events: readonly RestLabEvent[], initialState = createInitialRestState()): RestLabState {
  return events.reduce((state, event) => runRestEvent(state, event).state, cloneState(initialState));
}
