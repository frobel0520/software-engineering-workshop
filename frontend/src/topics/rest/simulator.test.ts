import { describe, expect, it } from "vitest";
import { restDatabaseFixture, restScenarios, restTraceStages, type RestLabEvent, type RestScenarioId } from "./content";
import { createInitialRestState, isRestLabComplete, runRestEvent, runRestEvents } from "./simulator";

function completeScenarioEvents(scenarioId: RestScenarioId): RestLabEvent[] {
  const scenario = restScenarios.find((item) => item.id === scenarioId) ?? restScenarios[0];
  const terminalIndex = restTraceStages.findIndex((stage) => stage.id === scenario.terminalStageId);
  return [
    { type: "select-scenario", scenarioId },
    { type: "start-request" },
    ...Array.from({ length: terminalIndex }, () => ({ type: "next-stage" } as const)),
  ];
}

describe("REST simulator", () => {
  it("runs POST through validation, database and a 201 response", () => {
    const state = runRestEvents(completeScenarioEvents("create-success"));

    expect(state.responseReady).toBe(true);
    expect(state.completedScenarioIds).toContain("create-success");
    expect(state.databaseItems).toContainEqual({ id: 3, name: "Keyboard", price: 1200 });
  });

  it("keeps repeated create requests deterministic instead of duplicating fixture rows", () => {
    const events = [...completeScenarioEvents("create-success"), ...completeScenarioEvents("create-success")];
    const state = runRestEvents(events);

    expect(state.databaseItems.filter((item) => item.id === 3)).toHaveLength(1);
  });

  it("stops invalid input at validation without changing the database", () => {
    const state = runRestEvents(completeScenarioEvents("validation-error"));

    expect(state.activeStageId).toBe("validation");
    expect(state.phase).toBe("error");
    expect(state.databaseItems).toEqual(restDatabaseFixture);
    expect(state.learnedStageIds).not.toContain("database");
  });

  it("distinguishes a successful SELECT from a missing resource", () => {
    const success = runRestEvents(completeScenarioEvents("read-success"));
    const missing = runRestEvents(completeScenarioEvents("not-found"));

    expect(success.lastMessage).toContain("200");
    expect(missing.lastMessage).toContain("404");
    expect(missing.databaseItems).toEqual(restDatabaseFixture);
  });

  it("rejects stages beyond a validation error terminal", () => {
    const started = runRestEvents([
      { type: "select-scenario", scenarioId: "validation-error" },
      { type: "start-request" },
    ]);
    const result = runRestEvent(started, { type: "inspect-stage", stageId: "database" });

    expect(result.accepted).toBe(false);
    expect(result.state.activeStageId).toBe("browser");
    expect(result.state.databaseItems).toEqual(restDatabaseFixture);
  });

  it("completes only after all requests and lifecycle stages", () => {
    const events = restScenarios.flatMap((scenario) => completeScenarioEvents(scenario.id));
    const state = runRestEvents(events);

    expect(isRestLabComplete(state)).toBe(true);
    expect(state.phase).toBe("completed");
    expect(state.completedScenarioIds).toHaveLength(4);
    expect(state.learnedStageIds).toHaveLength(7);
  });

  it("is deterministic and reset returns a deep-equal initial state", () => {
    const events = completeScenarioEvents("create-success");
    const first = runRestEvents(events);
    const second = runRestEvents(events);
    const reset = runRestEvent(first, { type: "reset" }).state;

    expect(first).toEqual(second);
    expect(reset).toEqual(createInitialRestState());
  });
});
