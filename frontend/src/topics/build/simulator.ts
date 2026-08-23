import type { SimulatorDefinition } from "../../topics/types";
import {
  buildLabHappyPath,
  buildLabInitialState,
  type BuildLabEvent,
  type BuildLabState,
  type BuildStepId,
} from "./content";

export interface BuildEventResult {
  state: BuildLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface BuildRunResult {
  state: BuildLabState;
  results: readonly BuildEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly BuildStepId[] = buildLabHappyPath
  .map((event) => event.type)
  .filter((event): event is BuildStepId => event !== "reset");

function cloneState(state: BuildLabState): BuildLabState {
  return { ...state, completedStepIds: [...state.completedStepIds] };
}

function hasCompleted(state: BuildLabState, stepId: BuildStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: BuildLabState, stepId: BuildStepId): BuildStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function isComplete(state: BuildLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.typecheckState === "passed" &&
    state.bundleState === "created" &&
    state.artifactState === "verified" &&
    state.previewState === "running" &&
    state.basePath === "/software-engineering-workshop/"
  );
}

function accepted(
  current: BuildLabState,
  changes: Partial<BuildLabState>,
  message: string,
  output: readonly string[] = [message],
): BuildEventResult {
  return {
    state: { ...current, ...changes, phase: "active", lastMessage: message },
    output,
    accepted: true,
  };
}

function blocked(current: BuildLabState, command: string, message: string): BuildEventResult {
  return {
    state: { ...current, phase: "blocked", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
  };
}

function failed(current: BuildLabState, command: string, message: string): BuildEventResult {
  return {
    state: { ...current, phase: "failed", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
  };
}

export function createInitialBuildState(): BuildLabState {
  return cloneState(buildLabInitialState);
}

export function resetBuildLab(): BuildLabState {
  return createInitialBuildState();
}

export function isBuildLabComplete(state: BuildLabState): boolean {
  return isComplete(state);
}

export function runBuildEvent(current: BuildLabState, event: BuildLabEvent): BuildEventResult {
  if (event.type === "reset") {
    return { state: resetBuildLab(), output: ["BUILD Lab 已重設，可以重新開始。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "BUILD Lab 已完成；如要重練，請先 reset。");
  }

  const state = cloneState(current);

  switch (event.type) {
    case "inspect-scripts":
      return accepted(
        state,
        { selectedFile: "package-json", completedStepIds: withStep(state, "inspect-scripts"), lastCommand: "cat package.json" },
        "已確認 lint、build、preview 三個 script 的責任分界。",
        ["lint: tsc --noEmit", "build: tsc -b && vite build", "preview: vite preview"],
      );
    case "typecheck":
      if (!hasCompleted(state, "inspect-scripts")) {
        return blocked(state, "npm run lint", "請先檢查 package.json，再執行 TypeScript gate。 ");
      }
      return accepted(
        state,
        { typecheckState: "passed", completedStepIds: withStep(state, "typecheck"), lastCommand: "npm run lint" },
        "TypeScript gate 已通過；可以進入 production bundle。",
        ["tsc --noEmit", "type errors: 0", "gate: passed"],
      );
    case "bundle":
      if (!hasCompleted(state, "typecheck") || state.typecheckState !== "passed") {
        return blocked(state, "npm run build", "請先通過 TypeScript gate，再產出 production bundle。 ");
      }
      return accepted(
        state,
        {
          selectedFile: "dist",
          bundleState: "created",
          basePath: "/software-engineering-workshop/",
          completedStepIds: withStep(state, "bundle"),
          lastCommand: "VITE_BASE=/software-engineering-workshop/ npm run build",
        },
        "production bundle 已產生，並套用 GitHub Pages base path。",
        ["tsc -b: passed", "vite build: passed", "base: /software-engineering-workshop/", "output: dist/"],
      );
    case "inspect-dist":
      if (!hasCompleted(state, "bundle") || state.bundleState !== "created") {
        return blocked(state, "ls dist", "dist 尚未產生；請先執行 production build。 ");
      }
      return accepted(
        state,
        { artifactState: "verified", completedStepIds: withStep(state, "inspect-dist"), lastCommand: "ls dist" },
        "已確認 dist artifact 包含入口與 hashed assets，可以交給 static host。",
        ["index.html", "assets/index-[hash].js", "assets/index-[hash].css", "artifact: verified"],
      );
    case "preview": {
      if (!hasCompleted(state, "inspect-dist") || state.artifactState !== "verified") {
        return blocked(state, "npm run preview", "請先檢查 dist artifact，再啟動 preview。 ");
      }
      const nextState: BuildLabState = {
        ...state,
        phase: "completed",
        previewState: "running",
        lastCommand: "npm run preview",
        completedStepIds: withStep(state, "preview"),
        lastMessage: "正式 artifact 已在 preview 中載入；BUILD Lab 完成。",
      };
      return { state: nextState, output: ["vite preview", "serving dist/", "BUILD Lab completed"], accepted: true };
    }
    default: {
      return failed(state, event.type, `不支援的 build event：${event.type}。`);
    }
  }
}

export const buildSimulator: SimulatorDefinition<BuildLabState, BuildLabEvent> = {
  createInitialState: createInitialBuildState,
  reduce: (state, event) => runBuildEvent(state, event).state,
  reset: resetBuildLab,
};

export function runBuildEvents(
  events: readonly BuildLabEvent[],
  initialState: BuildLabState = createInitialBuildState(),
): BuildRunResult {
  let state = cloneState(initialState);
  const results: BuildEventResult[] = [];

  for (const event of events) {
    const result = runBuildEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
