import type { LessonDefinition } from "../types";

export const cicdLesson: LessonDefinition = {
  title: "讓每次變更都經過同一條檢查線",
  orientation: {
    what: "CI/CD 是把程式變更送進可重複 pipeline 的交付方法：CI 驗證行為、型別與 production build，CD 再把通過驗證的版本交給可追蹤的交付流程。",
    why: "固定的 trigger、step 順序與 required check 能讓團隊用同一套 evidence 判斷能否合併，避免只靠作者本機或人工記憶。",
    when: "pull request 需要自動檢查、main 需要保持可發布，或團隊要把 test／lint／build 變成 branch gate 時使用。",
    how: "先讀 workflow trigger 與 ref，再依序 checkout、setup Node／cache、npm ci、test、lint、build，最後以 required check 評估 merge gate。",
  },
  objectives: [
    "分辨 CI gate、CD pipeline、trigger event 與 branch ref 的責任。",
    "讀懂 checkout、Node setup、npm cache 與 lockfile 對可重現輸入的作用。",
    "理解 npm ci、test、lint、build 的 fail-fast 順序。",
    "以 required check 判斷 pull request 是否 mergeable。",
    "區分 test failure、build failure 與下游 not-run evidence。",
    "用固定 scenario 重跑 success、failure 與 reset/replay flow。",
  ],
  sections: [
    {
      id: "ci-cd-boundary",
      title: "CI 驗證，CD 交付",
      body: "CI 把變更送進可重複檢查；CD 把已驗證版本交給可追蹤的交付流程。workflow 存在不代表每個 gate 都通過，也不代表每次都直接 deploy production。",
    },
    {
      id: "trigger-and-ref",
      title: "Event 與 ref 是 pipeline input",
      body: "pull_request 的 base branch、push 的 branch 與 workflow_dispatch 都會改變 pipeline 為什麼啟動、檢查哪個 ref，以及 required check 應該回報給誰。",
    },
    {
      id: "checkout-and-cache",
      title: "先固定 source 與安裝 context",
      body: "checkout 取得 source；setup Node 22、npm cache 與 frontend/package-lock.json 固定依賴輸入。npm ci 應從 lockfile 建立乾淨 install，不偷用上一輪 node_modules。",
    },
    {
      id: "ordered-gates",
      title: "Test、lint、build 是有順序的 gate",
      body: "test 先驗證行為，lint 驗證 TypeScript，build 驗證 production artifact。前一步失敗時下游應維持 not-run，不能為了畫面完整而偽造成功。",
    },
    {
      id: "required-check",
      title: "Job 結果會成為 merge gate",
      body: "frontend 是 required check；只有所有 gate 通過，check 才是 passed，pull request 才能顯示 mergeable。沒有 conflict 也不能繞過 failed check。",
    },
    {
      id: "failure-boundary",
      title: "Failure 要停在第一個可修 boundary",
      body: "test failure 與 build failure 不是同一件事。保留第一個 failure、標出下游 not-run 或 artifact missing，修正後才能 reset／retry，不把舊 output 累加成新成功。",
    },
    {
      id: "repeatable-pipeline",
      title: "Reset 後重跑同一條線",
      body: "相同 fixture 加上相同 event sequence 應得到相同 step status、required check 與 merge gate。可重複的 pipeline evidence 比一次性的綠色畫面更可靠。",
    },
  ],
};

export type CicdStageId =
  | "inspect-workflow"
  | "select-trigger"
  | "checkout-source"
  | "install-dependencies"
  | "run-test"
  | "run-lint"
  | "run-build"
  | "publish-required-check"
  | "evaluate-merge-gate";

