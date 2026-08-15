import { describe, expect, it } from "vitest";
import { guardrailScenarios } from "./content";
import { createInitialGuardrailState, runGuardrailEvents } from "./simulator";
import { guardrailLabProgress } from "./lab";

describe("guardrail lab progress", () => {
  it("starts empty and reaches 100 after required scenarios", () => {
    const events = [
      { type: "setInput", text: guardrailScenarios[0].input },
      { type: "submitScenario", id: "safe-input" },
      { type: "setInput", text: guardrailScenarios[1].input },
      { type: "submitScenario", id: "pii-fix" },
      { type: "selectStage", stage: "tool" },
      { type: "setInput", text: guardrailScenarios[3].input },
      { type: "submitScenario", id: "tool-side-effect" },
    ] as const;

    expect(guardrailLabProgress(createInitialGuardrailState())).toBe(0);
    expect(guardrailLabProgress(runGuardrailEvents(events).state)).toBe(100);
  });
});
