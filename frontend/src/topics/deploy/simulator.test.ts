import { describe, expect, it } from "vitest";
import {
  createInitialDeployState,
  deployGreenHappyPath,
  deploySimulator,
  isDeployLabComplete,
  resetDeployLab,
  runDeployEvent,
  runDeployEvents,
} from "./simulator";

const missingArtifactPath = [
  { type: "select-scenario" as const, scenarioId: "missing-artifact-blocked" as const },
  { type: "inspect-workflow" as const },
  { type: "select-release" as const },
  { type: "verify-ci-artifact" as const },
  { type: "record-release" as const },
  { type: "evaluate-release" as const },
];

const basePathMismatchPath = [
  { type: "select-scenario" as const, scenarioId: "base-path-mismatch-blocked" as const },
  { type: "inspect-workflow" as const },
  { type: "select-release" as const },
  { type: "verify-ci-artifact" as const },
  { type: "verify-pages-base" as const },
  { type: "record-release" as const },
  { type: "evaluate-release" as const },
];

const rollbackPath = [
  { type: "select-scenario" as const, scenarioId: "rollback-after-probe-failure" as const },
  { type: "inspect-workflow" as const },
  { type: "select-release" as const },
  { type: "verify-ci-artifact" as const },
  { type: "verify-pages-base" as const },
  { type: "publish-pages" as const },
  { type: "verify-deployment" as const },
  { type: "record-release" as const },
  { type: "evaluate-release" as const },
];

describe("Deploy deterministic simulator", () => {
  it("starts with no release, artifact, Pages publish, or live state", () => {
    expect(createInitialDeployState()).toMatchObject({
      phase: "initial",
      selectedScenarioId: null,
      activeStageId: null,
      completedStageIds: [],
      releaseSource: null,
      candidateVersion: null,
      workflowState: "unknown",
      ciState: "pending",
      artifactState: "missing",
      basePathState: "unknown",
      publishState: "pending",
      pagesBranchVersion: "release-2026.08.16",
      deploymentState: "pending",
      liveStatus: null,
      releaseRecord: "none",
      rollbackVersion: null,
      completedScenarioIds: [],
      regressionVerified: false,
      resetCount: 0,
      canReset: true,
    });
  });

  it("completes the green Pages release but not the full topic", () => {
    const result = runDeployEvents(deployGreenHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      selectedScenarioId: "main-pages-success",
      releaseSource: "main",
      candidateVersion: "release-2026.08.23",
      artifactState: "verified",
      basePathState: "verified",
      publishState: "published",
      pagesBranchVersion: "release-2026.08.23",
      deploymentState: "live",
      liveStatus: 200,
      releaseRecord: "verified",
      completedScenarioIds: ["main-pages-success"],
      regressionVerified: false,
    });
    expect(result.state.completedStageIds).toHaveLength(8);
    expect(isDeployLabComplete(result.state)).toBe(false);
  });

  it("blocks out-of-order release stages without fabricating artifact or Pages state", () => {
    const noScenario = runDeployEvent(createInitialDeployState(), { type: "publish-pages" });
    expect(noScenario.accepted).toBe(false);
    expect(noScenario.state.phase).toBe("blocked");

    const selected = runDeployEvent(createInitialDeployState(), { type: "select-scenario", scenarioId: "main-pages-success" }).state;
    const publishBeforeWorkflow = runDeployEvent(selected, { type: "publish-pages" });
    expect(publishBeforeWorkflow.accepted).toBe(false);
    expect(publishBeforeWorkflow.state.publishState).toBe("pending");
    expect(publishBeforeWorkflow.state.pagesBranchVersion).toBe("release-2026.08.16");
  });

  it("keeps the Pages pointer on the previous version when artifact is missing", () => {
    const result = runDeployEvents(missingArtifactPath);

    expect(result.accepted).toBe(true);
    expect(result.results[3]?.observedFailure).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      artifactState: "missing",
      publishState: "blocked",
      pagesBranchVersion: "release-2026.08.16",
      deploymentState: "failed",
      liveStatus: null,
      releaseRecord: "blocked",
      completedScenarioIds: ["missing-artifact-blocked"],
    });
  });

  it("blocks publish and preserves the previous Pages pointer on base path mismatch", () => {
    const result = runDeployEvents(basePathMismatchPath);

    expect(result.accepted).toBe(true);
    expect(result.results[4]?.observedFailure).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      artifactState: "verified",
      basePathState: "mismatch",
      publishState: "blocked",
      pagesBranchVersion: "release-2026.08.16",
      deploymentState: "failed",
      liveStatus: null,
      releaseRecord: "blocked",
      completedScenarioIds: ["base-path-mismatch-blocked"],
    });
    expect(result.state.lastFeedback).toContain("blocked");
  });

  it("preserves failed candidate evidence and rolls back after probe failure", () => {
    const result = runDeployEvents(rollbackPath);

    expect(result.accepted).toBe(true);
    expect(result.results[6]?.observedFailure).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      artifactState: "verified",
      publishState: "published",
      pagesBranchVersion: "release-2026.08.16",
      deploymentState: "rolled-back",
      liveStatus: 200,
      releaseRecord: "rolled-back",
      rollbackVersion: "release-2026.08.16",
      completedScenarioIds: ["rollback-after-probe-failure"],
    });
    expect(result.state.lastFeedback).toContain("rollback");
  });

  it("requires all scenarios and a deterministic green replay before completion", () => {
    const fullFlow = [
      ...deployGreenHappyPath,
      { type: "reset" as const },
      ...missingArtifactPath,
      { type: "reset" as const },
      ...basePathMismatchPath,
      { type: "reset" as const },
      ...rollbackPath,
      { type: "reset" as const },
      ...deployGreenHappyPath,
    ];
    const first = runDeployEvents(fullFlow);
    const second = runDeployEvents(fullFlow);

    expect(first.accepted).toBe(true);
    expect(first.state).toEqual(second.state);
    expect(first.state.completedScenarioIds).toEqual([
      "main-pages-success",
      "missing-artifact-blocked",
      "base-path-mismatch-blocked",
      "rollback-after-probe-failure",
    ]);
    expect(first.state.regressionVerified).toBe(true);
    expect(first.state.regressionReplaySignature).toBe(first.state.regressionBaselineSignature);
    expect(isDeployLabComplete(first.state)).toBe(true);
  });

  it("resets release state while keeping completed scenario audit", () => {
    const green = runDeployEvents(deployGreenHappyPath).state;
    const reset = resetDeployLab(green);

    expect(reset).toMatchObject({
      phase: "initial",
      selectedScenarioId: null,
      completedStageIds: [],
      workflowState: "unknown",
      artifactState: "missing",
      publishState: "pending",
      pagesBranchVersion: "release-2026.08.16",
      releaseRecord: "none",
      completedScenarioIds: ["main-pages-success"],
      resetSinceBaseline: true,
      resetCount: 1,
    });
    expect(resetDeployLab()).toEqual(createInitialDeployState());
    expect(deploySimulator.reset()).toEqual(createInitialDeployState());
  });
});
