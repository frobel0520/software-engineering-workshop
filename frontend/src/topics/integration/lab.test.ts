import { describe, expect, it } from "vitest";
import { integrationRequiredScenarioIds } from "./content";
import { integrationLabProgress } from "./lab";
import { createInitialIntegrationState, runIntegrationEvents } from "./simulator";

describe("Integration Lab progress", () => {
  it("starts empty and counts terminal scenario outcomes", () => {
    expect(integrationLabProgress(createInitialIntegrationState())).toBe(0);

    const firstScenario = runIntegrationEvents([
      { type: "select-scenario", scenarioId: "create-order-success" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
    ]).state;

    expect(firstScenario.completedScenarioIds).toHaveLength(1);
    expect(integrationLabProgress(firstScenario)).toBe(33);
  });

  it("reaches 100 only after all required scenarios complete", () => {
    const result = runIntegrationEvents([
      { type: "select-scenario", scenarioId: "create-order-success" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "select-scenario", scenarioId: "response-contract-error" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "select-scenario", scenarioId: "repository-unavailable" },
      { type: "trace-next" },
      { type: "trace-next" },
      { type: "trace-next" },
    ]).state;

    expect(result.completedScenarioIds).toEqual(integrationRequiredScenarioIds);
    expect(integrationLabProgress(result)).toBe(100);
  });
});
