import type { LessonDefinition } from "../../topics/types";

export const buildLesson: LessonDefinition = {
  title: "把 source 變成可以交付的產品",
  orientation: {
    what: "建置工具把 source code、設定與依賴轉成可執行或可部署的 artifact，例如 production bundle 與 dist。",
    why: "它把型別檢查、模組解析、最佳化與輸出格式固定成可重複流程，讓本機與 CI 產出可檢查的交付物。",
    when: "要驗證正式 bundle、準備部署、檢查 base path，或需要在乾淨環境重建與預覽 production artifact 時使用。",
    how: "先執行 typecheck／lint，再用 production build 產生 dist，檢查 artifact 與公開路徑，最後用 preview 驗證正式輸出。",
  },
  objectives: [
    "分辨 source code、typecheck、bundle 與 dist artifact 各自負責的階段。",
    "理解 npm script 如何把 TypeScript gate 與 Vite production build 串成可重複指令。",
    "知道 GitHub Pages 的 nested base path 為什麼會影響產出的 asset URL。",
    "用 preview 檢查正式 artifact，而不是把 dev server 當成部署驗證。",
  ],
  sections: [
    {
      id: "source-to-artifact",
      title: "Source 不是交付物",
      body: "src/ 裡的 TypeScript、React 與 CSS 是開發輸入；使用者真正下載的是 dist/ 裡的 HTML、JavaScript 與 CSS。建置工具負責把前者轉成靜態 artifact。",
    },
    {
      id: "gates-before-bundle",
      title: "先過 gate，再產 bundle",
      body: "TypeScript 檢查先抓住型別與 import 問題，Vite 再負責解析模組、處理 JSX/CSS 並產出 production bundle。把錯誤留在 CI，不要留到部署後。",
    },
    {
      id: "base-path",
      title: "部署位置會改變 asset URL",
      body: "根網域可以使用 /，但 GitHub Pages project site 通常位於 /repository-name/。Vite 的 base 必須與公開路徑一致，否則 index.html 會指向錯誤的 asset URL。",
    },
    {
      id: "preview-artifact",
      title: "預覽正式輸出",
      body: "npm run preview 服務的是已產出的 dist，而不是即時編譯的 source。它適合在本機檢查 production artifact；真正上線仍交給靜態 hosting。",
    },
  ],
};

export type BuildStepId = "inspect-scripts" | "typecheck" | "bundle" | "inspect-dist" | "preview";

export interface BuildLessonStep {
  id: BuildStepId;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const buildLessonSteps: readonly BuildLessonStep[] = [
  {
    id: "inspect-scripts",
    title: "先看建置契約",
    command: "cat package.json",
    explanation: "確認 build script 會先跑 tsc -b，再交給 vite build；指令鏈就是 CI 的可讀契約。",
    takeaway: "先知道 pipeline 做什麼，再相信它產出的檔案。",
  },
  {
    id: "typecheck",
    title: "通過 TypeScript gate",
    command: "npm run lint",
    explanation: "先做不產出 bundle 的型別檢查，讓錯誤在 source 階段停止。",
    takeaway: "lint 在這裡是 build 前的安全閘門，不只是排版工具。",
  },
  {
    id: "bundle",
    title: "產出 production bundle",
    command: "VITE_BASE=/software-engineering-workshop/ npm run build",
    explanation: "用 Pages 的公開 base path 執行正式建置，將 source 轉成可部署的 dist artifact。",
    takeaway: "部署路徑是 build input，不能等上線後才猜。",
  },
  {
    id: "inspect-dist",
    title: "檢查 artifact",
    command: "ls dist",
    explanation: "確認 dist 至少包含 index.html 與 hashed assets；這些才是 static host 要發布的內容。",
    takeaway: "Build 成功的證據是 artifact 可檢查，不是終端機只顯示綠色。",
  },
  {
    id: "preview",
    title: "預覽正式輸出",
    command: "npm run preview",
    explanation: "啟動 dist 的本機 preview，檢查正式輸出是否能載入；它不是 production server。",
    takeaway: "用 preview 驗證交付物，用 hosting 負責正式服務。",
  },
] as const;

export type BuildLabPhase = "initial" | "active" | "blocked" | "failed" | "completed";
export type BuildTypecheckState = "unknown" | "passed";
export type BuildBundleState = "missing" | "created";
export type BuildArtifactState = "unknown" | "verified";
export type BuildPreviewState = "stopped" | "running";
export type BuildFileId = "package-json" | "vite-config" | "dist";
export type BuildEventType = BuildStepId | "reset";

export interface BuildFileFixture {
  id: BuildFileId;
  name: string;
  lines: readonly string[];
}

export interface BuildLabState {
  phase: BuildLabPhase;
  typecheckState: BuildTypecheckState;
  bundleState: BuildBundleState;
  artifactState: BuildArtifactState;
  previewState: BuildPreviewState;
  basePath: "/" | "/software-engineering-workshop/" | "unknown";
  selectedFile: BuildFileId;
  completedStepIds: readonly BuildStepId[];
  lastCommand: string | null;
  lastMessage: string;
  canReset: true;
}

export interface BuildLabEvent {
  type: BuildEventType;
}

export const buildFileFixtures: readonly BuildFileFixture[] = [
  {
    id: "package-json",
    name: "package.json",
    lines: [
      '"lint": "tsc --noEmit",',
      '"build": "tsc -b && vite build",',
      '"preview": "vite preview"',
    ],
  },
  {
    id: "vite-config",
    name: "vite.config.ts",
    lines: [
      "export default defineConfig({",
      '  base: process.env.VITE_BASE ?? "/",',
      "  plugins: [react()],",
      "});",
    ],
  },
  {
    id: "dist",
    name: "dist/",
    lines: [
      "dist/ 尚未產生",
      "// 執行 production build 後檢查 index.html 與 assets/",
    ],
  },
] as const;

export const buildLabInitialState: BuildLabState = {
  phase: "initial",
  typecheckState: "unknown",
  bundleState: "missing",
  artifactState: "unknown",
  previewState: "stopped",
  basePath: "unknown",
  selectedFile: "package-json",
  completedStepIds: [],
  lastCommand: null,
  lastMessage: "準備從 package.json 的 build script 開始。",
  canReset: true,
};

export const buildLabHappyPath: readonly BuildLabEvent[] = buildLessonSteps.map((step) => ({ type: step.id }));

export interface BuildFailureFixture {
  command: string;
  message: string;
  expectedPhase: "blocked" | "failed";
}

export const buildFailureFixtures: readonly BuildFailureFixture[] = [
  {
    command: "npm run build",
    message: "請先通過 TypeScript gate，再產出 production bundle。",
    expectedPhase: "blocked",
  },
  {
    command: "ls dist",
    message: "dist 尚未產生；請先執行 production build。",
    expectedPhase: "blocked",
  },
  {
    command: "npm run preview",
    message: "請先檢查 dist artifact，再啟動 preview。",
    expectedPhase: "blocked",
  },
] as const;
