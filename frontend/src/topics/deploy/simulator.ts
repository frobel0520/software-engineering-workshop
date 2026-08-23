import type { SimulatorDefinition } from "../types";
import {
  deployFixture,
  deployLessonSteps,
  deployScenarioFixtures,
  type DeployArtifactState,
  type DeployBasePathState,
  type DeployDeploymentState,
  type DeployReleaseRecord,
  type DeployScenarioId,
  type DeployStageId,
} from "./content";

export type DeployLabPhase = "initial" | "inspecting" | "releasing" | "blocked" | "completed";
export type DeployEventType = DeployStageId | "select-scenario" | "reset";
export type DeployWorkflowState = "unknown" | "inspected";
export type DeployCiState = "pending" | "passed" | "failed";
export type DeployPublishState = "pending" | "published" | "blocked";

export interface DeployLabState {
  phase: DeployLabPhase;
  selectedScenarioId: DeployScenarioId | null;
  activeStageId: DeployStageId | null;
  completedStageIds: readonly DeployStageId[];
  releaseSource: "main" | null;
  candidateVersion: string | null;
  previousVerifiedVersion: string;
  workflowState: DeployWorkflowState;
  ciState: DeployCiState;
  artifactState: DeployArtifactState;
  basePathState: DeployBasePathState;
  publishState: DeployPublishState;
  pagesBranchVersion: string;
  deploymentState: DeployDeploymentState;
  liveStatus: number | null;
  liveUrl: string | null;
  releaseRecord: DeployReleaseRecord;
  rollbackVersion: string | null;
  completedScenarioIds: readonly DeployScenarioId[];
  regressionBaselineSignature: string | null;
  regressionReplaySignature: string | null;
  regressionVerified: boolean;
  resetSinceBaseline: boolean;
  resetCount: number;
  lastFeedback: string;
  lastCommand: string | null;
  canReset: true;
}

export interface DeployLabEvent {
  type: DeployEventType;
  scenarioId?: DeployScenarioId;
}

export interface DeployEventResult {
  state: DeployLabState;
  output: readonly string[];
  accepted: boolean;
  observedFailure: boolean;
}

export interface DeployRunResult {
  state: DeployLabState;
  results: readonly DeployEventResult[];
  accepted: boolean;
}

const stageIds: readonly DeployStageId[] = deployLessonSteps.map((step) => step.id);
const scenarioIds: readonly DeployScenarioId[] = deployScenarioFixtures.map((scenario) => scenario.id);

export const deployGreenHappyPath: readonly DeployLabEvent[] = [
  { type: "select-scenario", scenarioId: "main-pages-success" },
  { type: "inspect-workflow" },
  { type: "select-release" },
  { type: "verify-ci-artifact" },
  { type: "verify-pages-base" },
  { type: "publish-pages" },
  { type: "verify-deployment" },
  { type: "record-release" },
  { type: "evaluate-release" },
] as const;

function cloneState(state: DeployLabState): DeployLabState {
  return {
    ...state,
    completedStageIds: [...state.completedStageIds],
    completedScenarioIds: [...state.completedScenarioIds],
  };
}

function hasCompletedStage(state: DeployLabState, stageId: DeployStageId): boolean {
  return state.completedStageIds.includes(stageId);
}

function withStage(state: DeployLabState, stageId: DeployStageId): DeployStageId[] {
  return hasCompletedStage(state, stageId) ? [...state.completedStageIds] : [...state.completedStageIds, stageId];
}

function withScenario(state: DeployLabState, scenarioId: DeployScenarioId): DeployScenarioId[] {
  return state.completedScenarioIds.includes(scenarioId)
    ? [...state.completedScenarioIds]
    : [...state.completedScenarioIds, scenarioId];
}

function selectedScenario(state: DeployLabState) {
  return deployScenarioFixtures.find((scenario) => scenario.id === state.selectedScenarioId);
}

function commandFor(stageId: DeployStageId): string {
  return deployLessonSteps.find((step) => step.id === stageId)?.command ?? stageId;
}

function accepted(
  state: DeployLabState,
  changes: Partial<DeployLabState>,
  message: string,
  output: readonly string[] = [message],
  observedFailure = false,
): DeployEventResult {
  return {
    state: { ...state, ...changes, lastFeedback: message },
    output,
    accepted: true,
    observedFailure,
  };
}

