import type { LessonDefinition } from "../types";

export const deployLesson: LessonDefinition = {
  title: "把通過驗證的版本交付到可觀測的網站",
  orientation: {
    what: "部署是把通過 CI 的 production artifact 交給可追蹤的 publish 流程，並用 live probe 確認指定版本真的可被使用者觀測。",
    why: "build 綠燈不代表網站已上線；artifact、Pages branch、base path、live status 與 release record 必須形成同一條 evidence chain。",
    when: "main 要發布新版本、GitHub Pages 要更新，或新版本需要安全回滾到上一個可用版本時使用。",
    how: "先讀 deploy workflow，再確認 main release、CI artifact 與 Pages base path，接著 publish、probe、record；驗證失敗就保留失敗版本並 rollback。",
  },
  objectives: [
    "分辨 production artifact、Pages publish 與 live verification 的責任。",
    "讀懂 main trigger、workflow_dispatch、frontend/dist 與 gh-pages branch。",
    "理解 release version、artifact provenance 與 Pages base path 的關係。",
    "辨識 artifact missing、base path mismatch 與 live probe failure 的 boundary。",
    "以 release record 保存 source、version、URL、status 與 rollback evidence。",
    "用固定 scenario 重跑 success、blocked、rollback 與 reset/replay flow。",
  ],
  sections: [
    {
      id: "release-boundary",
      title: "Build、publish、live 是三個 boundary",
      body: "build 只產生 artifact；publish 更新 gh-pages；live probe 才能證明指定版本可被使用者觀測。三者不能被一個綠色 build 取代。",
    },
    {
      id: "workflow-input",
      title: "Release source 要指向 main",
      body: "部署 fixture 只接受 main push 或手動 dispatch。source、candidate version 與 previous verified version 必須在 release 開始前清楚可見。",
    },
    {
      id: "artifact-provenance",
      title: "Artifact 與 base path 要一起驗證",
      body: "frontend/dist 必須存在且來自通過 CI 的 source；Vite base path 必須對應 repository path，否則頁面即使被 publish 也可能無法載入資源。",
    },
    {
      id: "publish-boundary",
      title: "gh-pages 更新不等於網站可用",
      body: "publish 只表示 branch pointer 被更新。部署後仍要檢查 live status、URL 與 candidate version，並把 evidence 寫入 release record。",
    },
    {
      id: "rollback-boundary",
      title: "失敗版本要保留，流量回到 verified version",
      body: "probe failure 不應刪掉 failed release 或改寫歷史；rollback 應指向上一個 verified version，並記錄原因與回復結果。",
    },
    {
      id: "observe-and-record",
      title: "Release record 讓交付可追蹤",
      body: "source、version、artifact、Pages pointer、live URL、probe status 與 release outcome 共同形成交付結論，缺一不可。",
    },
  ],
};

export type DeployStageId =
  | "inspect-workflow"
  | "select-release"
  | "verify-ci-artifact"
  | "verify-pages-base"
  | "publish-pages"
  | "verify-deployment"
  | "record-release"
  | "evaluate-release";

export type DeployTrigger = "push" | "workflow_dispatch";
export type DeployArtifactState = "missing" | "verified";
export type DeployBasePathState = "unknown" | "verified" | "mismatch";
export type DeployPublishState = "pending" | "published" | "blocked";
export type DeployDeploymentState = "pending" | "live" | "failed" | "rolled-back";
export type DeployReleaseRecord = "none" | "verified" | "failed" | "blocked" | "rolled-back";
export type DeployScenarioId = "main-pages-success" | "missing-artifact-blocked" | "rollback-after-probe-failure";

