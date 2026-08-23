import { describe, expect, it } from "vitest";
import {
  cicdGreenHappyPath,
  cicdSimulator,
  createInitialCicdState,
  isCicdLabComplete,
  resetCicdLab,
  runCicdEvent,
  runCicdEvents,
} from "./simulator";

const testFailurePath = [
  { type: "select-scenario" as const, scenarioId: "pull-request-test-failure" as const },
  { type: "inspect-workflow" as const },
  { type: "select-trigger" as const },
  { type: "checkout-source" as const },
  { type: "install-dependencies" as const },
  { type: "run-test" as const },
  { type: "publish-required-check" as const },
  { type: "evaluate-merge-gate" as const },
];

const buildFailurePath = [
  { type: "select-scenario" as const, scenarioId: "pull-request-build-failure" as const },
  { type: "inspect-workflow" as const },
  { type: "select-trigger" as const },
  { type: "checkout-source" as const },
  { type: "install-dependencies" as const },
  { type: "run-test" as const },
  { type: "run-lint" as const },
  { type: "run-build" as const },
  { type: "publish-required-check" as const },
  { type: "evaluate-merge-gate" as const },
];

describe("CI/CD deterministic simulator", () => {
  it("starts with no workflow, trigger, gate, or scenario state", () => {
    expect(createInitialCicdState()).toMatchObject({
      phase: "initial",
      selectedScenarioId: null,
      activeStageId: null,
      completedStageIds: [],
      triggerEvent: null,
      targetRef: null,
      workflowState: "unknown",
      installState: "not-run",
      testState: "not-run",
      lintState: "not-run",
      buildState: "not-run",
      artifactState: "missing",
      requiredCheck: "pending",
      mergeGate: "pending",
      completedScenarioIds: [],
      regressionVerified: false,
      resetCount: 0,
      canReset: true,
    });
  });

  it("completes the green pull request pipeline but not the full topic", () => {
    const result = runCicdEvents(cicdGreenHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      selectedScenarioId: "pull-request-green",
      triggerEvent: "pull_request",
      targetRef: "dev",
      workflowState: "inspected",
      installState: "passed",
      testState: "passed",
      lintState: "passed",
      buildState: "passed",
      artifactState: "created",
      requiredCheck: "passed",
      mergeGate: "mergeable",
      completedScenarioIds: ["pull-request-green"],
      regressionVerified: false,
    });
    expect(result.state.completedStageIds).toHaveLength(9);
    expect(isCicdLabComplete(result.state)).toBe(false);
  });

  it("blocks out-of-order stages without fabricating downstream results", () => {
    const noScenario = runCicdEvent(createInitialCicdState(), { type: "run-test" });
    expect(noScenario.accepted).toBe(false);
    expect(noScenario.state.phase).toBe("blocked");

    const selected = runCicdEvent(createInitialCicdState(), { type: "select-scenario", scenarioId: "pull-request-green" }).state;
    const buildBeforeWorkflow = runCicdEvent(selected, { type: "run-build" });
    expect(buildBeforeWorkflow.accepted).toBe(false);
    expect(buildBeforeWorkflow.state.buildState).toBe("not-run");

    const beforeInstall = runCicdEvents([
      { type: "inspect-workflow" as const },
      { type: "select-trigger" as const },
      { type: "checkout-source" as const },
    ], selected).state;
    const testBeforeInstall = runCicdEvent(beforeInstall, { type: "run-test" });
    expect(testBeforeInstall.accepted).toBe(false);
    expect(testBeforeInstall.state.testState).toBe("not-run");
  });

  it("stops test failure at the behavior gate and leaves lint/build not-run", () => {
    const beforeCheck = runCicdEvents(testFailurePath.slice(0, 6));

    expect(beforeCheck.accepted).toBe(true);
    expect(beforeCheck.results.at(-1)?.observedFailure).toBe(true);
    expect(beforeCheck.state).toMatchObject({
      phase: "blocked",
      testState: "failed",
      lintState: "not-run",
      buildState: "not-run",
      artifactState: "missing",
      requiredCheck: "pending",
      mergeGate: "pending",
    });
    expect(beforeCheck.state.lastFeedback).toContain("not-run");

    const completed = runCicdEvents(testFailurePath, beforeCheck.state);
    expect(completed.state).toMatchObject({
      phase: "completed",
      requiredCheck: "failed",
      mergeGate: "blocked",
      completedScenarioIds: ["pull-request-test-failure"],
    });
  });

  it("preserves test/lint success when build fails", () => {
    const result = runCicdEvents(buildFailurePath);

    expect(result.accepted).toBe(true);
    expect(result.results[7]?.observedFailure).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      testState: "passed",
      lintState: "passed",
      buildState: "failed",
      artifactState: "missing",
      requiredCheck: "failed",
      mergeGate: "blocked",
      completedScenarioIds: ["pull-request-build-failure"],
    });
  });

  it("requires all scenarios and a deterministic green replay before completion", () => {
    const fullFlow = [
      ...cicdGreenHappyPath,
      { type: "reset" as const },
      ...testFailurePath,
      { type: "reset" as const },
      ...buildFailurePath,
      { type: "reset" as const },
      ...cicdGreenHappyPath,
    ];
    const first = runCicdEvents(fullFlow);
    const second = runCicdEvents(fullFlow);

    expect(first.accepted).toBe(true);
    expect(first.state).toEqual(second.state);
    expect(first.state.completedScenarioIds).toEqual([
      "pull-request-green",
      "pull-request-test-failure",
      "pull-request-build-failure",
    ]);
    expect(first.state.regressionVerified).toBe(true);
    expect(first.state.regressionReplaySignature).toBe(first.state.regressionBaselineSignature);
    expect(isCicdLabComplete(first.state)).toBe(true);
  });

  it("resets pipeline state while keeping completed scenario audit", () => {
    const green = runCicdEvents(cicdGreenHappyPath).state;
    const reset = resetCicdLab(green);

    expect(reset).toMatchObject({
      phase: "initial",
      selectedScenarioId: null,
      completedStageIds: [],
      workflowState: "unknown",
      installState: "not-run",
      requiredCheck: "pending",
      mergeGate: "pending",
      completedScenarioIds: ["pull-request-green"],
      resetSinceBaseline: true,
      resetCount: 1,
    });
    expect(resetCicdLab()).toEqual(createInitialCicdState());
    expect(cicdSimulator.reset()).toEqual(createInitialCicdState());
  });
});