function blocked(state: DeployLabState, command: string, message: string): DeployEventResult {
  return {
    state: { ...state, phase: "blocked", lastCommand: command, lastFeedback: message },
    output: [message],
    accepted: false,
    observedFailure: false,
  };
}

function failed(state: DeployLabState, command: string, message: string): DeployEventResult {
  return {
    state: { ...state, phase: "blocked", lastCommand: command, lastFeedback: message },
    output: [message],
    accepted: false,
    observedFailure: true,
  };
}

function observableSignature(state: DeployLabState): string {
  return [
    state.releaseSource,
    state.candidateVersion,
    state.artifactState,
    state.basePathState,
    state.publishState,
    state.pagesBranchVersion,
    state.deploymentState,
    state.liveStatus,
    state.releaseRecord,
    state.rollbackVersion,
  ].join("|");
}

function completeScenario(state: DeployLabState, scenarioId: DeployScenarioId): Partial<DeployLabState> {
  return {
    completedScenarioIds: withScenario(state, scenarioId),
    activeStageId: null,
  };
}

function completionAfterGreen(state: DeployLabState): Partial<DeployLabState> {
  const signature = observableSignature(state);
  const baseline = state.regressionBaselineSignature;
  const replayed = Boolean(state.resetSinceBaseline && baseline && baseline === signature);
  return {
    regressionBaselineSignature: baseline ?? signature,
    regressionReplaySignature: replayed ? signature : state.regressionReplaySignature,
    regressionVerified: state.regressionVerified || replayed,
    resetSinceBaseline: false,
  };
}

export function createInitialDeployState(): DeployLabState {
  return {
    phase: "initial",
    selectedScenarioId: null,
    activeStageId: null,
    completedStageIds: [],
    releaseSource: null,
    candidateVersion: null,
    previousVerifiedVersion: deployFixture.currentVerifiedRelease,
    workflowState: "unknown",
    ciState: "pending",
    artifactState: "missing",
    basePathState: "unknown",
    publishState: "pending",
    pagesBranchVersion: deployFixture.currentVerifiedRelease,
    deploymentState: "pending",
    liveStatus: null,
    liveUrl: null,
    releaseRecord: "none",
    rollbackVersion: null,
    completedScenarioIds: [],
    regressionBaselineSignature: null,
    regressionReplaySignature: null,
    regressionVerified: false,
    resetSinceBaseline: false,
    resetCount: 0,
    lastFeedback: "請先選擇一個 deployment scenario。",
    lastCommand: null,
    canReset: true,
  };
}

export function resetDeployLab(previous?: DeployLabState): DeployLabState {
  if (!previous) return createInitialDeployState();

  return {
    ...createInitialDeployState(),
    completedScenarioIds: [...previous.completedScenarioIds],
    regressionBaselineSignature: previous.regressionBaselineSignature,
    regressionReplaySignature: previous.regressionReplaySignature,
    regressionVerified: previous.regressionVerified,
    resetSinceBaseline: previous.resetSinceBaseline || previous.regressionBaselineSignature !== null,
    resetCount: previous.resetCount + 1,
    lastFeedback: "Deploy Lab 已重設；可以選擇下一個 release scenario。",
  };
}

export function isDeployLabComplete(state: DeployLabState): boolean {
  return state.regressionVerified && scenarioIds.every((scenarioId) => state.completedScenarioIds.includes(scenarioId));
}

