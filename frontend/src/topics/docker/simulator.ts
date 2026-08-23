import type { SimulatorDefinition } from "../types";
import {
  dockerFixture,
  dockerLessonSteps,
  dockerScenarioFixtures,
  type DockerScenarioId,
  type DockerStepId,
} from "./content";

export type DockerLabPhase = "initial" | "inspecting" | "building" | "running" | "blocked" | "completed";
export type DockerImageState = "absent" | "built";
export type DockerContainerState = "absent" | "running" | "stopped" | "removed";
export type DockerPortMapping = "absent" | "published" | "mismatched";
export type DockerProbeState = "pending" | "success" | "unreachable";
export type DockerEventType = DockerStepId | "select-scenario" | "repair-port" | "reset";

export interface DockerLabState {
  phase: DockerLabPhase;
  selectedScenarioId: DockerScenarioId | null;
  activeStepId: DockerStepId | null;
  completedStepIds: readonly DockerStepId[];
  imageState: DockerImageState;
  imageTag: string | null;
  imageDigest: string | null;
  containerState: DockerContainerState;
  portMapping: DockerPortMapping;
  probeState: DockerProbeState;
  probeStatus: number | null;
  cleanupComplete: boolean;
  completedScenarioIds: readonly DockerScenarioId[];
  happyPathBaselineSignature: string | null;
  happyPathReplaySignature: string | null;
  regressionVerified: boolean;
  resetSinceBaseline: boolean;
  resetCount: number;
  lastCommand: string | null;
  lastMessage: string;
  canReset: true;
}

export interface DockerLabEvent {
  type: DockerEventType;
  scenarioId?: DockerScenarioId;
}

export interface DockerEventResult {
  state: DockerLabState;
  output: readonly string[];
  accepted: boolean;
  observedFailure: boolean;
}

