import type { SimulatorDefinition } from "../types";
import {
  logsFailureFixtures,
  logsFixtureRedactedFields,
  logsRequiredScenarioIds,
  logsSafeContextKeys,
  logsScenarios,
  type LogsFailureEvent,
  type LogsLevel,
  type LogsOutcome,
  type LogsScenarioId,
  type LogsSource,
  type LogsSensitiveField,
} from "./content";

export type LogsLabPhase = "initial" | "inspecting" | "blocked" | "completed";
export type LogsCheckStatus = "pending" | "passed" | "failed";
export type LogsTerminalOutcome = Exclude<LogsOutcome, "started">;
export type LogsFeedback = "none" | "success" | "blocked" | "redaction-failed";

export interface LogsLabState {
  phase: LogsLabPhase;
  selectedScenarioId: LogsScenarioId | null;
  activeEventIndex: number;
  visibleEventIds: readonly string[];
  completedScenarioIds: readonly LogsScenarioId[];
  correlationCheck: LogsCheckStatus;
  redactionCheck: LogsCheckStatus;
  terminalOutcome: LogsTerminalOutcome | null;
  lastFeedback: LogsFeedback;
  lastMessage: string;
  canReset: true;
}

export type LogsLabEvent =
  | { type: "select-scenario"; scenarioId: LogsScenarioId }
  | { type: "inspect-event"; sequence: number }
  | { type: "verify-correlation"; correlationId?: string }
  | { type: "verify-redaction"; serializedOutput?: string }
  | {
      type: "verify-terminal";
      level?: LogsLevel;
      source?: LogsSource;
      statusCode?: number;
      outcome?: LogsTerminalOutcome;
    }
  | { type: "reset" };

export type LogsState = LogsLabState;
export type LogsSimulatorEvent = LogsLabEvent;

