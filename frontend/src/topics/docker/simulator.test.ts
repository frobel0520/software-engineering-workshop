import { describe, expect, it } from "vitest";
import {
  createInitialDockerState,
  dockerSimulator,
  dockerStaticHappyPath,
  isDockerLabComplete,
  resetDockerLab,
  runDockerEvent,
  runDockerEvents,
} from "./simulator";

const missingArtifactPath = [
  { type: "select-scenario" as const, scenarioId: "missing-build-artifact" as const },
  { type: "inspect-context" as const },
  { type: "build-image" as const },
];

const unpublishedPortPath = [
  { type: "select-scenario" as const, scenarioId: "unpublished-container-port" as const },
  { type: "inspect-context" as const },
  { type: "build-image" as const },
  { type: "run-container" as const },
  { type: "verify-probe" as const },
  { type: "repair-port" as const },
  { type: "verify-probe" as const },
  { type: "cleanup-container" as const },
];

describe("Docker deterministic simulator", () => {
  it("starts without a selected scenario or real runtime state", () => {
    const state = createInitialDockerState();

    expect(state).toMatchObject({
      phase: "initial",
      selectedScenarioId: null,
      activeStepId: null,
      completedStepIds: [],
      imageState: "absent",
      containerState: "absent",
      portMapping: "absent",
      probeState: "pending",
      cleanupComplete: false,
      completedScenarioIds: [],
      regressionVerified: false,
      resetCount: 0,
      canReset: true,
    });
  });

  it("completes the static-site happy path with image, port, probe, and cleanup evidence", () => {
    const result = runDockerEvents(dockerStaticHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({
      phase: "completed",
      selectedScenarioId: "static-site-success",
      imageState: "built",
      imageTag: "workshop-web:1",
      imageDigest: "sha256:docker-fixture-001",
      containerState: "removed",
      portMapping: "published",
      probeState: "success",
      probeStatus: 200,
      cleanupComplete: true,
      completedScenarioIds: ["static-site-success"],
      regressionVerified: false,
    });
    expect(result.state.completedStepIds).toEqual([
      "inspect-context",
      "build-image",
      "run-container",
      "verify-probe",
      "cleanup-container",
    ]);
    expect(isDockerLabComplete(result.state)).toBe(false);
  });

  it("blocks commands that cross a Docker boundary out of order", () => {
    const noScenario = runDockerEvent(createInitialDockerState(), { type: "build-image" });
    expect(noScenario.accepted).toBe(false);
    expect(noScenario.state.phase).toBe("blocked");
    expect(noScenario.state.imageState).toBe("absent");

    const selected = runDockerEvent(createInitialDockerState(), { type: "select-scenario", scenarioId: "static-site-success" }).state;
    const runBeforeBuild = runDockerEvent(selected, { type: "run-container" });
    expect(runBeforeBuild.accepted).toBe(false);
    expect(runBeforeBuild.state.containerState).toBe("absent");

    const inspected = runDockerEvent(selected, { type: "inspect-context" }).state;
    const probeBeforeRun = runDockerEvent(inspected, { type: "verify-probe" });
    expect(probeBeforeRun.accepted).toBe(false);
    expect(probeBeforeRun.state.probeState).toBe("pending");
  });

  it("records missing-build-artifact at the COPY boundary without side effects", () => {
    const result = runDockerEvents(missingArtifactPath);

    expect(result.accepted).toBe(true);
    expect(result.results.at(-1)?.observedFailure).toBe(true);
    expect(result.state).toMatchObject({
      phase: "blocked",
      imageState: "absent",
      imageTag: null,
      imageDigest: null,
      containerState: "absent",
      portMapping: "absent",
      probeState: "pending",
      completedScenarioIds: ["missing-build-artifact"],
    });
    expect(result.state.lastMessage).toContain("COPY dist/");
  });

  it("preserves running evidence for an unpublished port, then supports repair and regression", () => {
    const beforeRepair = runDockerEvents(unpublishedPortPath.slice(0, 5));
    expect(beforeRepair.accepted).toBe(true);
    expect(beforeRepair.results.at(-1)?.observedFailure).toBe(true);
    expect(beforeRepair.state).toMatchObject({
      phase: "blocked",
      containerState: "running",
      portMapping: "absent",
      probeState: "unreachable",
      completedScenarioIds: [],
    });

    const completed = runDockerEvents(unpublishedPortPath, beforeRepair.state);
    expect(completed.state).toMatchObject({
      phase: "completed",
      containerState: "removed",
      portMapping: "published",
      probeState: "success",
      cleanupComplete: true,
      completedScenarioIds: ["unpublished-container-port"],
    });
  });

  it("requires all scenarios and a deterministic reset replay before completion", () => {
    const fullFlow = [
      ...dockerStaticHappyPath,
      { type: "reset" as const },
      ...missingArtifactPath,
      { type: "reset" as const },
      ...unpublishedPortPath,
      { type: "reset" as const },
      ...dockerStaticHappyPath,
    ];
    const first = runDockerEvents(fullFlow);
    const second = runDockerEvents(fullFlow);

    expect(first.accepted).toBe(true);
    expect(first.state).toEqual(second.state);
    expect(first.state.completedScenarioIds).toEqual([
      "static-site-success",
      "missing-build-artifact",
      "unpublished-container-port",
    ]);
    expect(first.state.regressionVerified).toBe(true);
    expect(first.state.happyPathReplaySignature).toBe(first.state.happyPathBaselineSignature);
    expect(isDockerLabComplete(first.state)).toBe(true);
  });

  it("resets current runtime state while keeping scenario audit deterministic", () => {
    const completedStatic = runDockerEvents(dockerStaticHappyPath).state;
    const reset = resetDockerLab(completedStatic);

    expect(reset).toMatchObject({
      phase: "initial",
      selectedScenarioId: null,
      activeStepId: null,
      completedStepIds: [],
      imageState: "absent",
      containerState: "absent",
      portMapping: "absent",
      probeState: "pending",
      cleanupComplete: false,
      completedScenarioIds: ["static-site-success"],
      resetSinceBaseline: true,
      resetCount: 1,
    });
    expect(resetDockerLab()).toEqual(createInitialDockerState());
    expect(dockerSimulator.reset()).toEqual(createInitialDockerState());
  });
});
