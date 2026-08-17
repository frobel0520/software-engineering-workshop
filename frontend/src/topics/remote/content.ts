import type { LessonDefinition } from "../../topics/types";

export const remoteLesson: LessonDefinition = {
  title: "把本地分支送上遠端協作",
  orientation: {
    what: "遠端協作是把本地 repository、hosted repository、review、CI 與 merge 規則接成一條可追蹤的工作流。",
    why: "它讓其他人能看見、檢查與討論你的變更，也讓團隊在合併前用自動檢查降低整合風險。",
    when: "需要發布功能分支、與 coworker 同步、開 PR／MR、等待 CI，或把已 review 的變更整合進 dev／main 時使用。",
    how: "先 fetch 取得遠端狀態，再 rebase 或 merge 整理本地歷史，push 分支開 PR／MR，通過 review 與 checks 後 merge。",
  },
  objectives: [
    "分辨 local branch、remote-tracking branch 與 origin。",
    "用 fetch 與 rebase 對齊遠端 dev，再發布功能分支。",
    "理解 PR、CI、review 與 merge／auto-merge 的檢查順序。",
  ],
  sections: [
    {
      id: "remote-model",
      title: "origin 不是另一個工作目錄",
      body: "local branch 是你目前前進的分支；origin/dev 是本地記住的遠端 dev 狀態。git fetch 只更新遠端參照，不會替你修改工作目錄。",
    },
    {
      id: "sync-before-publish",
      title: "先更新認知，再整理歷史",
      body: "在發布功能分支前執行 git fetch origin dev，再用 git rebase origin/dev 將自己的 commit 放到最新基線上。這能提早發現衝突，也讓 PR 的基礎清楚。",
    },
    {
      id: "publish-for-review",
      title: "push 是把分支交給協作流程",
      body: "git push -u origin feature/remote-work 會建立遠端分支與 upstream 關係。之後才能開 PR，讓 CI 與 review 對這組變更提供可追蹤的回饋。",
    },
    {
      id: "pr-lifecycle",
      title: "PR 不是最後一步",
      body: "PR 建立後要確認 CI、review 與 branch protection 條件。只有檢查通過，才可 merge；auto-merge 是符合規則後由平台代為執行，不是跳過檢查。",
    },
  ],
};

export interface RemoteLessonStep {
  id: string;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const remoteLessonSteps: readonly RemoteLessonStep[] = [
  {
    id: "branch",
    title: "從 dev 切出功能分支",
    command: "git switch -c feature/remote-work",
    explanation: "把這次變更隔離在自己的分支，讓 dev 保持可整合。",
    takeaway: "先隔離工作，再開始累積歷史。",
  },
  {
    id: "commit",
    title: "留下可 review 的 commit",
    command: 'git commit -m "add remote lesson"',
    explanation: "commit 是可以被命名、比較與回復的變更快照。",
    takeaway: "一個 commit 只回答一件事。",
  },
  {
    id: "sync",
    title: "同步遠端基線",
    command: "git fetch origin dev",
    explanation: "fetch 更新本地的 origin/dev 參照，不會偷偷改動目前分支。",
    takeaway: "先知道遠端發生什麼，再決定怎麼整理。",
  },
  {
    id: "rebase",
    title: "把功能分支對齊最新 dev",
    command: "git rebase origin/dev",
    explanation: "rebase 將自己的 commit 接到最新遠端基線後面，讓待審查歷史保持清楚。",
    takeaway: "rebase 是整理自己的分支，不是覆寫遠端 dev。",
  },
  {
    id: "publish",
    title: "發布分支並建立 PR",
    command: "git push -u origin feature/remote-work",
    explanation: "遠端分支發布後，PR 才有可供 CI 與 review 使用的來源。",
    takeaway: "push 交付分支，PR 交付協作上下文。",
  },
] as const;

export type RemoteLabPhase = "initial" | "active" | "blocked" | "completed";
export type WorkingTree = "clean" | "dirty";
export type RemoteBranch = "absent" | "published";
export type PullRequest = "none" | "open" | "merged";
export type Checks = "not-run" | "pending" | "passed" | "failed";
export type SyncState = "stale" | "fetched" | "rebased";

export interface RemoteLabState {
  phase: RemoteLabPhase;
  remoteName: "origin";
  baseBranch: "dev";
  localBranch: "dev" | "feature/remote-work";
  workingTree: WorkingTree;
  localCommitCount: number;
  localBaseRef: "dev" | "origin/dev";
  syncState: SyncState;
  remoteBranch: RemoteBranch;
  pullRequest: PullRequest;
  checks: Checks;
  lastMessage: string;
  canReset: true;
}

export type RemoteLabEventType =
  | "inspect"
  | "branch"
  | "commit"
  | "fetch"
  | "rebase"
  | "push"
  | "open-pr"
  | "checks-pass"
  | "merge"
  | "reset";

export interface RemoteLabEvent {
  type: RemoteLabEventType;
}

export const remoteLabInitialState: RemoteLabState = {
  phase: "initial",
  remoteName: "origin",
  baseBranch: "dev",
  localBranch: "dev",
  workingTree: "clean",
  localCommitCount: 0,
  localBaseRef: "dev",
  syncState: "stale",
  remoteBranch: "absent",
  pullRequest: "none",
  checks: "not-run",
  lastMessage: "準備建立第一個遠端協作分支。",
  canReset: true,
};

export const remoteLabHappyPath: readonly RemoteLabEvent[] = [
  { type: "inspect" },
  { type: "branch" },
  { type: "commit" },
  { type: "fetch" },
  { type: "rebase" },
  { type: "push" },
  { type: "open-pr" },
  { type: "checks-pass" },
  { type: "merge" },
];