export interface CicdLessonStep {
  id: CicdStageId;
  sectionId: string;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const cicdLessonSteps: readonly CicdLessonStep[] = [
  {
    id: "inspect-workflow",
    sectionId: "trigger-and-ref",
    title: "檢查 workflow trigger",
    command: "cat .github/workflows/ci.yml",
    explanation: "先確認 CI workflow 的 event、target branch、job id 與 required check，不要把目前本機分支當成唯一 input。",
    takeaway: "Workflow 的 trigger 與 ref 是 pipeline 的第一組資料。",
  },
  {
    id: "select-trigger",
    sectionId: "trigger-and-ref",
    title: "選擇 pipeline input",
    command: "pull_request → dev",
    explanation: "固定使用 pull request 事件與 dev base ref，讓後續的 check 能對應到 merge gate。",
    takeaway: "Event、base ref 與 check owner 要一起看。",
  },
  {
    id: "checkout-source",
    sectionId: "checkout-and-cache",
    title: "Checkout source",
    command: "actions/checkout@v4",
    explanation: "runner 先取得 fixture source ref；尚未 checkout 時，install 與任何 gate 都沒有可信輸入。",
    takeaway: "先固定 source，再談依賴與檢查結果。",
  },
  {
    id: "install-dependencies",
    sectionId: "checkout-and-cache",
    title: "安裝 lockfile 依賴",
    command: "npm ci  # frontend",
    explanation: "Node 22、npm cache 與 frontend/package-lock.json 形成 deterministic install context。",
    takeaway: "npm ci 是可重現 pipeline input，不是可省略的暖身。",
  },
  {
    id: "run-test",
    sectionId: "ordered-gates",
    title: "執行行為測試",
    command: "npm test  # frontend",
    explanation: "第一個行為 gate；test failure 時應停止 job，lint 與 build 維持 not-run。",
    takeaway: "先驗證行為，再往後推進 pipeline。",
  },
  {
    id: "run-lint",
    sectionId: "ordered-gates",
    title: "執行 TypeScript lint",
    command: "npm run lint  # frontend",
    explanation: "test 通過後驗證 TypeScript boundary；lint failure 時 build 不應被畫成成功。",
    takeaway: "每個 gate 都要保留自己的 failure boundary。",
  },
  {
    id: "run-build",
    sectionId: "ordered-gates",
    title: "建立 production artifact",
    command: "npm run build  # frontend",
    explanation: "最後驗證 production build；build failure 表示 artifact missing，即使 test 與 lint 已通過。",
    takeaway: "綠色 test 不能掩蓋不能交付的 build。",
  },
  {
    id: "publish-required-check",
    sectionId: "required-check",
    title: "發布 required check",
    command: "check: frontend",
    explanation: "將 job 的 step status 彙總為 GitHub branch protection 使用的 frontend check。",
    takeaway: "Merge gate 看的是 required check，不是單一 step。",
  },
  {
    id: "evaluate-merge-gate",
    sectionId: "required-check",
    title: "判斷 merge gate",
    command: "evaluate merge gate",
    explanation: "required check passed 才是 mergeable；任何 gate failure 都必須留下 blocked。",
    takeaway: "可合併是所有必要 evidence 的結論。",
  },
] as const;

export const cicdFixture = {
  workflowPath: ".github/workflows/ci.yml",
  workflowName: "CI",
  jobId: "frontend",
  requiredCheck: "frontend",
  nodeVersion: "22",
  cacheDependencyPath: "frontend/package-lock.json",
  workingDirectory: "frontend",
  targetRefs: ["dev", "main"],
  sourceRef: "fixture/feature",
} as const;

export interface CicdWorkflowFixture {
  path: string;
  lines: readonly string[];
}

export const cicdWorkflowFixture: CicdWorkflowFixture = {
  path: cicdFixture.workflowPath,
  lines: [
    "on: push / pull_request(dev, main) / workflow_dispatch",
    "job: frontend",
    "actions/checkout@v4",
    "actions/setup-node@v4 · node 22 · cache npm",
    "npm ci · cwd frontend",
    "npm test · cwd frontend",
    "npm run lint · cwd frontend",
    "npm run build · cwd frontend",
  ],
};

export type CicdStepOutcome = "passed" | "failed" | "not-run";
export type CicdTriggerEvent = "pull_request" | "push" | "workflow_dispatch";
export type CicdTargetRef = "dev" | "main";
export type CicdScenarioId = "pull-request-green" | "pull-request-install-failure" | "pull-request-test-failure" | "pull-request-build-failure";

export interface CicdScenarioFixture {
  id: CicdScenarioId;
  title: string;
  triggerEvent: CicdTriggerEvent;
  targetRef: CicdTargetRef;
  installOutcome: CicdStepOutcome;
  testOutcome: CicdStepOutcome;
  lintOutcome: CicdStepOutcome;
  buildOutcome: CicdStepOutcome;
  artifactState: "created" | "missing";
  requiredCheck: "passed" | "failed";
  mergeGate: "mergeable" | "blocked";
  failureStage: CicdStageId | null;
  learningPoint: string;
}

export const cicdScenarioFixtures: readonly CicdScenarioFixture[] = [
  {
    id: "pull-request-green",
    title: "Pull request 全部通過",
    triggerEvent: "pull_request",
    targetRef: "dev",
    installOutcome: "passed",
    testOutcome: "passed",
    lintOutcome: "passed",
    buildOutcome: "passed",
    artifactState: "created",
    requiredCheck: "passed",
    mergeGate: "mergeable",
    failureStage: null,
    learningPoint: "所有必要 gate 通過後，frontend required check 才能讓 PR mergeable。",
  },
  {
    id: "pull-request-install-failure",
    title: "Install failure 停住 pipeline",
    triggerEvent: "pull_request",
    targetRef: "dev",
    installOutcome: "failed",
    testOutcome: "not-run",
    lintOutcome: "not-run",
    buildOutcome: "not-run",
    artifactState: "missing",
    requiredCheck: "failed",
    mergeGate: "blocked",
    failureStage: "install-dependencies",
    learningPoint: "npm ci 失敗時保留 lockfile／runtime evidence，test、lint、build 都必須維持 not-run。",
  },
  {
    id: "pull-request-test-failure",
    title: "Test failure 停住 pipeline",
    triggerEvent: "pull_request",
    targetRef: "dev",
    installOutcome: "passed",
    testOutcome: "failed",
    lintOutcome: "not-run",
    buildOutcome: "not-run",
    artifactState: "missing",
    requiredCheck: "failed",
    mergeGate: "blocked",
    failureStage: "run-test",
    learningPoint: "行為測試失敗時保留第一個 boundary，下游 lint／build 不偽造成功。",
  },
  {
    id: "pull-request-build-failure",
    title: "Build failure 阻擋交付",
    triggerEvent: "pull_request",
    targetRef: "dev",
    installOutcome: "passed",
    testOutcome: "passed",
    lintOutcome: "passed",
    buildOutcome: "failed",
    artifactState: "missing",
    requiredCheck: "failed",
    mergeGate: "blocked",
    failureStage: "run-build",
    learningPoint: "test／lint 綠色不能掩蓋 production artifact 缺失與 blocked merge gate。",
  },
] as const;

export interface CicdStageFixture {
  id: CicdStageId;
  boundary: string;
  successEvidence: string;
  failureEvidence: string;
}

export const cicdStageFixtures: readonly CicdStageFixture[] = [
  { id: "inspect-workflow", boundary: "workflow / job", successEvidence: "CI · frontend · required check frontend", failureEvidence: "workflow 尚未 inspect" },
  { id: "select-trigger", boundary: "event / ref", successEvidence: "pull_request · base dev", failureEvidence: "event 或 target ref 不在 fixture" },
  { id: "checkout-source", boundary: "source ref", successEvidence: "fixture/feature checked out", failureEvidence: "source 尚未取得，後續 stages not-run" },
  { id: "install-dependencies", boundary: "lockfile / runtime", successEvidence: "Node 22 · npm cache · npm ci passed", failureEvidence: "install failed，test／lint／build not-run" },
  { id: "run-test", boundary: "behavior gate", successEvidence: "npm test passed", failureEvidence: "npm test failed，lint／build not-run" },
  { id: "run-lint", boundary: "TypeScript gate", successEvidence: "npm run lint passed", failureEvidence: "lint failed，build not-run" },
  { id: "run-build", boundary: "production artifact", successEvidence: "npm run build passed · dist created", failureEvidence: "build failed · artifact missing" },
  { id: "publish-required-check", boundary: "branch protection", successEvidence: "frontend check passed", failureEvidence: "frontend check failed" },
  { id: "evaluate-merge-gate", boundary: "merge decision", successEvidence: "mergeable", failureEvidence: "blocked until required check passes" },
] as const;

export interface CicdFailureFixture {
  command: string;
  message: string;
  expectedBoundary: string;
}

export const cicdFailureFixtures: readonly CicdFailureFixture[] = [
  { command: "npm ci  # frontend", message: "install failed；test、lint 與 build 維持 not-run，先修正 lockfile／runtime boundary。", expectedBoundary: "lockfile / runtime" },
  { command: "npm test", message: "test failed；lint 與 build 維持 not-run，先修正行為 gate。", expectedBoundary: "behavior gate" },
  { command: "npm run lint", message: "lint 尚未通過；build 不能被標記為成功。", expectedBoundary: "TypeScript gate" },
  { command: "npm run build", message: "build failed；production artifact missing，required check 會 blocked。", expectedBoundary: "production artifact" },
  { command: "evaluate merge gate", message: "required check failed；branch 無 conflict 也不能直接 merge。", expectedBoundary: "merge decision" },
] as const;
