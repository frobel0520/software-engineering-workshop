import { describe, expect, it } from "vitest";
import { restScenarios, restTraceStages } from "./content";
import { restLabProgress } from "./lab";
import { createInitialRestState, runRestEvents } from "./simulator";

describe("REST Lab progress", () => {
  it("starts at zero and reaches 100 only with all scenarios and stages", () => {
    const completed = {
      ...createInitialRestState(),
      completedScenarioIds: restScenarios.map((scenario) => scenario.id),
      learnedStageIds: restTraceStages.map((stage) => stage.id),
    };

    expect(restLabProgress(createInitialRestState())).toBe(0);
    expect(restLabProgress(completed)).toBe(100);
  });

  it("keeps partial work visible", () => {
    const partial = runRestEvents([{ type: "start-request" }, { type: "next-stage" }]);
    expect(restLabProgress(partial)).toBeGreaterThan(0);
    expect(restLabProgress(partial)).toBeLessThan(100);
  });
});