export interface DeployLessonStep {
  id: DeployStageId;
  sectionId: string;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const deployLessonSteps: readonly DeployLessonStep[] = [
  {
    id: "inspect-workflow",
    sectionId: "workflow-input",
    title: "檢查 deploy workflow",
    command: "cat .github/workflows/deploy-pages.yml",
    explanation: "先確認 main trigger、workflow_dispatch、artifact path 與 gh-pages publish branch，不把 build 成功當成部署完成。",
    takeaway: "部署的 workflow input 決定 source、artifact 與 publish boundary。",
  },
  {
    id: "select-release",
    sectionId: "workflow-input",
    title: "選擇 main release",
    command: "main → release-2026.08.23",
    explanation: "固定 production source 與 candidate version，同時保留上一個 verified version 供 rollback 使用。",
    takeaway: "Release source、candidate version 與 previous version 要一起追蹤。",
  },
  {
    id: "verify-ci-artifact",
    sectionId: "artifact-provenance",
    title: "驗證 CI artifact",
    command: "artifact: frontend/dist",
    explanation: "Deploy 只接收 CI passed 的 frontend/dist；artifact missing 時不可更新 gh-pages。",
    takeaway: "沒有可追溯 artifact，就沒有可安全交付的版本。",
  },
  {
    id: "verify-pages-base",
    sectionId: "artifact-provenance",
    title: "驗證 Pages base path",
    command: "VITE_BASE=/software-engineering-workshop/",
    explanation: "確認 Vite base path 與 repository path 一致，避免 HTML 成功 publish 但資源 URL 指錯位置。",
    takeaway: "Artifact 的可用性包含它會被部署到哪個 path。",
  },
  {
    id: "publish-pages",
    sectionId: "publish-boundary",
    title: "發布到 gh-pages",
    command: "publish → gh-pages",
    explanation: "將已驗證的 candidate artifact 指向 gh-pages；artifact 或 base path 不完整時 branch 應保持 previous version。",
    takeaway: "Publish 是 branch pointer 變更，不是 live verification。",
  },
  {
    id: "verify-deployment",
    sectionId: "publish-boundary",
    title: "執行 live probe",
    command: "probe /software-engineering-workshop/",
    explanation: "用固定 URL、status 與 candidate version 驗證部署後狀態；probe failure 要保留 failed release。",
    takeaway: "只有被觀測到的版本，才有資格進入 release record。",
  },
  {
    id: "record-release",
    sectionId: "observe-and-record",
    title: "記錄 release evidence",
    command: "record release",
    explanation: "把 source、version、artifact、Pages pointer、live URL 與 deployment status 組成可追蹤紀錄。",
    takeaway: "Release record 把一次部署變成可回查的 evidence。",
  },
  {
    id: "evaluate-release",
    sectionId: "rollback-boundary",
    title: "評估 release／rollback",
    command: "evaluate release / rollback",
    explanation: "成功版本標記 verified；probe failure 則保留 failed release 並回到 previous verified version。",
    takeaway: "Rollback 是有 evidence 的結論，不是把失敗版本從歷史抹掉。",
  },
] as const;

export const deployFixture = {
  workflowPath: ".github/workflows/deploy-pages.yml",
  workflowName: "Publish workshop to gh-pages",
  releaseSource: "main",
  manualDispatch: true,
  artifactPath: "frontend/dist",
  pagesBranch: "gh-pages",
  repositoryBasePath: "/software-engineering-workshop/",
  currentVerifiedRelease: "release-2026.08.16",
  candidateRelease: "release-2026.08.23",
} as const;

export const deployWorkflowFixture = {
  path: deployFixture.workflowPath,
  lines: [
    "on: push(main) / workflow_dispatch",
    "job: publish",
    "actions/checkout@v4",
    "actions/setup-node@v4 · node 22 · cache npm",
    "npm ci · cwd frontend",
    "npm test && npm run build · cwd frontend",
    "VITE_BASE: /software-engineering-workshop/",
    "peaceiris/actions-gh-pages@v4 · publish_dir frontend/dist",
    "publish_branch: gh-pages",
  ],
} as const;

export interface DeployScenarioFixture {
  id: DeployScenarioId;
  title: string;
  trigger: DeployTrigger;
  releaseSource: "main";
  candidateVersion: string;
  previousVerifiedVersion: string;
  ciOutcome: "passed";
  artifactOutcome: DeployArtifactState;
  basePathOutcome: "verified";
  publishOutcome: "published" | "blocked";
  deploymentOutcome: "live" | "failed" | "rolled-back";
  liveStatus: number | null;
  finalRecord: Exclude<DeployReleaseRecord, "none">;
  learningPoint: string;
}

export const deployScenarioFixtures: readonly DeployScenarioFixture[] = [
  {
    id: "main-pages-success",
    title: "Main release 成功發布",
    trigger: "push",
    releaseSource: "main",
    candidateVersion: deployFixture.candidateRelease,
    previousVerifiedVersion: deployFixture.currentVerifiedRelease,
    ciOutcome: "passed",
    artifactOutcome: "verified",
    basePathOutcome: "verified",
    publishOutcome: "published",
    deploymentOutcome: "live",
    liveStatus: 200,
    finalRecord: "verified",
    learningPoint: "artifact、gh-pages publish 與 live probe 都完成後，release 才能標記 verified。",
  },
  {
    id: "missing-artifact-blocked",
    title: "Artifact missing 阻擋發布",
    trigger: "workflow_dispatch",
    releaseSource: "main",
    candidateVersion: deployFixture.candidateRelease,
    previousVerifiedVersion: deployFixture.currentVerifiedRelease,
    ciOutcome: "passed",
    artifactOutcome: "missing",
    basePathOutcome: "verified",
    publishOutcome: "blocked",
    deploymentOutcome: "failed",
    liveStatus: null,
    finalRecord: "blocked",
    learningPoint: "沒有 frontend/dist 時 gh-pages 必須保持上一個 verified version，不能假裝已上線。",
  },
  {
    id: "rollback-after-probe-failure",
    title: "Live probe failure 後回滾",
    trigger: "push",
    releaseSource: "main",
    candidateVersion: deployFixture.candidateRelease,
    previousVerifiedVersion: deployFixture.currentVerifiedRelease,
    ciOutcome: "passed",
    artifactOutcome: "verified",
    basePathOutcome: "verified",
    publishOutcome: "published",
    deploymentOutcome: "rolled-back",
    liveStatus: 200,
    finalRecord: "rolled-back",
    learningPoint: "保留 failed candidate 的 release record，將 Pages pointer 與 live 狀態回到上一個 verified version。",
  },
] as const;

export interface DeployStageFixture {
  id: DeployStageId;
  boundary: string;
  successEvidence: string;
  failureEvidence: string;
}

export const deployStageFixtures: readonly DeployStageFixture[] = [
  { id: "inspect-workflow", boundary: "workflow / trigger", successEvidence: "main push · workflow_dispatch · gh-pages", failureEvidence: "workflow 尚未 inspect" },
  { id: "select-release", boundary: "source / version", successEvidence: "main · release-2026.08.23 · previous verified", failureEvidence: "release source 必須是 main" },
  { id: "verify-ci-artifact", boundary: "CI / artifact", successEvidence: "CI passed · frontend/dist verified", failureEvidence: "artifact missing，publish blocked" },
  { id: "verify-pages-base", boundary: "base path", successEvidence: "VITE_BASE 與 repository path 一致", failureEvidence: "base path mismatch，deployment blocked" },
  { id: "publish-pages", boundary: "gh-pages pointer", successEvidence: "gh-pages → candidate release", failureEvidence: "branch 保持 previous verified version" },
  { id: "verify-deployment", boundary: "live probe", successEvidence: "URL status 200 · version observable", failureEvidence: "probe failed，candidate release 不可標記 live" },
  { id: "record-release", boundary: "release record", successEvidence: "source · version · artifact · URL · status", failureEvidence: "缺少 deployment evidence，record 不完整" },
  { id: "evaluate-release", boundary: "verify / rollback", successEvidence: "verified 或 rolled-back 結論", failureEvidence: "failed release 沒有 rollback evidence" },
] as const;

export interface DeployFailureFixture {
  command: string;
  message: string;
  expectedBoundary: string;
}

export const deployFailureFixtures: readonly DeployFailureFixture[] = [
  { command: "artifact: frontend/dist", message: "frontend/dist missing；gh-pages 保持上一個 verified version。", expectedBoundary: "CI / artifact" },
  { command: "VITE_BASE=/software-engineering-workshop/", message: "base path 尚未 verified；不能把 publish 當成 live。", expectedBoundary: "base path" },
  { command: "probe /software-engineering-workshop/", message: "live probe failed；candidate release 需要 rollback。", expectedBoundary: "live probe" },
  { command: "evaluate release / rollback", message: "failed release 尚未完成 rollback evidence，release 維持 blocked。", expectedBoundary: "verify / rollback" },
] as const;
