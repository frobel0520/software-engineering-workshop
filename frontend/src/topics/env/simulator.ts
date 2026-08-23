import type { SimulatorDefinition } from "../../topics/types";
import {
  envLabHappyPath,
  envLabInitialState,
  type EnvLabEvent,
  type EnvLabState,
  type EnvStepId,
} from "./content";

export interface EnvEventResult {
  state: EnvLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface EnvRunResult {
  state: EnvLabState;
  results: readonly EnvEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly EnvStepId[] = envLabHappyPath
  .map((event) => event.type)
  .filter((event): event is EnvStepId => event !== "reset");
const publicKeys = ["VITE_API_BASE_URL", "VITE_FEATURE_FLAG"] as const;
const serverOnlyKeys = ["DATABASE_PASSWORD"] as const;

function cloneState(state: EnvLabState): EnvLabState {
  return {
    ...state,
    loadedFiles: [...state.loadedFiles],
    publicKeys: [...state.publicKeys],
    serverOnlyKeys: [...state.serverOnlyKeys],
    completedStepIds: [...state.completedStepIds],
  };
}

function hasCompleted(state: EnvLabState, stepId: EnvStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: EnvLabState, stepId: EnvStepId): EnvStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function isComplete(state: EnvLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.configState === "valid" &&
    state.exposureState === "verified" &&
    state.localIgnored &&
    state.publicKeys.join("|") === publicKeys.join("|") &&
    state.serverOnlyKeys.join("|") === serverOnlyKeys.join("|")
  );
}

function accepted(
  current: EnvLabState,
  changes: Partial<EnvLabState>,
  message: string,
  output: readonly string[] = [message],
): EnvEventResult {
  return {
    state: { ...current, ...changes, phase: "active", lastMessage: message },
    output,
    accepted: true,
  };
}

function blocked(current: EnvLabState, command: string, message: string): EnvEventResult {
  return {
    state: { ...current, phase: "blocked", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
  };
}

function failed(current: EnvLabState, command: string, message: string): EnvEventResult {
  return {
    state: { ...current, phase: "failed", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
  };
}

export function createInitialEnvState(): EnvLabState {
  return cloneState(envLabInitialState);
}

export function resetEnvLab(): EnvLabState {
  return createInitialEnvState();
}

export function isEnvLabComplete(state: EnvLabState): boolean {
  return isComplete(state);
}

export function runEnvEvent(current: EnvLabState, event: EnvLabEvent): EnvEventResult {
  if (event.type === "reset") {
    return { state: resetEnvLab(), output: ["ENV Lab 已重設，可以重新開始。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "ENV Lab 已完成；如要重練，請先 reset。");
  }

  const state = cloneState(current);

  switch (event.type) {
    case "inspect-example":
      return accepted(
        state,
        { selectedFile: "env-example", completedStepIds: withStep(state, "inspect-example"), lastCommand: "cat .env.example" },
        "已確認 .env.example 只描述設定契約，不應放真實秘密。",
        [".env.example found", "public keys: VITE_API_BASE_URL, VITE_FEATURE_FLAG", "server-only key: DATABASE_PASSWORD"],
      );
    case "load-local":
      if (!hasCompleted(state, "inspect-example")) {
        return blocked(state, "cp .env.example .env.local", "請先檢查 .env.example，再建立本地覆寫檔。 ");
      }
      return accepted(
        state,
        {
          selectedFile: "env-local",
          loadedFiles: ["env-example", "env-local"],
          configState: "loaded",
          completedStepIds: withStep(state, "load-local"),
          lastCommand: "cp .env.example .env.local",
        },
        "已建立 .env.local；修改後要重啟 Vite 才會重新載入。",
        [".env.local created", "mode: development", "restart required after edits"],
      );
    case "validate-config":
      if (!hasCompleted(state, "load-local") || state.configState !== "loaded") {
        return blocked(state, "npm run check-config", "請先載入 .env.local，再驗證必要設定。 ");
      }
      return accepted(
        state,
        { selectedFile: "config-ts", configState: "valid", completedStepIds: withStep(state, "validate-config"), lastCommand: "npm run check-config" },
        "必要設定已通過驗證；缺值會在啟動時立即失敗。",
        ["VITE_API_BASE_URL: present", "config: valid", "startup guard: passed"],
      );
    case "check-exposure":
      if (!hasCompleted(state, "validate-config") || state.configState !== "valid") {
        return blocked(state, "npm run check-exposure", "設定尚未通過 validate；先確認必要 key 存在。 ");
      }
      return accepted(
        state,
        {
          exposureState: "verified",
          publicKeys: [...publicKeys],
          serverOnlyKeys: [...serverOnlyKeys],
          completedStepIds: withStep(state, "check-exposure"),
          lastCommand: "npm run check-exposure",
        },
        "已確認 VITE_ 會進入 client bundle；DATABASE_PASSWORD 保持 server-only。",
        ["client bundle: VITE_API_BASE_URL, VITE_FEATURE_FLAG", "server only: DATABASE_PASSWORD", "secret leak: prevented"],
      );
    case "check-ignore": {
      if (!hasCompleted(state, "check-exposure") || state.exposureState !== "verified") {
        return blocked(state, "git check-ignore .env.local", "請先檢查 bundle 邊界，再確認本地檔的 git 保護。 ");
      }
      const completedStepIds = withStep(state, "check-ignore");
      const nextState: EnvLabState = {
        ...state,
        phase: "completed",
        localIgnored: true,
        lastCommand: "git check-ignore .env.local",
        completedStepIds,
        lastMessage: "本地設定已被 git 忽略；ENV Lab 完成。",
      };
      return { state: nextState, output: [".env.local", "ignored by .gitignore", "ENV Lab completed"], accepted: true };
    }
    default: {
      return failed(state, event.type, `不支援的 env event：${event.type}。`);
    }
  }
}

export const envSimulator: SimulatorDefinition<EnvLabState, EnvLabEvent> = {
  createInitialState: createInitialEnvState,
  reduce: (state, event) => runEnvEvent(state, event).state,
  reset: resetEnvLab,
};

export function runEnvEvents(
  events: readonly EnvLabEvent[],
  initialState: EnvLabState = createInitialEnvState(),
): EnvRunResult {
  let state = cloneState(initialState);
  const results: EnvEventResult[] = [];

  for (const event of events) {
    const result = runEnvEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
