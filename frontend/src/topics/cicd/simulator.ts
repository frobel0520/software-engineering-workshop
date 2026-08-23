import type { SimulatorDefinition } from "../types";
import {
  cicdFixture,
  cicdLessonSteps,
  cicdScenarioFixtures,
  type CicdScenarioId,
  type CicdStageId,
  type CicdStepOutcome,
  type CicdTargetRef,
  type CicdTriggerEvent,
} from "./content";

export type CicdLabPhase = "initial" | "inspecting" | "running" | "blocked" | "completed";
export type CicdWorkflowState = "unknown" | "inspected";
export type CicdEventType = CicdStageId | "select-scenario" | "reset";
export type CicdRequiredCheck = "pending" | "passed" | "failed";
export type CicdMergeGate = "pending" | "mergeable" | "blocked";

export interface CicdLabState {
  phase: CicdLabPhase;
  selectedScenarioId: CicdScenarioId | null;
  activeStageId: CicdStageId | null;
  completedStageIds: readonly CicdStageId[];
  triggerEvent: CicdTriggerEvent | null;
  targetRef: CicdTargetRef | null;
  workflowState: CicdWorkflowState;
  installState: CicdStepOutcome;
  testState: CicdStepOutcome;
  lintState: CicdStepOutcome;
  buildState: CicdStepOutcome;
  artifactState: "missing" | "created";
  requiredCheck: CicdRequiredCheck;
  mergeGate: CicdMergeGate;
  completedScenarioIds: readonly CicdScenarioId[];
  regressionBaselineSignature: string | null;
  regressionReplaySignature: string | null;
  regressionVerified: boolean;
  resetSinceBaseline: boolean;
  resetCount: number;
  lastFeedback: string;
  lastCommand: string | null;
  canReset: true;
}

export interface CicdLabEvent {
  type: CicdEventType;
  scenarioId?: CicdScenarioId;
}

export interface CicdEventResult {
  state: CicdLabState;
  output: readonly string[];
  accepted: boolean;
  observedFailure: boolean;
}

export interface CicdRunResult {
  state: CicdLabState;
  results: readonly CicdEventResult[];
  accepted: boolean;
}

const stageIds: readonly CicdStageId[] = cicdLessonSteps.map((step) => step.id);
const scenarioIds: readonly CicdScenarioId[] = cicdScenarioFixtures.map((scenario) => scenario.id);

export const cicdGreenHappyPath: readonly CicdLabEvent[] = [
  { type: "select-scenario", scenarioId: "pull-request-green" },
  { type: "inspect-workflow" },
  { type: "select-trigger" },
  { type: "checkout-source" },
  { type: "install-dependencies" },
  { type: "run-test" },
  { type: "run-lint" },
  { type: "run-build" },
  { type: "publish-required-check" },
  { type: "evaluate-merge-gate" },
] as const;

function cloneState(state: CicdLabState): CicdLabState {
  return {
    ...state,
    completedStageIds: [...state.completedStageIds],
    completedScenarioIds: [...state.completedScenarioIds],
  };
}

function hasCompletedStage(state: CicdLabState, stageId: CicdStageId): boolean {
  return state.completedStageIds.includes(stageId);
}

function withStage(state: CicdLabState, stageId: CicdStageId): CicdStageId[] {
  return hasCompletedStage(state, stageId) ? [...state.completedStageIds] : [...state.completedStageIds, stageId];
}

function withScenario(state: CicdLabState, scenarioId: CicdScenarioId): CicdScenarioId[] {
  return state.completedScenarioIds.includes(scenarioId)
    ? [...state.completedScenarioIds]
    : [...state.completedScenarioIds, scenarioId];
}

function selectedScenario(state: CicdLabState) {
  return cicdScenarioFixtures.find((scenario) => scenario.id === state.selectedScenarioId);
}

function commandFor(stageId: CicdStageId): string {
  return cicdLessonSteps.find((step) => step.id === stageId)?.command ?? stageId;
}

function accepted(
  state: CicdLabState,
  changes: Partial<CicdLabState>,
  message: string,
  output: readonly string[] = [message],
  observedFailure = false,
): CicdEventResult {
  return {
    state: { ...state, ...changes, lastFeedback: message },
    output,
    accepted: true,
    observedFailure,
  };
}

