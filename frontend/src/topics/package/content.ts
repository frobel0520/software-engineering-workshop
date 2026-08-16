import type { LessonDefinition } from "../../topics/types";

export const packageLesson: LessonDefinition = {
  title: "讓依賴可重現，而不是碰運氣",
  objectives: [
    "分辨 package.json、package-lock.json 與 installed modules 各自負責的狀態。",
    "用版本範圍新增依賴，理解 manifest spec 與 lockfile exact version 的差異。",
    "用 npm install 解析 fixture registry，再用 npm ci 從 lockfile 重建相同結果。",
    "在依賴狀態不一致時，知道應該更新、檢查或停止，而不是留下半套安裝。",
  ],
  sections: [
    {
      id: "three-dependency-layers",
      title: "依賴管理有三層狀態",
      body: "package.json 宣告你想要的版本範圍；package-lock.json 記錄這次解析出的 exact versions；installed modules 則是目前工作目錄實際可用的結果。三者要一起理解，才知道專案是否可重現。",
    },
    {
      id: "range-and-exact",
      title: "版本範圍不等於實際版本",
      body: "^1.2.0 是允許更新的依賴範圍，lockfile 中的 1.3.0 才是這次安裝固定採用的版本。不要只看 manifest 就假設每台機器都會得到相同 dependency graph。",
    },
    {
      id: "install-and-lock",
      title: "npm install 會更新解析結果",
      body: "新增依賴後，npm install 會依照 fixture registry 解析 direct dependency 與 transitive dependency，並同步更新 lockfile。這一步應留下可 review 的 manifest 與 lockfile 變更。",
    },
    {
      id: "clean-rebuild",
      title: "npm ci 用 lockfile 重建",
      body: "npm ci 不是另一種猜版本的安裝方式；它要求 manifest 與 lockfile 一致，再從 lockfile 重建乾淨結果。若兩者不一致，應該先修正狀態而不是忽略錯誤。",
    },
  ],
};

export type PackageStepId =
  | "inspect-manifest"
  | "add-dependency"
  | "install"
  | "inspect-lockfile"
  | "clean-install";

export interface PackageLessonStep {
  id: PackageStepId;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const packageLessonSteps: readonly PackageLessonStep[] = [
  {
    id: "inspect-manifest",
    title: "先看依賴宣告",
    command: "cat package.json",
    explanation: "先確認專案名稱、package manager 版本與目前 dependencies，再決定要新增什麼。",
    takeaway: "manifest 說明需求，不保證 exact resolution。",
  },
  {
    id: "add-dependency",
    title: "新增版本範圍",
    command: "npm install @workshop/format@^1.2.0",
    explanation: "用版本範圍新增 direct dependency；fixture 會讓 manifest 更新，並標記 lockfile 尚未同步。",
    takeaway: "改 manifest 後，先承認 lockfile 是 stale。",
  },
  {
    id: "install",
    title: "解析並安裝依賴",
    command: "npm install",
    explanation: "從固定 registry fixture 解析 @workshop/format@1.3.0 與它的 transitive dependency。",
    takeaway: "安裝結果要能被 lockfile 解釋。",
  },
  {
    id: "inspect-lockfile",
    title: "檢查 exact resolution",
    command: "cat package-lock.json",
    explanation: "確認 lockfile 記下 direct dependency、transitive dependency、exact version 與 fixture 來源。",
    takeaway: "lockfile 是可重現安裝的證據。",
  },
  {
    id: "clean-install",
    title: "用 lockfile 乾淨重建",
    command: "npm ci",
    explanation: "清空既有安裝結果，再只依照 lockfile 重建相同 dependency graph。",
    takeaway: "可重現不是安裝一次成功，而是清空後仍得到同一組結果。",
  },
] as const;

export type PackageLabPhase = "initial" | "active" | "blocked" | "failed" | "completed";
export type PackageManifestState = "unchanged" | "updated";
export type PackageLockfileState = "missing" | "stale" | "synced";
export type PackageInstallState = "empty" | "installed" | "clean-installed";
export type PackageEventType = PackageStepId | "reset";

export interface PackageManifestFixture {
  name: "workshop-package-lab";
  private: true;
  packageManager: "npm@10.8.2";
  dependencies: Readonly<Record<string, string>>;
}

export interface PackageRegistryFixture {
  name: "@workshop/format" | "@workshop/shared";
  versions: Readonly<Record<string, { dependencies: Readonly<Record<string, string>> }>>;
}

export interface PackageLockPackageFixture {
  version: string;
  resolvedFrom: "fixture-registry";
  dependencies?: Readonly<Record<string, string>>;
}

export interface PackageLockFixture {
  lockfileVersion: 3;
  packages: Readonly<Record<string, PackageLockPackageFixture>>;
}

export interface PackageLabState {
  phase: PackageLabPhase;
  packageManager: "npm";
  manifest: PackageManifestFixture;
  manifestState: PackageManifestState;
  lockfile: PackageLockFixture | null;
  lockfileState: PackageLockfileState;
  installedModules: readonly string[];
  installState: PackageInstallState;
  completedStepIds: readonly PackageStepId[];
  lastCommand: string | null;
  lastMessage: string;
  canReset: true;
}

export interface PackageLabEvent {
  type: PackageEventType;
  packageSpec?: string;
}

export const packageManifestFixture: PackageManifestFixture = {
  name: "workshop-package-lab",
  private: true,
  packageManager: "npm@10.8.2",
  dependencies: {},
};

export const packageRegistryFixtures: readonly PackageRegistryFixture[] = [
  {
    name: "@workshop/format",
    versions: {
      "1.2.0": { dependencies: { "@workshop/shared": "^1.0.0" } },
      "1.3.0": { dependencies: { "@workshop/shared": "^1.0.0" } },
    },
  },
  {
    name: "@workshop/shared",
    versions: {
      "1.0.0": { dependencies: {} },
    },
  },
] as const;

export const packageLockFixture: PackageLockFixture = {
  lockfileVersion: 3,
  packages: {
    "node_modules/@workshop/format": {
      version: "1.3.0",
      resolvedFrom: "fixture-registry",
      dependencies: { "@workshop/shared": "^1.0.0" },
    },
    "node_modules/@workshop/shared": {
      version: "1.0.0",
      resolvedFrom: "fixture-registry",
    },
  },
};

export const packageLabInitialState: PackageLabState = {
  phase: "initial",
  packageManager: "npm",
  manifest: packageManifestFixture,
  manifestState: "unchanged",
  lockfile: null,
  lockfileState: "missing",
  installedModules: [],
  installState: "empty",
  completedStepIds: [],
  lastCommand: null,
  lastMessage: "準備從固定 package.json fixture 開始。",
  canReset: true,
};

export const packageLabHappyPath: readonly PackageLabEvent[] = [
  { type: "inspect-manifest" },
  { type: "add-dependency", packageSpec: "@workshop/format@^1.2.0" },
  { type: "install" },
  { type: "inspect-lockfile" },
  { type: "clean-install" },
];

export interface PackageFailureFixture {
  command: string;
  message: string;
  expectedPhase: "blocked" | "failed";
}

export const packageFailureFixtures: readonly PackageFailureFixture[] = [
  {
    command: "npm ci",
    message: "npm ci blocked until package.json and package-lock.json are consistent.",
    expectedPhase: "blocked",
  },
  {
    command: "npm install @workshop/unknown@^1.0.0",
    message: "package not found in fixture registry.",
    expectedPhase: "failed",
  },
  {
    command: "npm ci",
    message: "lockfile does not match the declared dependency graph.",
    expectedPhase: "failed",
  },
] as const;
