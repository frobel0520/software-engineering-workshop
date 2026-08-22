import { describe, expect, it } from "vitest";
import { logsRequiredScenarioIds } from "./content";
import { logsLabProgress } from "./lab";
import { createInitialLogsState, runLogsEvents } from "./simulator";

function completeScenario(scenarioId: (typeof logsRequiredScenarioIds)[number]) {
  return [
    { type: "select-scenario" as const, scenarioId },
    { type: "inspect-event" as const, sequence: 1 },
    { type: "inspect-event" as const, sequence: 2 },
    { type: "verify-correlation" as const },
    { type: "verify-redaction" as const },
    { type: "verify-terminal" as const },
  ];
}

describe("Logs Lab progress", () => {
  it("starts empty and counts terminal scenario outcomes", () => {
    expect(logsLabProgress(createInitialLogsState())).toBe(0);

    const firstScenario = runLogsEvents(completeScenario("request-success")).state;

    expect(firstScenario.completedScenarioIds).toHaveLength(1);
    expect(logsLabProgress(firstScenario)).toBe(33);
  });

  it("reaches 100 only after all required scenarios complete", () => {
    const result = runLogsEvents(logsRequiredScenarioIds.flatMap(completeScenario)).state;

    expect(result.completedScenarioIds).toEqual(logsRequiredScenarioIds);
    expect(logsLabProgress(result)).toBe(100);
  });
});
