import { describe, expect, it } from "vitest";
import {
  createInitialIntegrationState,
  integrationSimulator,
  isIntegrationLabComplete,
  resetIntegrationLab,
  runIntegrationEvent,
  runIntegrationEvents,
  type IntegrationLabEvent,
} from "./simulator";

const selectSuccess: IntegrationLabEvent = { type: "select-scenario", scenarioId: "create-order-success" };
const selectContractFailure: IntegrationLabEvent = { type: "select-scenario", scenarioId: "response-contract-error" };
const selectDependencyFailure: IntegrationLabEvent = { type: "select-scenario", scenarioId: "repository-unavailable" };
const traceNext = (): IntegrationLabEvent => ({ type: "trace-next" });

function trace(count: number): IntegrationLabEvent[] {
  return Array.from({ length: count }, traceNext);
}

describe("Integration deterministic simulator", () => {
  it("requires a selected scenario before tracing", () => {
    const result = runIntegrationEvent(createInitialIntegrationState(), traceNext());

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.activeStageId).toBe("input");
    expect(result.state.lastMessage).toContain("選擇");
  });

  it("traces the success scenario across all four module boundaries", () => {
    const result = runIntegrationEvents([selectSuccess, ...trace(4)]);

    expect(result.accepted).toBe(true);
    expect(result.state.selectedScenarioId).toBe("create-order-success");
    expect(result.state.activeStageId).toBe("response");
    expect(result.state.visitedBoundaryIds).toEqual(["client", "service", "repository", "response"]);
    expect(result.state.response).toBe("success");
    expect(result.state.sideEffects).toBe("order-created");
    expect(result.state.completedScenarioIds).toEqual(["create-order-success"]);
    expect(result.state.phase).toBe("tracing");
  });

  it("blocks a skipped boundary and recovers when the required boundary is inspected", () => {
    const selected = runIntegrationEvent(createInitialIntegrationState(), selectSuccess).state;
    const skipped = runIntegrationEvent(selected, { type: "inspect-stage", stageId: "service" });

    expect(skipped.accepted).toBe(false);
    expect(skipped.state.phase).toBe("blocked");
    expect(skipped.state.visitedBoundaryIds).toEqual([]);
    expect(skipped.state.lastMessage).toContain("client");

    const recovered = runIntegrationEvent(skipped.state, { type: "inspect-stage", stageId: "client" });
    expect(recovered.accepted).toBe(true);
    expect(recovered.state.phase).toBe("tracing");
    expect(recovered.state.visitedBoundaryIds).toEqual(["client"]);
  });

  it("stops response contract failure at the response boundary without creating an order", () => {
    const result = runIntegrationEvents([selectContractFailure, ...trace(4)]);

    expect(result.accepted).toBe(true);
    expect(result.state.activeStageId).toBe("response");
    expect(result.state.visitedBoundaryIds).toEqual(["client", "service", "repository", "response"]);
    expect(result.state.response).toBe("contract-error");
    expect(result.state.sideEffects).toBe("none");
    expect(result.state.completedScenarioIds).toEqual(["response-contract-error"]);
    expect(result.state.lastMessage).toContain("orderId");
    expect(result.state.lastMessage).toContain("response");
  });

  it("preserves dependency failure at the repository boundary", () => {
    const result = runIntegrationEvents([selectDependencyFailure, ...trace(3)]);
    const repeated = runIntegrationEvent(result.state, traceNext());

    expect(result.accepted).toBe(true);
    expect(result.state.activeStageId).toBe("repository");
    expect(result.state.visitedBoundaryIds).toEqual(["client", "service", "repository"]);
    expect(result.state.response).toBe("dependency-unavailable");
    expect(result.state.sideEffects).toBe("none");
    expect(result.state.lastMessage).toContain("dependency-unavailable");
    expect(repeated.accepted).toBe(false);
    expect(repeated.state.activeStageId).toBe("repository");
  });

  it("completes all scenarios, stays deterministic, and resets exactly", () => {
    const events: IntegrationLabEvent[] = [
      selectSuccess,
      ...trace(4),
      selectContractFailure,
      ...trace(4),
      selectDependencyFailure,
      ...trace(3),
    ];
    const first = runIntegrationEvents(events);
    const second = runIntegrationEvents(events);

    expect(first.accepted).toBe(true);
    expect(isIntegrationLabComplete(first.state)).toBe(true);
    expect(first.state.completedScenarioIds).toEqual([
      "create-order-success",
      "response-contract-error",
      "repository-unavailable",
    ]);
    expect(second.state).toEqual(first.state);

    const afterComplete = runIntegrationEvent(first.state, traceNext());
    expect(afterComplete.accepted).toBe(false);
    expect(isIntegrationLabComplete(afterComplete.state)).toBe(true);
    expect(resetIntegrationLab()).toEqual(createInitialIntegrationState());
    expect(integrationSimulator.reset()).toEqual(createInitialIntegrationState());
  });
});