export function runDeployEvent(current: DeployLabState, event: DeployLabEvent): DeployEventResult {
  if (event.type === "reset") {
    return {
      state: resetDeployLab(current),
      output: ["Deploy Lab 已重設；workflow、artifact、Pages pointer、probe 與 release state 已清除。"],
      accepted: true,
      observedFailure: false,
    };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "Deploy Lab 已完成；如要重練，請先 reset。 ");
  }

  if (event.type === "select-scenario") {
    const scenario = deployScenarioFixtures.find((candidate) => candidate.id === event.scenarioId);
    if (!scenario) return failed(current, "select-scenario", "請選擇一個有效的 deployment scenario。 ");
    if (current.selectedScenarioId && current.completedStageIds.length > 0) {
      return blocked(current, "select-scenario", "目前 scenario 尚未 reset；先完成或重設目前的 release flow。 ");
    }

    return accepted(
      current,
      {
        phase: "inspecting",
        selectedScenarioId: scenario.id,
        activeStageId: "inspect-workflow",
        completedStageIds: [],
        releaseSource: null,
        candidateVersion: scenario.candidateVersion,
        previousVerifiedVersion: scenario.previousVerifiedVersion,
        workflowState: "unknown",
        ciState: "pending",
        artifactState: "missing",
        basePathState: "unknown",
        publishState: "pending",
        pagesBranchVersion: scenario.previousVerifiedVersion,
        deploymentState: "pending",
        liveStatus: null,
        liveUrl: null,
        releaseRecord: "none",
        rollbackVersion: null,
        lastCommand: null,
      },
      `已選擇 ${scenario.id}；先 inspect deploy workflow 與 Pages publish boundary。`,
      [`scenario: ${scenario.id}`, `workflow: ${deployFixture.workflowName}`, `pages branch: ${deployFixture.pagesBranch}`],
    );
  }

  const scenario = selectedScenario(current);
  if (!scenario) return blocked(current, event.type, "請先選擇 deployment scenario，再執行 release stage。 ");

  const state = cloneState(current);

  switch (event.type) {
    case "inspect-workflow":
      if (hasCompletedStage(state, event.type)) return blocked(state, commandFor(event.type), "deploy workflow 已 inspect；請依序選擇 main release。 ");
      return accepted(
        state,
        { phase: "releasing", activeStageId: "select-release", completedStageIds: withStage(state, event.type), workflowState: "inspected", lastCommand: commandFor(event.type) },
        "已確認 main trigger、workflow_dispatch、frontend/dist 與 gh-pages；可以選擇 release source。",
        ["trigger: push(main) / workflow_dispatch", `artifact: ${deployFixture.artifactPath}`, `publish branch: ${deployFixture.pagesBranch}`],
      );
    case "select-release":
      if (!hasCompletedStage(state, "inspect-workflow")) return blocked(state, commandFor(event.type), "請先 inspect deploy workflow，再選擇 release source。 ");
      return accepted(
        state,
        { phase: "releasing", activeStageId: "verify-ci-artifact", completedStageIds: withStage(state, event.type), releaseSource: scenario.releaseSource, candidateVersion: scenario.candidateVersion, lastCommand: commandFor(event.type) },
        `已選擇 ${scenario.releaseSource} → ${scenario.candidateVersion}；可以驗證 CI artifact。`,
        [`source: ${scenario.releaseSource}`, `candidate: ${scenario.candidateVersion}`, `previous verified: ${scenario.previousVerifiedVersion}`],
      );
    case "verify-ci-artifact":
      if (!hasCompletedStage(state, "select-release") || state.releaseSource !== "main") return blocked(state, commandFor(event.type), "請先選擇 main release，再驗證 CI artifact。 ");
      if (scenario.artifactOutcome === "missing") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "record-release", completedStageIds: withStage(state, event.type), ciState: scenario.ciOutcome, artifactState: "missing", publishState: "blocked", deploymentState: "failed", lastCommand: commandFor(event.type) },
          "frontend/dist missing；gh-pages 保持上一個 verified version，publish blocked。",
          ["CI: passed", "artifact: frontend/dist missing", `gh-pages: ${scenario.previousVerifiedVersion}`, "next: record blocked release"],
          true,
        );
      }
      return accepted(
        state,
        { phase: "releasing", activeStageId: "verify-pages-base", completedStageIds: withStage(state, event.type), ciState: scenario.ciOutcome, artifactState: "verified", lastCommand: commandFor(event.type) },
        "CI passed、frontend/dist 已 verified；可以檢查 Pages base path。",
        ["CI: passed", "artifact: frontend/dist verified", "provenance: main / CI", "next: verify VITE_BASE"],
      );
    case "verify-pages-base":
      if (!hasCompletedStage(state, "verify-ci-artifact") || state.artifactState !== "verified") return blocked(state, commandFor(event.type), "artifact 尚未 verified；先確認 frontend/dist，再檢查 Pages base path。 ");
      if (scenario.basePathOutcome === "mismatch") {
        return accepted(
          state,
          {
            phase: "blocked",
            activeStageId: "record-release",
            completedStageIds: withStage(state, event.type),
            basePathState: "mismatch",
            publishState: "blocked",
            pagesBranchVersion: scenario.previousVerifiedVersion,
            deploymentState: "failed",
            lastCommand: commandFor(event.type),
          },
          "VITE_BASE 與 repository path 不一致；publish blocked，Pages pointer 保持上一個 verified version。",
          [`VITE_BASE: mismatch`, `expected: ${deployFixture.repositoryBasePath}`, "publish: blocked", `gh-pages: ${scenario.previousVerifiedVersion}`, "next: record blocked release"],
          true,
        );
      }
      return accepted(
        state,
        { phase: "releasing", activeStageId: "publish-pages", completedStageIds: withStage(state, event.type), basePathState: scenario.basePathOutcome, lastCommand: commandFor(event.type) },
        "VITE_BASE 與 repository path 一致；candidate artifact 可以發布到 gh-pages。",
        [`VITE_BASE: ${deployFixture.repositoryBasePath}`, "base path: verified", "next: publish gh-pages"],
      );
    case "publish-pages":
      if (!hasCompletedStage(state, "verify-pages-base") || state.basePathState !== "verified") return blocked(state, commandFor(event.type), "Pages base path 尚未 verified；不能安全更新 gh-pages。 ");
      return accepted(
        state,
        { phase: "releasing", activeStageId: "verify-deployment", completedStageIds: withStage(state, event.type), publishState: scenario.publishOutcome, pagesBranchVersion: scenario.candidateVersion, lastCommand: commandFor(event.type) },
        "candidate artifact 已 publish 到 gh-pages；接著執行 live probe。",
        [`publish: ${deployFixture.artifactPath} → ${deployFixture.pagesBranch}`, `gh-pages: ${scenario.candidateVersion}`, "next: probe live URL"],
      );
    case "verify-deployment":
      if (!hasCompletedStage(state, "publish-pages") || state.publishState !== "published") return blocked(state, commandFor(event.type), "candidate 尚未 publish；不能執行 live deployment probe。 ");
      if (scenario.deploymentOutcome === "rolled-back") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "record-release", completedStageIds: withStage(state, event.type), deploymentState: "failed", liveStatus: 503, liveUrl: `${deployFixture.repositoryBasePath}__candidate__`, lastCommand: commandFor(event.type) },
          "live probe failed；保留 candidate failed evidence，record 後必須 rollback。",
          [`probe: ${deployFixture.repositoryBasePath} → 503`, `candidate: ${scenario.candidateVersion}`, "deployment: failed", "next: record failed release"],
          true,
        );
      }
      return accepted(
        state,
        { phase: "releasing", activeStageId: "record-release", completedStageIds: withStage(state, event.type), deploymentState: "live", liveStatus: scenario.liveStatus, liveUrl: deployFixture.repositoryBasePath, lastCommand: commandFor(event.type) },
        "live probe status 200；candidate version 可被觀測，可以記錄 verified release。",
        [`probe: ${deployFixture.repositoryBasePath} → ${scenario.liveStatus}`, `version: ${scenario.candidateVersion}`, "deployment: live", "next: record release"],
      );
    case "record-release":
      if (!hasCompletedStage(state, "verify-ci-artifact")) return blocked(state, commandFor(event.type), "至少要先驗證 CI artifact，再建立 release record。 ");
      if (state.basePathState === "mismatch") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "evaluate-release", completedStageIds: withStage(state, event.type), releaseRecord: "blocked", liveStatus: null, liveUrl: null, pagesBranchVersion: state.previousVerifiedVersion, lastCommand: commandFor(event.type) },
          "blocked release record 已保留 base path mismatch；candidate 不可發布，下一步是評估 release outcome。",
          [`source: ${state.releaseSource}`, `candidate: ${state.candidateVersion}`, "base path: mismatch", "record: blocked", "next: evaluate release"],
          true,
        );
      }
      if (state.artifactState === "missing") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "evaluate-release", completedStageIds: withStage(state, event.type), releaseRecord: "blocked", liveStatus: null, liveUrl: null, pagesBranchVersion: state.previousVerifiedVersion, lastCommand: commandFor(event.type) },
          "blocked release record 已保留 artifact missing；可以評估 release outcome。",
          [`source: ${state.releaseSource}`, `candidate: ${state.candidateVersion}`, "artifact: missing", "record: blocked", "next: evaluate release"],
          true,
        );
      }
      if (!hasCompletedStage(state, "verify-deployment")) return blocked(state, commandFor(event.type), "先完成 live probe，再建立完整 release record。 ");
      if (state.deploymentState === "failed") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "evaluate-release", completedStageIds: withStage(state, event.type), releaseRecord: "failed", lastCommand: commandFor(event.type) },
          "failed release record 已保存；candidate 不可標記 verified，下一步是 rollback。",
          [`source: ${state.releaseSource}`, `candidate: ${state.candidateVersion}`, "probe: failed", "record: failed", "next: evaluate release / rollback"],
          true,
        );
      }
      return accepted(
        state,
        { phase: "releasing", activeStageId: "evaluate-release", completedStageIds: withStage(state, event.type), releaseRecord: "verified", lastCommand: commandFor(event.type) },
        "verified release record 已保存；可以評估 release outcome。",
        [`source: ${state.releaseSource}`, `version: ${state.candidateVersion}`, `artifact: ${deployFixture.artifactPath}`, `url: ${state.liveUrl}`, "record: verified"],
      );
    case "evaluate-release": {
      if (!hasCompletedStage(state, "record-release") || state.releaseRecord === "none") return blocked(state, commandFor(event.type), "請先建立 release record，再評估 verified 或 rollback outcome。 ");
      if (state.releaseRecord === "blocked") {
        const nextState: DeployLabState = {
          ...state,
          phase: "completed",
          activeStageId: null,
          completedStageIds: withStage(state, event.type),
          publishState: "blocked",
          pagesBranchVersion: state.previousVerifiedVersion,
          deploymentState: "failed",
          liveStatus: null,
          liveUrl: null,
          lastCommand: commandFor(event.type),
          lastFeedback: `${scenario.id} release blocked；Pages pointer 保持 ${state.previousVerifiedVersion}。`,
          ...completeScenario(state, scenario.id),
        };
        return { state: nextState, output: ["release record: blocked", `gh-pages: ${state.previousVerifiedVersion}`, "deployment: not published"], accepted: true, observedFailure: true };
      }
      if (state.releaseRecord === "failed") {
        const nextState: DeployLabState = {
          ...state,
          phase: "completed",
          activeStageId: null,
          completedStageIds: withStage(state, event.type),
          pagesBranchVersion: state.previousVerifiedVersion,
          deploymentState: "rolled-back",
          liveStatus: 200,
          liveUrl: deployFixture.repositoryBasePath,
          releaseRecord: "rolled-back",
          rollbackVersion: state.previousVerifiedVersion,
          lastCommand: commandFor(event.type),
          lastFeedback: `${scenario.id} rollback 完成；Pages pointer 回到 ${state.previousVerifiedVersion}。`,
          ...completeScenario(state, scenario.id),
        };
        return { state: nextState, output: [`failed release: ${state.candidateVersion}`, `rollback: ${state.previousVerifiedVersion}`, "live probe: 200", "release record: rolled-back"], accepted: true, observedFailure: true };
      }
      const nextState: DeployLabState = {
        ...state,
        phase: "completed",
        activeStageId: null,
        completedStageIds: withStage(state, event.type),
        deploymentState: "live",
        lastCommand: commandFor(event.type),
        lastFeedback: `${scenario.id} release 完成；${state.candidateVersion} verified 且可觀測。`,
        ...completeScenario(state, scenario.id),
      };
      Object.assign(nextState, completionAfterGreen(nextState));
      if (nextState.regressionVerified && scenarioIds.every((scenarioId) => nextState.completedScenarioIds.includes(scenarioId))) {
        nextState.lastFeedback = "三個 Deploy scenario 與 reset regression 都完成；Deploy Lab 完成。";
      }
      return { state: nextState, output: [`release: ${state.candidateVersion}`, "status: verified", "deployment: live", "release pipeline: completed"], accepted: true, observedFailure: false };
    }
    default:
      return failed(state, event.type, `不支援的 deployment event：${event.type}。`);
  }
}

export function runDeployEvents(
  events: readonly DeployLabEvent[],
  initialState: DeployLabState = createInitialDeployState(),
): DeployRunResult {
  let state = cloneState(initialState);
  const results: DeployEventResult[] = [];

  for (const event of events) {
    const result = runDeployEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}

export const deploySimulator: SimulatorDefinition<DeployLabState, DeployLabEvent> = {
  createInitialState: createInitialDeployState,
  reduce: (state, event) => runDeployEvent(state, event).state,
  reset: createInitialDeployState,
};
