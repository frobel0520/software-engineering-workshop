import type { SimulatorDefinition } from "../../topics/types";
import {
  guardrailRequiredScenarioIds,
  guardrailScenarios,
  guardrailValidators,
  type GuardrailFailureAction,
  type GuardrailOutcome,
  type GuardrailScenarioId,
  type GuardrailStage,
  type ValidatorId,
} from "./content";

export type GuardrailPhase = "initial" | "active" | "failed" | "completed";

export interface ValidatorResult {
  validatorId: ValidatorId;
  triggered: boolean;
  action: GuardrailFailureAction;
  message: string;
  latencyMs: number;
}

export interface GuardrailState {
  stage: GuardrailStage;
  enabledValidators: ValidatorId[];
  lastInput: string;
  results: ValidatorResult[];
  outcome: GuardrailOutcome;
  latencyMs: number;
  phase: GuardrailPhase;
  completedScenarioIds: GuardrailScenarioId[];
  lastMessage: string;
  canReset: true;
}

export type GuardrailEvent =
  | { type: "selectStage"; stage: GuardrailStage }
  | { type: "setInput"; text: string }
  | { type: "toggleValidator"; id: ValidatorId }
  | { type: "submitScenario"; id: GuardrailScenarioId }
  | { type: "reset" };

export interface GuardrailEventResult {
  state: GuardrailState;
  output: readonly string[];
  accepted: boolean;
}

export interface GuardrailRunResult {
  state: GuardrailState;
  results: readonly GuardrailEventResult[];
  accepted: boolean;
}

export function createInitialGuardrailState(): GuardrailState {
  return {
    stage: "input",
    enabledValidators: ["prompt-injection", "pii-secret"],
    lastInput: "",
    results: [],
    outcome: "pass",
    latencyMs: 0,
    phase: "initial",
    completedScenarioIds: [],
    lastMessage: "選擇一個情境，觀察每層 guardrail 的結果。",
    canReset: true,
  };
}

export function resetGuardrail(): GuardrailState {
  return createInitialGuardrailState();
}

export function isGuardrailComplete(state: GuardrailState): boolean {
  return guardrailRequiredScenarioIds.every((id) => state.completedScenarioIds.includes(id));
}

function validatorsForStage(stage: GuardrailStage): ValidatorId[] {
  return guardrailValidators.filter((validator) => validator.stage === stage).map((validator) => validator.id);
}

function accepted(
  current: GuardrailState,
  changes: Partial<GuardrailState>,
  message: string,
  output: readonly string[] = [message],
): GuardrailEventResult {
  return {
    state: { ...current, ...changes, phase: "active", lastMessage: message },
    output,
    accepted: true,
  };
}

function blocked(current: GuardrailState, message: string): GuardrailEventResult {
  return {
    state: { ...current, phase: "failed", outcome: "blocked", lastMessage: message },
    output: [message],
    accepted: false,
  };
}

function validatorMessage(validatorId: ValidatorId, triggered: boolean, action: GuardrailFailureAction): string {
  if (!triggered) return `${validatorId}: pass`;
  return `${validatorId}: ${action}`;
}

export function runGuardrailEvent(current: GuardrailState, event: GuardrailEvent): GuardrailEventResult {
  if (event.type === "reset") {
    return { state: resetGuardrail(), output: ["Guardrail Lab 已重設。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, "Guardrail Lab 已完成；如要重練，請先 reset。");
  }

  switch (event.type) {
    case "selectStage":
      return accepted(
        current,
        {
          stage: event.stage,
          enabledValidators: validatorsForStage(event.stage),
          lastInput: "",
          results: [],
          outcome: "pass",
          latencyMs: 0,
        },
        `已切換到 ${event.stage} stage；請選擇情境。`,
      );
    case "setInput":
      return accepted(current, { lastInput: event.text, results: [], outcome: "pass", latencyMs: 0 }, "已更新待檢查內容。", [
        `待檢查內容：${event.text || "（空白）"}`,
      ]);
    case "toggleValidator": {
      const validator = guardrailValidators.find((item) => item.id === event.id);
      if (!validator || validator.stage !== current.stage) {
        return blocked(current, `${event.id} 不屬於目前的 ${current.stage} stage。`);
      }
      const enabledValidators = current.enabledValidators.includes(event.id)
        ? current.enabledValidators.filter((id) => id !== event.id)
        : [...current.enabledValidators, event.id];
      return accepted(current, { enabledValidators, results: [], outcome: "pass", latencyMs: 0 }, `${event.id} validator 已${enabledValidators.includes(event.id) ? "啟用" : "停用"}。`);
    }
    case "submitScenario": {
      const scenario = guardrailScenarios.find((item) => item.id === event.id);
      if (!scenario) return blocked(current, `找不到 ${event.id} 對應情境。`);
      if (scenario.stage !== current.stage) {
        return blocked(current, `${scenario.id} 需要在 ${scenario.stage} stage 執行。`);
      }
      if (current.lastInput !== scenario.input) {
        return blocked(current, "請先載入 scenario 輸入，再送出檢查。");
      }
      if (scenario.expectedValidator && !current.enabledValidators.includes(scenario.expectedValidator)) {
        return blocked(current, `請先啟用 ${scenario.expectedValidator} validator，才能觀察這個風險。`);
      }

      const results = current.enabledValidators.map((validatorId) => {
        const triggered = validatorId === scenario.expectedValidator;
        const action = triggered ? scenario.expectedAction : "pass";
        const validator = guardrailValidators.find((item) => item.id === validatorId);
        return {
          validatorId,
          triggered,
          action,
          message: validatorMessage(validatorId, triggered, action),
          latencyMs: validator?.latencyMs ?? 0,
        };
      });
      const completedScenarioIds = guardrailRequiredScenarioIds.includes(event.id)
        ? Array.from(new Set([...current.completedScenarioIds, event.id]))
        : current.completedScenarioIds;
      const completed = guardrailRequiredScenarioIds.every((id) => completedScenarioIds.includes(id));
      const message = `${scenario.title}：${scenario.expectedAction}，結果為 ${scenario.expectedOutcome}。`;
      const output = [message, ...results.map((result) => result.message), `latency：${scenario.latencyMs}ms`];
      return {
        state: {
          ...current,
          results,
          outcome: scenario.expectedOutcome,
          latencyMs: scenario.latencyMs,
          completedScenarioIds,
          phase: completed ? "completed" : scenario.expectedOutcome === "blocked" ? "failed" : "active",
          lastMessage: message,
        },
        output,
        accepted: true,
      };
    }
  }
}

export const guardrailSimulator: SimulatorDefinition<GuardrailState, GuardrailEvent> = {
  createInitialState: createInitialGuardrailState,
  reduce: (state, event) => runGuardrailEvent(state, event).state,
  reset: resetGuardrail,
};

export function runGuardrailEvents(
  events: readonly GuardrailEvent[],
  initialState: GuardrailState = createInitialGuardrailState(),
): GuardrailRunResult {
  let state = { ...initialState, enabledValidators: [...initialState.enabledValidators], results: [...initialState.results], completedScenarioIds: [...initialState.completedScenarioIds] };
  const results: GuardrailEventResult[] = [];

  for (const event of events) {
    const result = runGuardrailEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
