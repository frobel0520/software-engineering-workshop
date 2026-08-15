import { describe, expect, it } from "vitest";
import { guardrailScenarios } from "./content";
import {
  createInitialGuardrailState,
  guardrailSimulator,
  isGuardrailComplete,
  runGuardrailEvent,
  runGuardrailEvents,
} from "./simulator";
import { resetSimulator, runSimulatorEvents } from "../../testing/simulator";

const requiredScenarioEvents = [
  { type: "setInput", text: guardrailScenarios[0].input },
  { type: "submitScenario", id: "safe-input" },
  { type: "setInput", text: guardrailScenarios[1].input },
  { type: "submitScenario", id: "pii-fix" },
  { type: "selectStage", stage: "tool" },
  { type: "setInput", text: guardrailScenarios[3].input },
  { type: "submitScenario", id: "tool-side-effect" },
] as const;

describe("guardrail simulator", () => {
  it("completes the three required deterministic scenarios", () => {
    const result = runGuardrailEvents(requiredScenarioEvents);

    expect(result.accepted).toBe(true);
    expect(isGuardrailComplete(result.state)).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedScenarioIds).toEqual(["safe-input", "pii-fix", "tool-side-effect"]);
    expect(result.state.outcome).toBe("blocked");
  });

  it("blocks a scenario when its triggering validator is disabled", () => {
    const start = createInitialGuardrailState();
    const disabled = runGuardrailEvent(start, { type: "toggleValidator", id: "pii-secret" });
    const withInput = runGuardrailEvent(disabled.state, { type: "setInput", text: guardrailScenarios[1].input });
    const result = runGuardrailEvent(withInput.state, { type: "submitScenario", id: "pii-fix" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("failed");
    expect(result.state.completedScenarioIds).toEqual([]);
  });

  it("replays the same events deterministically through the shared harness", () => {
    const first = runSimulatorEvents(guardrailSimulator, createInitialGuardrailState(), requiredScenarioEvents);
    const second = runSimulatorEvents(guardrailSimulator, createInitialGuardrailState(), requiredScenarioEvents);

    expect(second).toEqual(first);
    expect(isGuardrailComplete(first)).toBe(true);
  });

  it("resets all scenario progress and result details", () => {
    const complete = runGuardrailEvents(requiredScenarioEvents).state;

    expect(resetSimulator(guardrailSimulator)).toEqual(createInitialGuardrailState());
    expect(complete.completedScenarioIds).not.toEqual([]);
  });
});