export interface LogsEventResult {
  state: LogsLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface LogsRunResult {
  state: LogsLabState;
  results: readonly LogsEventResult[];
  accepted: boolean;
}

function cloneState(state: LogsLabState): LogsLabState {
  return {
    ...state,
    visibleEventIds: [...state.visibleEventIds],
    completedScenarioIds: [...state.completedScenarioIds],
  };
}

function appendUnique<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function scenarioFor(scenarioId: LogsScenarioId | null) {
  return scenarioId ? logsScenarios.find((scenario) => scenario.id === scenarioId) : undefined;
}

function eventIdFor(scenarioId: LogsScenarioId, sequence: number): string {
  return `${scenarioId}:${sequence}`;
}

function failureText(event: LogsFailureEvent, fallback: string): string {
  const fixture = logsFailureFixtures.find((candidate) => candidate.event === event);
  return fixture ? `${fixture.message} 證據：${fixture.evidence}` : fallback;
}

function blocked(current: LogsLabState, message: string): LogsEventResult {
  const state = cloneState(current);
  return {
    state: {
      ...state,
      phase: state.phase === "completed" ? "completed" : "blocked",
      lastFeedback: "blocked",
      lastMessage: message,
    },
    output: [message],
    accepted: false,
  };
}

function accepted(
  current: LogsLabState,
  changes: Partial<LogsLabState>,
  message: string,
  output: readonly string[] = [message],
): LogsEventResult {
  return {
    state: {
      ...cloneState(current),
      ...changes,
      phase: "inspecting",
      lastFeedback: "success",
      lastMessage: message,
    },
    output,
    accepted: true,
  };
}

function selectedScenarioOrBlock(current: LogsLabState):
  | { scenario: NonNullable<ReturnType<typeof scenarioFor>>; result?: undefined }
  | { scenario?: undefined; result: LogsEventResult } {
  const scenario = scenarioFor(current.selectedScenarioId);
  if (scenario) return { scenario };
  return {
    result: blocked(
      current,
      failureText("inspect-without-scenario", "尚未選擇 scenario；請先載入 Logs 測試資料。"),
    ),
  };
}

function sensitiveValueFor(scenario: NonNullable<ReturnType<typeof scenarioFor>>, field: LogsSensitiveField): string | undefined {
  const sensitiveValues: Readonly<Record<LogsSensitiveField, string>> = {
    authorization: scenario.request.authorization,
    password: scenario.request.password,
    accessToken: scenario.request.accessToken,
    cookie: scenario.request.cookie,
    email: scenario.request.email,
  };
  return sensitiveValues[field];
}

function rawSensitiveFieldIn(
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  serializedOutput: string,
): LogsSensitiveField | undefined {
  return logsFixtureRedactedFields.find((field) => {
    const value = sensitiveValueFor(scenario, field);
    return value !== undefined && serializedOutput.includes(value);
  });
}

function unsafeContextKeyIn(scenario: NonNullable<ReturnType<typeof scenarioFor>>): string | undefined {
  for (const event of scenario.events) {
    const unsafeKey = Object.keys(event.context).find(
      (key) => !(logsSafeContextKeys as readonly string[]).includes(key),
    );
    if (unsafeKey) return unsafeKey;
  }
  return undefined;
}

function redactionFailure(
  current: LogsLabState,
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  serializedOutput: string,
): LogsEventResult | undefined {
  const leakedField = rawSensitiveFieldIn(scenario, serializedOutput);
  if (leakedField) {
    const state = cloneState(current);
    const message = `redaction-failed：輸出包含 ${leakedField}；不要顯示 raw value，請先套用 safe context allowlist。`;
    return {
      state: {
        ...state,
        phase: "blocked",
        redactionCheck: "failed",
        lastFeedback: "redaction-failed",
        lastMessage: message,
      },
      output: [message],
      accepted: false,
    };
  }

  const missingField = logsFixtureRedactedFields.find(
    (field) => scenario.events.some((event) => !event.redactedFields.includes(field)),
  );
  if (missingField) {
    const state = cloneState(current);
    const message = `redaction-failed：event 沒有記錄 ${missingField}；請在格式化前完成 redaction。`;
    return {
      state: {
        ...state,
        phase: "blocked",
        redactionCheck: "failed",
        lastFeedback: "redaction-failed",
        lastMessage: message,
      },
      output: [message],
      accepted: false,
    };
  }

  const unsafeKey = unsafeContextKeyIn(scenario);
  if (unsafeKey) {
    const state = cloneState(current);
    const message = `redaction-failed：context 欄位 ${unsafeKey} 不在 safe allowlist；請移除它後再驗證。`;
    return {
      state: {
        ...state,
        phase: "blocked",
        redactionCheck: "failed",
        lastFeedback: "redaction-failed",
        lastMessage: message,
      },
      output: [message],
      accepted: false,
    };
  }

  return undefined;
}

interface LogsTerminalObservation {
  level?: LogsLevel;
  source?: LogsSource;
  statusCode?: number;
  outcome?: LogsTerminalOutcome;
}

function terminalMatchesExpected(
  scenario: NonNullable<ReturnType<typeof scenarioFor>>,
  observation: LogsTerminalObservation = {},
): boolean {
  const terminal = scenario.events[scenario.events.length - 1];
  return (
    terminal?.event === scenario.expected.terminalEvent &&
    terminal.source === scenario.expected.terminalSource &&
    terminal.level === scenario.expected.level &&
    terminal.context.statusCode === scenario.expected.statusCode &&
    terminal.outcome === scenario.expected.outcome &&
    terminal.correlationId === scenario.expected.correlationId &&
    logsFixtureRedactedFields.every((field) => terminal.redactedFields.includes(field)) &&
    (observation.level === undefined || observation.level === scenario.expected.level) &&
    (observation.source === undefined || observation.source === scenario.expected.terminalSource) &&
    (observation.statusCode === undefined || observation.statusCode === scenario.expected.statusCode) &&
    (observation.outcome === undefined || observation.outcome === scenario.expected.outcome)
  );
}

function isComplete(state: LogsLabState): boolean {
  return (
    state.phase === "completed" &&
    logsRequiredScenarioIds.every((scenarioId) => state.completedScenarioIds.includes(scenarioId))
  );
}

export function createInitialLogsState(): LogsLabState {
  return {
    phase: "initial",
    selectedScenarioId: null,
    activeEventIndex: 0,
    visibleEventIds: [],
    completedScenarioIds: [],
    correlationCheck: "pending",
    redactionCheck: "pending",
    terminalOutcome: null,
    lastFeedback: "none",
    lastMessage: "請先選擇 Logs scenario，再逐筆 inspect event。",
    canReset: true,
  };
}

export function resetLogsLab(): LogsLabState {
  return createInitialLogsState();
}

export function isLogsLabComplete(state: LogsLabState): boolean {
  return isComplete(state);
}

function selectScenario(current: LogsLabState, scenarioId: LogsScenarioId): LogsEventResult {
  const scenario = scenarioFor(scenarioId);
  if (!scenario) return blocked(current, `找不到 ${scenarioId} Logs scenario。`);
  if (current.completedScenarioIds.includes(scenario.id)) {
    return blocked(current, `${scenario.title} 已完成；請先 reset 後再重練，不要重複累加 completion。`);
  }

  const message = `${scenario.title} 已載入；下一步 inspect sequence 1。`;
  return {
    state: {
      ...cloneState(current),
      phase: "initial",
      selectedScenarioId: scenario.id,
      activeEventIndex: 0,
      visibleEventIds: [],
      correlationCheck: "pending",
      redactionCheck: "pending",
      terminalOutcome: null,
      lastFeedback: "success",
      lastMessage: message,
    },
    output: [message],
    accepted: true,
  };
}

function inspectEvent(current: LogsLabState, sequence: number): LogsEventResult {
  const selected = selectedScenarioOrBlock(current);
  if (selected.result) return selected.result;
  const scenario = selected.scenario;

  if (current.terminalOutcome !== null) {
    return blocked(current, `${scenario.title} 已到 terminal outcome；請選擇另一個 scenario 或 reset。`);
  }

  const expectedSequence = current.activeEventIndex + 1;
  if (sequence !== expectedSequence) {
    return blocked(
      current,
      failureText("skip-event", `請先檢查 sequence ${expectedSequence}，再進入 sequence ${sequence}。`),
    );
  }

  const event = scenario.events[current.activeEventIndex];
  if (!event || event.sequence !== sequence) {
    return blocked(current, `找不到 ${scenario.id} 的 sequence ${sequence} event；請重新選擇 scenario。`);
  }

  const visibleEventIds = [...current.visibleEventIds, eventIdFor(scenario.id, event.sequence)];
  const activeEventIndex = current.activeEventIndex + 1;
  const message = activeEventIndex === scenario.events.length
    ? `${scenario.id} 的 ${scenario.events.length} 筆 events 已檢視；下一步驗證 correlationId。`
    : `sequence ${event.sequence} 已檢視：${event.event} · ${event.level}；下一步檢查 sequence ${activeEventIndex + 1}。`;

  return accepted(
    current,
    { activeEventIndex, visibleEventIds },
    message,
    [eventIdFor(scenario.id, event.sequence), `${event.event} · ${event.level}`, `correlationId: ${event.correlationId}`],
  );
}

function verifyCorrelation(current: LogsLabState, observedCorrelationId?: string): LogsEventResult {
  const selected = selectedScenarioOrBlock(current);
  if (selected.result) return selected.result;
  const scenario = selected.scenario;

  if (current.activeEventIndex < scenario.events.length) {
    return blocked(current, failureText("skip-event", "請先檢視完整 event sequence，再驗證 correlationId。"));
  }

  const expectedCorrelationId = scenario.expected.correlationId;
  const eventsMatch = scenario.events.every((event) => event.correlationId === expectedCorrelationId);
  if (!eventsMatch || (observedCorrelationId !== undefined && observedCorrelationId !== expectedCorrelationId)) {
    const state = cloneState(current);
    const message = failureText(
      "correlation-mismatch",
      "同一 scenario 的 correlationId 不一致；請回到 request timeline 檢查關聯。",
    );
    return {
      state: { ...state, phase: "blocked", correlationCheck: "failed", lastFeedback: "blocked", lastMessage: message },
      output: [message],
      accepted: false,
    };
  }

  return accepted(
    current,
    { correlationCheck: "passed" },
    `correlationId ${expectedCorrelationId} 在 ${scenario.events.length} 筆 events 中一致；下一步驗證 redaction。`,
  );
}

function verifyRedaction(current: LogsLabState, serializedOutput?: string): LogsEventResult {
  const selected = selectedScenarioOrBlock(current);
  if (selected.result) return selected.result;
  const scenario = selected.scenario;

  if (current.activeEventIndex < scenario.events.length) {
    return blocked(current, failureText("skip-event", "請先檢視完整 event sequence，再驗證 redaction。"));
  }
  if (current.correlationCheck !== "passed") {
    return blocked(current, "請先通過 correlationId check，再驗證 redaction；目前還缺少 request 關聯證據。");
  }

  const safeSerializedOutput = serializedOutput ?? JSON.stringify(scenario.events);
  const failure = redactionFailure(current, scenario, safeSerializedOutput);
  if (failure) return failure;

  return accepted(
    current,
    { redactionCheck: "passed" },
    `redaction check 通過：${logsFixtureRedactedFields.join("、")} 沒有出現在 serialized event output；下一步驗證 terminal outcome。`,
  );
}

function verifyTerminal(current: LogsLabState, observation: LogsTerminalObservation = {}): LogsEventResult {
  const selected = selectedScenarioOrBlock(current);
  if (selected.result) return selected.result;
  const scenario = selected.scenario;

  if (current.activeEventIndex < scenario.events.length) {
    return blocked(current, failureText("skip-event", "請先檢視所有 events，再驗證 terminal outcome。"));
  }
  if (current.correlationCheck !== "passed") {
    return blocked(current, "terminal outcome 需要先通過 correlationId check；目前的 request timeline 還不能宣告完成。");
  }
  if (current.redactionCheck !== "passed") {
    return blocked(current, "terminal outcome 需要先通過 redaction check；請確認 raw sensitive value 沒有被輸出。");
  }
  if (current.terminalOutcome !== null) {
    return blocked(current, `${scenario.title} 已完成；請選擇另一個 scenario 或 reset。`);
  }
  if (!terminalMatchesExpected(scenario, observation)) {
    return blocked(
      current,
      failureText(
        "wrong-severity",
        "terminal evidence contract 不一致；請檢查 level、source、statusCode、outcome 與 correlationId。",
      ),
    );
  }

  const completedScenarioIds = appendUnique(current.completedScenarioIds, scenario.id);
  const completed = logsRequiredScenarioIds.every((scenarioId) => completedScenarioIds.includes(scenarioId));
  const message = `${scenario.title} terminal outcome 通過：${scenario.expected.level}／${scenario.expected.statusCode}／${scenario.expected.outcome}；correlation 與 redaction 證據完整。`;

  return {
    state: {
      ...cloneState(current),
      phase: completed ? "completed" : "inspecting",
      completedScenarioIds,
      terminalOutcome: scenario.expected.outcome,
      lastFeedback: "success",
      lastMessage: message,
    },
    output: [message, `event: ${scenario.expected.terminalEvent}`, `statusCode: ${scenario.expected.statusCode}`, `outcome: ${scenario.expected.outcome}`],
    accepted: true,
  };
}

export function runLogsEvent(current: LogsLabState, event: LogsLabEvent): LogsEventResult {
  if (event.type === "reset") {
    return { state: resetLogsLab(), output: ["Logs Lab 已重設，可以重新 inspect scenarios。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, "Logs Lab 已完成；如要重練，請先 reset。 ");
  }

  if (event.type === "select-scenario") return selectScenario(current, event.scenarioId);
  if (event.type === "inspect-event") return inspectEvent(current, event.sequence);
  if (event.type === "verify-correlation") return verifyCorrelation(current, event.correlationId);
  if (event.type === "verify-redaction") return verifyRedaction(current, event.serializedOutput);
  return verifyTerminal(current, event);
}

export const logsSimulator: SimulatorDefinition<LogsLabState, LogsLabEvent> = {
  createInitialState: createInitialLogsState,
  reduce: (state, event) => runLogsEvent(state, event).state,
  reset: resetLogsLab,
};

export function runLogsEvents(
  events: readonly LogsLabEvent[],
  initialState: LogsLabState = createInitialLogsState(),
): LogsRunResult {
  let state = cloneState(initialState);
  const results: LogsEventResult[] = [];

  for (const event of events) {
    const result = runLogsEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
