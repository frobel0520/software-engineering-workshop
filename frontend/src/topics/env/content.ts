import type { LessonDefinition } from "../../topics/types";

export const envLesson: LessonDefinition = {
  title: "讓設定跟著環境走，但別把秘密打包",
  orientation: {
    what: "環境變數是由執行環境提供的設定輸入，讓同一份程式在本機、測試與 production 使用不同值而不必改 source code。",
    why: "把環境差異與秘密從程式碼分離，能避免重打包與誤提交，也讓啟動時可以清楚驗證必要設定。",
    when: "API base URL、資料庫連線、feature flag 或其他部署相關值會隨環境改變時使用；密碼與 token 不應進入 client bundle。",
    how: "提交安全的 .env.example，在本機使用未提交的 .env.local，依公開／私密邊界載入與驗證，並用 .gitignore 保護本地檔案。",
  },
  objectives: [
    "分辨可提交的 .env.example、機器本地的 .env.local 與程式讀取設定的邊界。",
    "理解 Vite 的 VITE_ 變數會進入瀏覽器 bundle，不能放 API key 或密碼。",
    "在啟動前驗證必要設定，讓缺值變成清楚的失敗，而不是埋成 runtime bug。",
    "用 .gitignore 保護本地設定，同時留下可複製的安全範本。",
  ],
  sections: [
    {
      id: "config-is-input",
      title: "設定是輸入，不是程式碼",
      body: ".env.example 描述團隊需要哪些設定；.env.local 放每台機器自己的值；程式只負責讀取與驗證。把環境差異從 source code 抽離，部署時才不用改程式重打包。",
    },
    {
      id: "load-by-mode",
      title: "檔名決定載入情境",
      body: "Vite 會依 mode 載入 .env、.env.local 與 .env.[mode]。這些值會在 Vite 啟動時載入；修改後要重啟 dev server，才能看到新的設定。",
    },
    {
      id: "public-boundary",
      title: "VITE_ 是公開邊界",
      body: "VITE_API_BASE_URL 可以是瀏覽器需要知道的公開設定，但 VITE_ 變數會被打進 client bundle。API key、資料庫密碼與 token 必須留在 server 或 serverless function。",
    },
    {
      id: "validate-and-ignore",
      title: "先驗證，再保護本地檔",
      body: "啟動時檢查必要 key，缺值就 fail fast；把 .env.local 加進 .gitignore，並提交 .env.example。這樣團隊得到的是可重現的契約，不是某個人的秘密。",
    },
  ],
};

export type EnvStepId = "inspect-example" | "load-local" | "validate-config" | "check-exposure" | "check-ignore";

export interface EnvLessonStep {
  id: EnvStepId;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const envLessonSteps: readonly EnvLessonStep[] = [
  {
    id: "inspect-example",
    title: "檢查安全範本",
    command: "cat .env.example",
    explanation: "先看專案要求哪些設定；範本可以提交，但不應含有真實密碼。",
    takeaway: "先定義契約，再讓每個環境提供自己的值。",
  },
  {
    id: "load-local",
    title: "建立本地覆寫",
    command: "cp .env.example .env.local",
    explanation: "本地檔承接開發機的值，和可提交的範本分開；Vite 會在啟動時載入它。",
    takeaway: ".env.local 是工作目錄的輸入，不是版本控制的輸出。",
  },
  {
    id: "validate-config",
    title: "啟動前驗證",
    command: "npm run check-config",
    explanation: "模擬 config loader 檢查必要的 VITE_API_BASE_URL，缺值時立刻停止。",
    takeaway: "越早失敗，越容易知道是哪個環境沒有準備好。",
  },
  {
    id: "check-exposure",
    title: "檢查 bundle 邊界",
    command: "npm run check-exposure",
    explanation: "確認 VITE_ 設定是 client 可見值，而 DATABASE_PASSWORD 仍然是 server-only。",
    takeaway: "前端拿得到的值，就不能當成秘密。",
  },
  {
    id: "check-ignore",
    title: "確認不會誤提交",
    command: "git check-ignore .env.local",
    explanation: "最後確認本地檔被 .gitignore 排除；團隊仍以 .env.example 交換設定名稱。",
    takeaway: "保護秘密靠邊界與流程，不靠記憶。",
  },
] as const;

export type EnvLabPhase = "initial" | "active" | "blocked" | "failed" | "completed";
export type EnvConfigState = "unknown" | "loaded" | "valid";
export type EnvExposureState = "unknown" | "verified";
export type EnvFileId = "env-example" | "env-local" | "config-ts";
export type EnvEventType = EnvStepId | "reset";

export interface EnvFileFixture {
  id: EnvFileId;
  name: string;
  lines: readonly string[];
}

export interface EnvLabState {
  phase: EnvLabPhase;
  configState: EnvConfigState;
  exposureState: EnvExposureState;
  selectedFile: EnvFileId;
  loadedFiles: readonly EnvFileId[];
  publicKeys: readonly string[];
  serverOnlyKeys: readonly string[];
  localIgnored: boolean;
  completedStepIds: readonly EnvStepId[];
  lastCommand: string | null;
  lastMessage: string;
  canReset: true;
}

export interface EnvLabEvent {
  type: EnvEventType;
}

export const envFileFixtures: readonly EnvFileFixture[] = [
  {
    id: "env-example",
    name: ".env.example",
    lines: [
      "# safe template: commit names, never real secrets",
      "VITE_API_BASE_URL=https://api.example.test",
      "VITE_FEATURE_FLAG=env-lab",
      "DATABASE_PASSWORD=replace-me-on-server",
    ],
  },
  {
    id: "env-local",
    name: ".env.local",
    lines: [
      "# local-only: ignored by git",
      "VITE_API_BASE_URL=http://127.0.0.1:8000",
      "VITE_FEATURE_FLAG=env-lab",
      "DATABASE_PASSWORD=local-placeholder",
    ],
  },
  {
    id: "config-ts",
    name: "src/config.ts",
    lines: [
      "const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;",
      "if (!apiBaseUrl) throw new Error(\"Missing VITE_API_BASE_URL\");",
      "export const config = { apiBaseUrl };",
    ],
  },
] as const;

export const envLabInitialState: EnvLabState = {
  phase: "initial",
  configState: "unknown",
  exposureState: "unknown",
  selectedFile: "env-example",
  loadedFiles: [],
  publicKeys: [],
  serverOnlyKeys: [],
  localIgnored: false,
  completedStepIds: [],
  lastCommand: null,
  lastMessage: "準備從安全的 .env.example 範本開始。",
  canReset: true,
};

export const envLabHappyPath: readonly EnvLabEvent[] = envLessonSteps.map((step) => ({ type: step.id }));

export interface EnvFailureFixture {
  command: string;
  message: string;
  expectedPhase: "blocked" | "failed";
}

export const envFailureFixtures: readonly EnvFailureFixture[] = [
  {
    command: "npm run check-config",
    message: "請先載入 .env.local，再驗證必要設定。",
    expectedPhase: "blocked",
  },
  {
    command: "npm run check-exposure",
    message: "設定尚未通過 validate；先確認必要 key 存在。",
    expectedPhase: "blocked",
  },
  {
    command: "git check-ignore .env.local",
    message: "請先檢查 bundle 邊界，再確認本地檔的 git 保護。",
    expectedPhase: "blocked",
  },
] as const;
