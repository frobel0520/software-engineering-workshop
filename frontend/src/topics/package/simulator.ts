import type { SimulatorDefinition } from "../../topics/types";
import {
  packageLabInitialState,
  packageLabHappyPath,
  packageLockFixture,
  type PackageEventType,
  type PackageLabEvent,
  type PackageLabState,
  type PackageStepId,
} from "./content";

export interface PackageEventResult {
  state: PackageLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface PackageRunResult {
  state: PackageLabState;
  results: readonly PackageEventResult[];
  accepted: boolean;
}

const completionStepIds: readonly PackageStepId[] = packageLabHappyPath.map((event) => event.type as PackageStepId);

const installedModules = ["@workshop/format@1.3.0", "@workshop/shared@1.0.0"] as const;

function cloneLockfile(state: PackageLabState["lockfile"]): PackageLabState["lockfile"] {
  if (!state) return null;
  return {
    ...state,
    packages: Object.fromEntries(
      Object.entries(state.packages).map(([path, fixture]) => [path, { ...fixture, dependencies: fixture.dependencies ? { ...fixture.dependencies } : undefined }]),
    ),
  };
}

function cloneState(state: PackageLabState): PackageLabState {
  return {
    ...state,
    manifest: { ...state.manifest, dependencies: { ...state.manifest.dependencies } },
    lockfile: cloneLockfile(state.lockfile),
    installedModules: [...state.installedModules],
    completedStepIds: [...state.completedStepIds],
  };
}

function hasCompleted(state: PackageLabState, stepId: PackageStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function withStep(state: PackageLabState, stepId: PackageStepId): PackageStepId[] {
  return hasCompleted(state, stepId) ? [...state.completedStepIds] : [...state.completedStepIds, stepId];
}

function isComplete(state: PackageLabState): boolean {
  return (
    state.phase === "completed" &&
    completionStepIds.every((stepId) => hasCompleted(state, stepId)) &&
    state.lockfileState === "synced" &&
    state.installState === "clean-installed" &&
    state.installedModules.join("|") === installedModules.join("|")
  );
}

function accepted(
  current: PackageLabState,
  changes: Partial<PackageLabState>,
  message: string,
  output: readonly string[] = [message],
): PackageEventResult {
  return {
    state: { ...current, ...changes, phase: "active", lastMessage: message },
    output,
    accepted: true,
  };
}

function blocked(current: PackageLabState, command: string, message: string): PackageEventResult {
  return {
    state: { ...current, phase: "blocked", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
  };
}

function failed(current: PackageLabState, command: string, message: string): PackageEventResult {
  return {
    state: { ...current, phase: "failed", lastCommand: command, lastMessage: message },
    output: [message],
    accepted: false,
  };
}

function manifestAndLockfileMatch(state: PackageLabState): boolean {
  return (
    state.manifest.dependencies["@workshop/format"] === "^1.2.0" &&
    state.lockfile?.packages["node_modules/@workshop/format"]?.version === "1.3.0" &&
    state.lockfile.packages["node_modules/@workshop/shared"]?.version === "1.0.0"
  );
}

export function createInitialPackageState(): PackageLabState {
  return cloneState(packageLabInitialState);
}

export function resetPackageLab(): PackageLabState {
  return createInitialPackageState();
}

export function isPackageLabComplete(state: PackageLabState): boolean {
  return isComplete(state);
}

export function runPackageEvent(current: PackageLabState, event: PackageLabEvent): PackageEventResult {
  if (event.type === "reset") {
    return { state: resetPackageLab(), output: ["Package Lab 已重設，可以重新開始。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, event.type, "Package Lab 已完成；如要重練，請先 reset。");
  }

  const state = cloneState(current);

  switch (event.type) {
    case "inspect-manifest":
      return accepted(
        state,
        { completedStepIds: withStep(state, "inspect-manifest"), lastCommand: "cat package.json" },
        "已確認 package.json 與 npm@10.8.2 fixture。",
        ["workshop-package-lab", "dependencies: (empty)", "packageManager: npm@10.8.2"],
      );
    case "add-dependency":
      if (!hasCompleted(state, "inspect-manifest")) {
        return blocked(state, "npm install @workshop/format@^1.2.0", "請先檢查 package.json，再新增依賴。");
      }
      if (event.packageSpec !== "@workshop/format@^1.2.0") {
        return failed(state, "npm install", "package not found in fixture registry.");
      }
      if (state.manifest.dependencies["@workshop/format"]) {
        return blocked(state, "npm install @workshop/format@^1.2.0", "@workshop/format 已存在；請繼續檢查目前 lockfile 狀態。");
      }
      return accepted(
        state,
        {
          manifest: { ...state.manifest, dependencies: { ...state.manifest.dependencies, "@workshop/format": "^1.2.0" } },
          manifestState: "updated",
          lockfileState: "stale",
          lastCommand: "npm install @workshop/format@^1.2.0",
          completedStepIds: withStep(state, "add-dependency"),
        },
        "已新增 @workshop/format@^1.2.0；lockfile 目前尚未同步。",
        ["package.json updated", "lockfile: stale"],
      );
    case "install":
      if (!hasCompleted(state, "add-dependency") || state.lockfileState !== "stale") {
        return blocked(state, "npm install", "請先新增依賴；npm install 會負責產生與 manifest 一致的 lockfile。");
      }
      return accepted(
        state,
        {
          lockfile: cloneLockfile(packageLockFixture),
          lockfileState: "synced",
          installState: "installed",
          installedModules: [...installedModules],
          lastCommand: "npm install",
          completedStepIds: withStep(state, "install"),
        },
        "已從 fixture registry 解析 direct 與 transitive dependencies。",
        ["@workshop/format@1.3.0", "@workshop/shared@1.0.0", "lockfile: synced"],
      );
    case "inspect-lockfile":
      if (state.lockfileState !== "synced" || !state.lockfile) {
        return blocked(state, "cat package-lock.json", "請先執行 npm install，現在沒有可檢查的 synced lockfile。");
      }
      return accepted(
        state,
        { lastCommand: "cat package-lock.json", completedStepIds: withStep(state, "inspect-lockfile") },
        "已確認 exact versions、transitive dependency 與 fixture registry 來源。",
        ["@workshop/format: 1.3.0", "@workshop/shared: 1.0.0", "resolvedFrom: fixture-registry"],
      );
    case "clean-install":
      if (!hasCompleted(state, "inspect-lockfile")) {
        return blocked(state, "npm ci", "請先檢查 package-lock.json，再用 npm ci 重建安裝結果。");
      }
      if (state.lockfileState !== "synced" || !state.lockfile || !manifestAndLockfileMatch(state)) {
        return failed(state, "npm ci", "lockfile does not match the declared dependency graph.");
      }
      if (isComplete({ ...state, phase: "completed", installState: "clean-installed" })) {
        return accepted(state, {}, "Package Lab 已完成；不需要重複 clean install。");
      }
      {
        const completedStepIds = withStep(state, "clean-install");
        const nextState: PackageLabState = {
          ...state,
          phase: "completed",
          installState: "clean-installed",
          installedModules: [...installedModules],
          lastCommand: "npm ci",
          completedStepIds,
          lastMessage: "已從 lockfile 乾淨重建相同 dependency graph；PACKAGE Lab 完成。",
        };
        return { state: nextState, output: ["node_modules cleared", ...installedModules, "PACKAGE Lab completed"], accepted: true };
      }
    default: {
      const unknownEvent = event.type as PackageEventType;
      return blocked(state, unknownEvent, `不支援的 package event：${unknownEvent}。`);
    }
  }
}

export const packageSimulator: SimulatorDefinition<PackageLabState, PackageLabEvent> = {
  createInitialState: createInitialPackageState,
  reduce: (state, event) => runPackageEvent(state, event).state,
  reset: resetPackageLab,
};

export function runPackageEvents(
  events: readonly PackageLabEvent[],
  initialState: PackageLabState = createInitialPackageState(),
): PackageRunResult {
  let state = cloneState(initialState);
  const results: PackageEventResult[] = [];

  for (const event of events) {
    const result = runPackageEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