function blocked(state: CicdLabState, command: string, message: string): CicdEventResult {
  return {
    state: { ...state, phase: "blocked", lastCommand: command, lastFeedback: message },
    output: [message],
    accepted: false,
    observedFailure: false,
  };
}

function failed(state: CicdLabState, command: string, message: string): CicdEventResult {
  return {
    state: { ...state, phase: "blocked", lastCommand: command, lastFeedback: message },
    output: [message],
    accepted: false,
    observedFailure: true,
  };
}

function outcomeSignature(state: CicdLabState): string {
  return [
    state.triggerEvent,
    state.targetRef,
    state.workflowState,
    state.installState,
    state.testState,
    state.lintState,
    state.buildState,
    state.artifactState,
    state.requiredCheck,
    state.mergeGate,
  ].join("|");
}

function completeScenario(state: CicdLabState, scenarioId: CicdScenarioId): Partial<CicdLabState> {
  return {
    completedScenarioIds: withScenario(state, scenarioId),
    activeStageId: null,
  };
}

function completionAfterGreen(state: CicdLabState): Partial<CicdLabState> {
  const signature = outcomeSignature(state);
  const baseline = state.regressionBaselineSignature;
  const replayed = Boolean(state.resetSinceBaseline && baseline && baseline === signature);
  return {
    regressionBaselineSignature: baseline ?? signature,
    regressionReplaySignature: replayed ? signature : state.regressionReplaySignature,
    regressionVerified: state.regressionVerified || replayed,
  };
}

function isComplete(state: CicdLabState): boolean {
  return (
    state.phase === "completed" &&
    scenarioIds.every((scenarioId) => state.completedScenarioIds.includes(scenarioId)) &&
    state.regressionVerified &&
    state.selectedScenarioId === "pull-request-green" &&
    state.triggerEvent === "pull_request" &&
    state.targetRef === "dev" &&
    state.workflowState === "inspected" &&
    state.installState === "passed" &&
    state.testState === "passed" &&
    state.lintState === "passed" &&
    state.buildState === "passed" &&
    state.artifactState === "created" &&
    state.requiredCheck === "passed" &&
    state.mergeGate === "mergeable" &&
    stageIds.every((stageId) => hasCompletedStage(state, stageId))
  );
}

export function createInitialCicdState(): CicdLabState {
  return {
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
    regressionBaselineSignature: null,
    regressionReplaySignature: null,
    regressionVerified: false,
    resetSinceBaseline: false,
    resetCount: 0,
    lastFeedback: "請先選擇一個 CI/CD deterministic scenario。",
    lastCommand: null,
    canReset: true,
  };
}

export function resetCicdLab(previous?: CicdLabState): CicdLabState {
  if (!previous) return createInitialCicdState();

  return {
    ...createInitialCicdState(),
    completedScenarioIds: [...previous.completedScenarioIds],
    regressionBaselineSignature: previous.regressionBaselineSignature,
    regressionReplaySignature: previous.regressionReplaySignature,
    regressionVerified: previous.regressionVerified,
    resetSinceBaseline: previous.resetSinceBaseline || previous.regressionBaselineSignature !== null,
    resetCount: previous.resetCount + 1,
    lastFeedback: "CI/CD Lab 已重設；可以選擇下一個固定 pipeline scenario。",
  };
}

export function isCicdLabComplete(state: CicdLabState): boolean {
  return isComplete(state);
}

