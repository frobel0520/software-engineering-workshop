import { describe, expect, it } from "vitest";
import {
  guardrailLesson,
  guardrailOutcomePriority,
  guardrailRequiredScenarioIds,
  guardrailScenarios,
  guardrailValidators,
} from "./content";

describe("guardrail lesson and fixture contract", () => {
  it("explains the module boundaries with unique sections", () => {
    expect(guardrailLesson.objectives.length).toBeGreaterThanOrEqual(4);
    expect(guardrailLesson.sections).toHaveLength(4);
    expect(new Set(guardrailLesson.sections.map((section) => section.id)).size).toBe(guardrailLesson.sections.length);
  });

  it("covers the three stages and representative validators", () => {
    expect(new Set(guardrailValidators.map((validator) => validator.stage))).toEqual(new Set(["input", "output", "tool"]));
    expect(guardrailValidators.map((validator) => validator.id)).toEqual([
      "prompt-injection",
      "pii-secret",
      "moderation",
      "off-topic",
      "structured-output",
      "tool-side-effect",
    ]);
  });

  it("keeps deterministic scenario outcomes and completion scenarios explicit", () => {
    expect(guardrailOutcomePriority).toEqual(["exception", "reask", "fix", "pass"]);
    expect(guardrailRequiredScenarioIds.every((id) => guardrailScenarios.some((scenario) => scenario.id === id))).toBe(true);
    expect(guardrailScenarios.find((scenario) => scenario.id === "safe-input")?.expectedOutcome).toBe("pass");
    expect(guardrailScenarios.find((scenario) => scenario.id === "pii-fix")?.expectedOutcome).toBe("fixed");
    expect(guardrailScenarios.find((scenario) => scenario.id === "tool-side-effect")?.expectedOutcome).toBe("blocked");
  });
});