export interface DockerRunResult {
  state: DockerLabState;
  results: readonly DockerEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly DockerStepId[] = dockerLessonSteps.map((step) => step.id);
const scenarioIds: readonly DockerScenarioId[] = dockerScenarioFixtures.map((scenario) => scenario.id);

export const dockerStaticHappyPath: readonly DockerLabEvent[] = [
  { type: "select-scenario", scenarioId: "static-site-success" },
  { type: "inspect-context" },
  { type: "build-image" },
  { type: "run-container" },
  { type: "verify-probe" },
  { type: "cleanup-container" },
] as const;

function cloneState(state: DockerLabState): DockerLabState {
  return {
    ...state,
    completedStepIds: [...state.completedStepIds],
    completedScenarioIds: [...state.completedScenarioIds],
  };
}

function hasCompletedStep(state: DockerLabState, stepId: DockerStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: DockerLabState, stepId: DockerStepId): DockerStepId[] {
  return hasCompletedStep(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function withScenario(state: DockerLabState, scenarioId: DockerScenarioId): DockerScenarioId[] {
  return state.completedScenarioIds.includes(scenarioId)
    ? [...state.completedScenarioIds]
    : [...state.completedScenarioIds, scenarioId];
}

function selectedScenario(state: DockerLabState) {
  return dockerScenarioFixtures.find((scenario) => scenario.id === state.selectedScenarioId);
}

function commandFor(stepId: DockerStepId): string {
  return dockerLessonSteps.find((step) => step.id === stepId)?.command ?? stepId;
}

function accepted(
  state: DockerLabState,
  changes: Partial<DockerLabState>,
  message: string,
  output: readonly string[] = [message],
  observedFailure = false,
): DockerEventResult {
  return {
    state: { ...state, ...changes, lastMessage: message },
    output,
    accepted: true,
    observedFailure,
  };
}

function blocked(state: DockerLabState, command: string, message: string): DockerEventResult {
  return {
    state: { ...state, phase: "blocked", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
    observedFailure: false,
  };
}

function failed(state: DockerLabState, command: string, message: string): DockerEventResult {
  return {
    state: { ...state, phase: "blocked", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
    observedFailure: true,
  };
}

function observableSignature(state: DockerLabState): string {
  return [
    state.imageState,
    state.imageTag,
    state.imageDigest,
    state.containerState,
    state.portMapping,
    state.probeState,
    state.probeStatus,
    state.cleanupComplete,
  ].join("|");
}

function completeScenario(state: DockerLabState, scenarioId: DockerScenarioId): Partial<DockerLabState> {
  return {
    completedScenarioIds: withScenario(state, scenarioId),
    activeStepId: null,
  };
}

function completionAfterHappyPath(state: DockerLabState): Partial<DockerLabState> {
  const signature = observableSignature(state);
  const baseline = state.happyPathBaselineSignature;
  const replayed = Boolean(state.resetSinceBaseline && baseline && baseline === signature);
  return {
    happyPathBaselineSignature: baseline ?? signature,
    happyPathReplaySignature: replayed ? signature : state.happyPathReplaySignature,
    regressionVerified: state.regressionVerified || replayed,
  };
}

function isComplete(state: DockerLabState): boolean {
  return (
    state.phase === "completed" &&
    scenarioIds.every((scenarioId) => state.completedScenarioIds.includes(scenarioId)) &&
    state.regressionVerified &&
    state.selectedScenarioId === "static-site-success" &&
    state.imageState === "built" &&
    state.imageTag === dockerFixture.imageTag &&
    state.imageDigest === dockerFixture.imageDigest &&
    state.containerState === "removed" &&
    state.portMapping === "published" &&
    state.probeState === "success" &&
    state.probeStatus === dockerFixture.probeStatus &&
    state.cleanupComplete &&
    completionStepIds.every((stepId) => hasCompletedStep(state, stepId))
  );
}

export function createInitialDockerState(): DockerLabState {
  return {
    phase: "initial",
    selectedScenarioId: null,
    activeStepId: null,
    completedStepIds: [],
    imageState: "absent",
    imageTag: null,
    imageDigest: null,
    containerState: "absent",
    portMapping: "absent",
    probeState: "pending",
    probeStatus: null,
    cleanupComplete: false,
    completedScenarioIds: [],
    happyPathBaselineSignature: null,
    happyPathReplaySignature: null,
    regressionVerified: false,
    resetSinceBaseline: false,
    resetCount: 0,
    lastCommand: null,
    lastMessage: "請先選擇一個 Docker deterministic scenario。",
    canReset: true,
  };
}

export function resetDockerLab(previous?: DockerLabState): DockerLabState {
  if (!previous) return createInitialDockerState();

  return {
    ...createInitialDockerState(),
    completedScenarioIds: [...previous.completedScenarioIds],
    happyPathBaselineSignature: previous.happyPathBaselineSignature,
    happyPathReplaySignature: previous.happyPathReplaySignature,
    regressionVerified: previous.regressionVerified,
    resetSinceBaseline: previous.resetSinceBaseline || previous.happyPathBaselineSignature !== null,
    resetCount: previous.resetCount + 1,
    lastMessage: "Docker Lab 已重設；可以選擇下一個固定 scenario。",
  };
}

export function isDockerLabComplete(state: DockerLabState): boolean {
  return isComplete(state);
}

export function runDockerEvent(current: DockerLabState, event: DockerLabEvent): DockerEventResult {
  if (event.type === "reset") {
    return {
      state: resetDockerLab(current),
      output: ["Docker Lab 已重設；固定 image、container、port 與 probe state 已清除。"],
      accepted: true,
      observedFailure: false,
    };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "Docker Lab 已完成；如要重練，請先 reset。 ");
  }

  if (event.type === "select-scenario") {
    const scenario = dockerScenarioFixtures.find((candidate) => candidate.id === event.scenarioId);
    if (!scenario) return failed(current, "select-scenario", "請選擇一個有效的 Docker deterministic scenario。 ");
    if (current.selectedScenarioId && current.completedStepIds.length > 0) {
      return blocked(current, "select-scenario", "目前 scenario 尚未 reset；先完成或重設目前的 Docker flow。 ");
    }

    return accepted(
      current,
      {
        phase: "inspecting",
        selectedScenarioId: scenario.id,
        activeStepId: "inspect-context",
        completedStepIds: [],
        imageState: "absent",
        imageTag: null,
        imageDigest: null,
        containerState: "absent",
        portMapping: "absent",
        probeState: "pending",
        probeStatus: null,
        cleanupComplete: false,
        lastCommand: null,
      },
      `已選擇 ${scenario.id}；先檢查 Dockerfile 與 build context。`,
      [`scenario: ${scenario.id}`, `source artifact: ${dockerFixture.sourceArtifact}`, `context: ${dockerFixture.contextPath}`],
    );
  }

  const scenario = selectedScenario(current);
  if (!scenario) return blocked(current, event.type, "請先選擇 Docker scenario，再執行 command。 ");

  const state = cloneState(current);

  switch (event.type) {
    case "inspect-context":
      if (hasCompletedStep(state, "inspect-context")) {
        return blocked(state, commandFor(event.type), "context 已檢查；請依序進入下一個 Docker stage。 ");
      }
      return accepted(
        state,
        {
          phase: "building",
          activeStepId: "build-image",
          completedStepIds: withStep(state, "inspect-context"),
          lastCommand: commandFor(event.type),
        },
        "Dockerfile 與 dist/index.html 都在固定 build context；可以開始 build。",
        ["Dockerfile: found", "dist/index.html: found", "context: .", "next: docker build"],
      );
    case "build-image":
      if (!hasCompletedStep(state, "inspect-context")) {
        return blocked(state, commandFor(event.type), "請先檢查 Dockerfile 與 dist/index.html，再開始 image build。 ");
      }
      if (scenario.id === "missing-build-artifact") {
        const nextState: DockerLabState = {
          ...state,
          phase: "blocked",
          activeStepId: null,
          completedStepIds: withStep(state, "build-image"),
          imageState: "absent",
          imageTag: null,
          imageDigest: null,
          containerState: "absent",
          portMapping: "absent",
          probeState: "pending",
          lastCommand: commandFor(event.type),
          completedScenarioIds: withScenario(state, scenario.id),
          lastMessage: "COPY dist/ 找不到 dist/index.html；build 未產生 image，也未啟動 container。",
        };
        return {
          state: nextState,
          output: [
            "docker build -t workshop-web:1 .",
            "COPY failed: dist/index.html not found in build context",
            "image: absent",
            "container: not created",
            "scenario terminal outcome recorded; reset to continue",
          ],
          accepted: true,
          observedFailure: true,
        };
      }
      return accepted(
        state,
        {
          phase: "building",
          activeStepId: "run-container",
          completedStepIds: withStep(state, "build-image"),
          imageState: "built",
          imageTag: dockerFixture.imageTag,
          imageDigest: dockerFixture.imageDigest,
          lastCommand: commandFor(event.type),
        },
        "image build 成功；固定 tag 與 digest 已留下 evidence。",
        ["docker build: passed", `tag: ${dockerFixture.imageTag}`, `digest: ${dockerFixture.imageDigest}`, "image: built"],
      );
    case "run-container":
      if (!hasCompletedStep(state, "build-image") || state.imageState !== "built") {
        return blocked(state, commandFor(event.type), "image 尚未建立；請先完成 docker build，再啟動 container。 ");
      }
      return accepted(
        state,
        {
          phase: "running",
          activeStepId: "verify-probe",
          completedStepIds: withStep(state, "run-container"),
          containerState: "running",
          portMapping: scenario.id === "unpublished-container-port" ? "absent" : "published",
          lastCommand: commandFor(event.type),
        },
        scenario.id === "unpublished-container-port"
          ? "container 已 running，但這個 scenario 沒有 host port mapping；下一步用 probe 觀察差異。"
          : "container 已 running，host 8080 已發布到 container 80；可以開始 probe。",
        scenario.id === "unpublished-container-port"
          ? ["container: running", "EXPOSE: 80", "host mapping: absent", "next: curl probe"]
          : ["container: running", "port mapping: 8080→80", "next: curl probe"],
      );
    case "verify-probe":
      if (!hasCompletedStep(state, "run-container") || state.containerState !== "running") {
        return blocked(state, commandFor(event.type), "請先啟動 container，再從 host 執行 HTTP probe。 ");
      }
      if (state.portMapping !== "published") {
        return accepted(
          state,
          {
            phase: "blocked",
            activeStepId: "verify-probe",
            completedStepIds: withStep(state, "verify-probe"),
            probeState: "unreachable",
            probeStatus: null,
            lastCommand: commandFor(event.type),
          },
          "probe unreachable；container running 不等於 host port published，請先修正 -p 8080:80。",
          ["container: running", "host mapping: absent", "HTTP probe: unreachable", "next: repair port mapping"],
          true,
        );
      }
      return accepted(
        state,
        {
          phase: "running",
          activeStepId: "cleanup-container",
          completedStepIds: withStep(state, "verify-probe"),
          probeState: "success",
          probeStatus: dockerFixture.probeStatus,
          lastCommand: commandFor(event.type),
        },
        "host probe 回傳固定 HTTP 200；runtime verification 通過，可以 cleanup。",
        ["HTTP status: 200", `body marker: ${dockerFixture.bodyMarker}`, "probe: success", "next: stop and remove"],
      );
    case "repair-port":
      if (scenario.id !== "unpublished-container-port") {
        return blocked(state, "docker run --name workshop-web -p 8080:80 workshop-web:1", "只有 unpublished-container-port scenario 需要修正 host port mapping。 ");
      }
      if (state.containerState !== "running" || state.probeState !== "unreachable") {
        return blocked(state, "docker run --name workshop-web -p 8080:80 workshop-web:1", "請先觀察 running container 的 unreachable probe，再修正 port mapping。 ");
      }
      return accepted(
        state,
        {
          phase: "running",
          activeStepId: "verify-probe",
          portMapping: "published",
          probeState: "pending",
          probeStatus: null,
          lastMessage: "已補上 8080→80 mapping；重新執行固定 host probe。",
          lastCommand: "docker run --name workshop-web -p 8080:80 workshop-web:1",
        },
        "已補上 8080→80 mapping；重新執行固定 host probe。",
        ["EXPOSE 80: unchanged", "host mapping: 8080→80", "next: curl probe"],
      );
    case "cleanup-container":
      if (state.containerState !== "running" || state.probeState !== "success") {
        return blocked(state, commandFor(event.type), "請先讓 container running 並完成 HTTP probe，再執行 stop／remove cleanup。 ");
      }
      {
        const nextState: DockerLabState = {
          ...state,
          phase: "completed",
          activeStepId: null,
          completedStepIds: withStep(state, "cleanup-container"),
          containerState: "removed",
          cleanupComplete: true,
          lastCommand: commandFor(event.type),
          lastMessage: `${scenario.id} 已完成 cleanup；可以 reset 後練習下一個 scenario。`,
          ...completeScenario(state, scenario.id),
        };
        if (scenario.id === "static-site-success") {
          Object.assign(nextState, completionAfterHappyPath(nextState));
          if (nextState.regressionVerified && scenarioIds.every((scenarioId) => nextState.completedScenarioIds.includes(scenarioId))) {
            nextState.lastMessage = "三個 Docker scenario 與 reset regression 都完成；Docker Lab 完成。";
          }
        }
        return {
          state: nextState,
          output: ["docker stop workshop-web", "docker rm workshop-web", "container: removed", "cleanup: complete"],
          accepted: true,
          observedFailure: false,
        };
      }
    default:
      return failed(state, event.type, `不支援的 Docker event：${event.type}。`);
  }
}

export function runDockerEvents(
  events: readonly DockerLabEvent[],
  initialState: DockerLabState = createInitialDockerState(),
): DockerRunResult {
  let state = cloneState(initialState);
  const results: DockerEventResult[] = [];

  for (const event of events) {
    const result = runDockerEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}

export const dockerSimulator: SimulatorDefinition<DockerLabState, DockerLabEvent> = {
  createInitialState: createInitialDockerState,
  reduce: (state, event) => runDockerEvent(state, event).state,
  reset: createInitialDockerState,
};
