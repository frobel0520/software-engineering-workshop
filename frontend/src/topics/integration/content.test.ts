import { describe, expect, it } from "vitest";
import {
  findIntegrationScenario,
  integrationBoundaryFixtures,
  integrationCreateOrderInput,
  integrationFailureFixtures,
  integrationLesson,
  integrationLessonSteps,
  integrationRequiredScenarioIds,
  integrationResults,
  integrationScenarios,
  integrationSuccessfulResponse,
} from "./content";

describe("Integration lesson content", () => {
  it("answers the four orientation questions and covers the integration boundary", () => {
    expect(Object.values(integrationLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(integrationLesson.objectives).toHaveLength(5);
    expect(integrationLesson.sections.map((section) => section.id)).toEqual([
      "boundary",
      "fixture",
      "success",
      "contract-failure",
      "dependency-failure",
      "regression",
    ]);
  });

  it("maps every lesson step to a deterministic result table", () => {
    expect(integrationLessonSteps.map((step) => step.id)).toEqual([
      "define-boundary",
      "load-fixture",
      "trace-success",
      "read-contract-error",
      "propagate-dependency-failure",
      "run-regression",
    ]);
    expect(integrationLessonSteps.every((step) => step.code.length > 10 && step.takeaway.length > 15)).toBe(true);
    expect(Object.keys(integrationResults)).toHaveLength(integrationLessonSteps.length);
    expect(integrationBoundaryFixtures).toHaveLength(4);
    expect(integrationBoundaryFixtures.filter((boundary) => boundary.externalBoundary)).toHaveLength(1);
  });

  it("keeps the order fixture and successful response deterministic", () => {
    const subtotal = integrationCreateOrderInput.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );

    expect(subtotal - integrationCreateOrderInput.discount).toBe(integrationSuccessfulResponse.total);
    expect(integrationSuccessfulResponse).toEqual({ orderId: "ord-001", total: 90, status: "created" });
    expect(integrationRequiredScenarioIds).toEqual([
      "create-order-success",
      "response-contract-error",
      "repository-unavailable",
    ]);
    expect(findIntegrationScenario("create-order-success").trace.map((observation) => observation.boundary)).toEqual([
      "client",
      "service",
      "repository",
      "response",
    ]);
  });

  it("separates contract failure from dependency failure", () => {
    const contractFailure = findIntegrationScenario("response-contract-error");
    const dependencyFailure = findIntegrationScenario("repository-unavailable");

    expect(contractFailure.repositoryResult).toEqual({ kind: "success", response: { total: 90, status: "created" } });
    expect(contractFailure.expected).toMatchObject({
      kind: "contract-error",
      failureBoundary: "response",
      sideEffect: "none",
    });
    expect(dependencyFailure.repositoryResult).toMatchObject({
      kind: "dependency-unavailable",
      errorCode: "dependency-unavailable",
    });
    expect(dependencyFailure.expected).toMatchObject({
      kind: "dependency-unavailable",
      failureBoundary: "repository",
      sideEffect: "none",
    });
    expect(integrationFailureFixtures).toHaveLength(2);
    expect(integrationFailureFixtures.every((fixture) => fixture.message.length > 20 && fixture.evidence.length > 20)).toBe(true);
  });
});