export function runCicdEvent(current: CicdLabState, event: CicdLabEvent): CicdEventResult {
  if (event.type === "reset") {
    return {
      state: resetCicdLab(current),
      output: ["CI/CD Lab 已重設；workflow、step、check 與 merge state 已清除。"],
      accepted: true,
      observedFailure: false,
    };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "CI/CD Lab 已完成；如要重練，請先 reset。 ");
  }

  if (event.type === "select-scenario") {
    const scenario = cicdScenarioFixtures.find((candidate) => candidate.id === event.scenarioId);
    if (!scenario) return failed(current, "select-scenario", "請選擇一個有效的 CI/CD deterministic scenario。 ");
    if (current.selectedScenarioId && current.completedStageIds.length > 0) {
      return blocked(current, "select-scenario", "目前 scenario 尚未 reset；先完成或重設目前的 pipeline flow。 ");
    }

    return accepted(
      current,
      {
        phase: "inspecting",
        selectedScenarioId: scenario.id,
        activeStageId: "inspect-workflow",
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
        lastCommand: null,
      },
      `已選擇 ${scenario.id}；先 inspect CI workflow 與 required check。`,
      [`scenario: ${scenario.id}`, `workflow: ${cicdFixture.workflowName}`, `job: ${cicdFixture.jobId}`],
    );
  }

  const scenario = selectedScenario(current);
  if (!scenario) return blocked(current, event.type, "請先選擇 CI/CD scenario，再執行 pipeline stage。 ");

  const state = cloneState(current);

  switch (event.type) {
    case "inspect-workflow":
      if (hasCompletedStage(state, event.type)) return blocked(state, commandFor(event.type), "workflow 已 inspect；請依序選擇 trigger。 ");
      return accepted(
        state,
        { phase: "running", activeStageId: "select-trigger", completedStageIds: withStage(state, event.type), workflowState: "inspected", lastCommand: commandFor(event.type) },
        "已確認 CI workflow、frontend job 與 required check；可以選擇 pipeline input。",
        ["workflow: CI", "job: frontend", "required check: frontend", "triggers: push / pull_request / workflow_dispatch"],
      );
    case "select-trigger":
      if (!hasCompletedStage(state, "inspect-workflow")) return blocked(state, commandFor(event.type), "請先 inspect workflow，再選擇 event 與 target ref。 ");
      return accepted(
        state,
        { phase: "running", activeStageId: "checkout-source", completedStageIds: withStage(state, event.type), triggerEvent: scenario.triggerEvent, targetRef: scenario.targetRef, lastCommand: commandFor(event.type) },
        `已選擇 ${scenario.triggerEvent} → ${scenario.targetRef}；source checkout 可以開始。`,
        [`event: ${scenario.triggerEvent}`, `base ref: ${scenario.targetRef}`, `required check owner: ${cicdFixture.requiredCheck}`],
      );
    case "checkout-source":
      if (!hasCompletedStage(state, "select-trigger")) return blocked(state, commandFor(event.type), "請先選擇 trigger 與 target ref，再 checkout source。 ");
      return accepted(
        state,
        { phase: "running", activeStageId: "install-dependencies", completedStageIds: withStage(state, event.type), lastCommand: commandFor(event.type) },
        "fixture source ref 已 checkout；可以建立依賴安裝 context。",
        [`source ref: ${cicdFixture.sourceRef}`, "checkout: passed", "next: npm ci"],
      );
    case "install-dependencies":
      if (!hasCompletedStage(state, "checkout-source")) return blocked(state, commandFor(event.type), "請先 checkout source，再執行 npm ci。 ");
      return accepted(
        state,
        { phase: "running", activeStageId: "run-test", completedStageIds: withStage(state, event.type), installState: scenario.installOutcome, lastCommand: commandFor(event.type) },
        "Node 22、npm cache 與 lockfile context 已準備；可以執行 test。",
        [`node: ${cicdFixture.nodeVersion}`, `cache: ${cicdFixture.cacheDependencyPath}`, "npm ci: passed", "next: npm test"],
      );
    case "run-test":
      if (!hasCompletedStage(state, "install-dependencies") || state.installState !== "passed") return blocked(state, commandFor(event.type), "請先完成 npm ci，再執行 test gate。 ");
      if (scenario.testOutcome === "failed") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "publish-required-check", completedStageIds: withStage(state, event.type), testState: "failed", artifactState: "missing", lastCommand: commandFor(event.type) },
          "npm test failed；lint 與 build 維持 not-run，required check 後續會 blocked。",
          ["npm test: failed", "failure boundary: behavior gate", "lint: not-run", "build: not-run", "next: publish required check"],
          true,
        );
      }
      return accepted(
        state,
        { phase: "running", activeStageId: "run-lint", completedStageIds: withStage(state, event.type), testState: "passed", lastCommand: commandFor(event.type) },
        "npm test passed；可以進入 TypeScript lint gate。",
        ["npm test: passed", "test failures: 0", "next: npm run lint"],
      );
    case "run-lint":
      if (!hasCompletedStage(state, "run-test") || state.testState !== "passed") return blocked(state, commandFor(event.type), "test 尚未 passed；lint 必須保留在 not-run，先處理 behavior gate。 ");
      return accepted(
        state,
        { phase: "running", activeStageId: "run-build", completedStageIds: withStage(state, event.type), lintState: scenario.lintOutcome, lastCommand: commandFor(event.type) },
        "TypeScript lint passed；可以驗證 production build。",
        ["npm run lint: passed", "type errors: 0", "next: npm run build"],
      );
    case "run-build":
      if (!hasCompletedStage(state, "run-lint") || state.lintState !== "passed") return blocked(state, commandFor(event.type), "lint 尚未 passed；build 維持 not-run，先完成 TypeScript gate。 ");
      if (scenario.buildOutcome === "failed") {
        return accepted(
          state,
          { phase: "blocked", activeStageId: "publish-required-check", completedStageIds: withStage(state, event.type), buildState: "failed", artifactState: "missing", lastCommand: commandFor(event.type) },
          "npm run build failed；test／lint 雖通過，但 production artifact missing。",
          ["npm test: passed", "npm run lint: passed", "npm run build: failed", "artifact: missing", "next: publish required check"],
          true,
        );
      }
      return accepted(
        state,
        { phase: "running", activeStageId: "publish-required-check", completedStageIds: withStage(state, event.type), buildState: "passed", artifactState: "created", lastCommand: commandFor(event.type) },
        "production build passed；dist artifact 已建立，可以發布 required check。",
        ["npm run build: passed", "artifact: dist/ created", "next: frontend required check"],
      );
    case "publish-required-check": {
      const hasFailure = [state.installState, state.testState, state.lintState, state.buildState].includes("failed");
      if (!hasCompletedStage(state, "run-test")) return blocked(state, commandFor(event.type), "至少要先執行 test gate，才能彙總 required check。 ");
      if (!hasFailure && !hasCompletedStage(state, "run-build")) return blocked(state, commandFor(event.type), "test、lint、build 尚未全部完成，不能提前發布 required check。 ");
      const requiredCheck = hasFailure ? "failed" : "passed";
      return accepted(
        state,
        { phase: "running", activeStageId: "evaluate-merge-gate", completedStageIds: withStage(state, event.type), requiredCheck, lastCommand: commandFor(event.type) },
        requiredCheck === "passed" ? "frontend required check passed；可以評估 merge gate。" : "frontend required check failed；merge gate 只能保持 blocked。",
        [`check: ${cicdFixture.requiredCheck}`, `status: ${requiredCheck}`, "next: evaluate merge gate"],
        requiredCheck === "failed",
      );
    }
    case "evaluate-merge-gate": {
      if (!hasCompletedStage(state, "publish-required-check") || state.requiredCheck === "pending") return blocked(state, commandFor(event.type), "請先發布 frontend required check，再評估 merge gate。 ");
      const mergeGate = state.requiredCheck === "passed" ? "mergeable" : "blocked";
      const nextState: CicdLabState = {
        ...state,
        phase: "completed",
        activeStageId: null,
        completedStageIds: withStage(state, event.type),
        mergeGate,
        lastCommand: commandFor(event.type),
        lastFeedback: mergeGate === "mergeable"
          ? `${scenario.id} pipeline 完成；required check passed，PR mergeable。`
          : `${scenario.id} pipeline 完成；required check failed，merge gate blocked。`,
        ...completeScenario(state, scenario.id),
      };
      if (scenario.id === "pull-request-green") {
        Object.assign(nextState, completionAfterGreen(nextState));
        if (nextState.regressionVerified && scenarioIds.every((scenarioId) => nextState.completedScenarioIds.includes(scenarioId))) {
          nextState.lastFeedback = "三個 CI/CD scenario 與 reset regression 都完成；CI/CD Lab 完成。";
        }
      }
      return {
        state: nextState,
        output: mergeGate === "mergeable"
          ? ["required check: frontend passed", "merge gate: mergeable", "pipeline: completed"]
          : ["required check: frontend failed", "merge gate: blocked", "pipeline: completed with failure evidence"],
        accepted: true,
        observedFailure: mergeGate === "blocked",
      };
    }
    default:
      return failed(state, event.type, `不支援的 CI/CD event：${event.type}。`);
  }
}

export function runCicdEvents(
  events: readonly CicdLabEvent[],
  initialState: CicdLabState = createInitialCicdState(),
): CicdRunResult {
  let state = cloneState(initialState);
  const results: CicdEventResult[] = [];

  for (const event of events) {
    const result = runCicdEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}

export const cicdSimulator: SimulatorDefinition<CicdLabState, CicdLabEvent> = {
  createInitialState: createInitialCicdState,
  reduce: (state, event) => runCicdEvent(state, event).state,
  reset: createInitialCicdState,
};
