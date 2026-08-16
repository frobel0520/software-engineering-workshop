# REMOTE-01：GitHub／GitLab 遠端協作 acceptance

> 類型：Topic acceptance／fixture contract
> 狀態：可供 REMOTE-02、REMOTE-03 開發
> 依賴：M0 project contract
> 範圍：瀏覽器內 deterministic simulator；不連線真實 GitHub／GitLab、不要求登入

本文件只鎖定遠端協作主題的學習目標、Lab pageflow、失敗狀態與 simulator 邊界，不新增 feature-level SA／SD。

## 1. 學習目標

完成主題後，學習者應能：

1. 分辨 local branch、remote-tracking branch 與 `origin`。
2. 在開始工作前用 `git fetch origin dev` 更新本地對遠端 `dev` 的認知。
3. 用 `git rebase origin/dev` 將功能分支對齊最新基線，再發布到遠端。
4. 用 `git push -u origin <feature-branch>` 建立可供 review 的遠端分支。
5. 理解 PR、CI、review、merge／auto-merge 的先後與檢查條件。

## 2. Pageflow 與 Lab happy path

```text
map → /remote lesson → /remote-lab
  → 建立功能分支與 commit
  → fetch origin/dev
  → rebase origin/dev
  → push -u origin feature/remote-work
  → 開 PR → CI 通過
  → merge 至 dev
  → completion treatment → map
```

Lab 的初始情境是在 `dev` 上準備開始工作。學習者需要先切出 `feature/remote-work` 並建立本地 commit，再完成同步、rebase、push 與 PR lifecycle；所有結果由 fixture 決定。

概念操作與 simulator event 的對應如下：

| 概念操作 | 教學指令／UI 動作 | event |
| --- | --- | --- |
| 檢查目前狀態 | `git status` | `inspect` |
| 建立功能分支 | `git switch -c feature/remote-work` | `branch` |
| 建立本地變更 | `git commit -m "add remote lesson"` | `commit` |
| 更新遠端基線資訊 | `git fetch origin dev` | `fetch` |
| 對齊遠端基線 | `git rebase origin/dev` | `rebase` |
| 發布功能分支 | `git push -u origin feature/remote-work` | `push` |
| 建立 pull request | 開啟 PR，base 為 `dev` | `open-pr` |
| 通過品質檢查 | CI checks pass | `checks-pass` |
| 合併功能 | merge PR 至 `dev` | `merge` |

## 3. Fixture contract

REMOTE-03 應以以下固定 fixture 作為初始狀態，不連線、不產生遠端副作用：

```ts
type RemoteLabPhase = "initial" | "active" | "blocked" | "completed";
type WorkingTree = "clean" | "dirty";
type RemoteBranch = "absent" | "published";
type PullRequest = "none" | "open" | "merged";
type Checks = "not-run" | "pending" | "passed" | "failed";
type SyncState = "stale" | "fetched" | "rebased";

interface RemoteLabState {
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
```

初始 fixture：

```ts
{
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
}
```

## 4. 失敗狀態與回饋

| 情境 | 結果 | 必須呈現的概念 |
| --- | --- | --- |
| 尚未 commit 就 fetch | 可接受，但保持 `localCommitCount = 0` | fetch 更新的是遠端參照，不等於提交變更 |
| 尚未 fetch 就 rebase | blocked，狀態不進入完成流程 | 先更新 `origin/dev`，再對齊 |
| 尚未 rebase 就 push | blocked，狀態不發布 | 功能分支需先確認基線；提示可能遇到 non-fast-forward |
| 尚未 push 就開 PR | blocked，PR 保持 `none` | PR 需要可被遠端看到的 branch |
| CI 尚未通過就 merge | blocked，PR 保持 `open` | merge 受 branch protection／checks 約束 |
| 任一非法 event | blocked 或保留原狀態，不可偽造進度 | 錯誤必須可讀，且不得破壞既有 session |

錯誤回饋至少要說明「目前狀態、下一步可做什麼」，不可只顯示顏色或例外訊息。

## 5. Completion contract

只有在下列條件全部成立時，Lab 才算完成：

- `localCommitCount > 0`。
- 已依序完成 `branch → commit → fetch → rebase → push → open-pr → checks-pass → merge`。
- `syncState = "rebased"`，表示本地已先取得並套用最新的 `origin/dev`。
- `remoteBranch = "published"`、`pullRequest = "merged"`、`checks = "passed"`。
- simulator 的 completion predicate 回傳 `true`，並寫入 `se-workshop-remote-complete`。

單獨完成 fetch、push、開 PR 或通過 CI 不得標記 topic 完成。reset 必須回到初始 fixture，清除本次 Lab 的 PR、checks 與 commit 狀態。

## 6. REMOTE-02／REMOTE-03 驗收向量

1. **happy path**：依固定順序完成所有 event，最後得到 `phase = "completed"`。
2. **順序錯誤**：在 fetch 前 rebase、在 push 前開 PR、在 checks 前 merge，均不得完成且回饋原因。
3. **reset**：完成或 blocked 後 reset，結果與初始 fixture deep-equal。
4. **determinism**：相同初始 state 加相同 event sequence，必須產生相同 state 與 feedback。

REMOTE-02 可依本文件的學習目標與指令 mapping 撰寫教材；REMOTE-03 必須維持上述 state、event、錯誤與 completion 邊界。真實 provider API、帳號、token、網路錯誤與多人 review 不在本 topic Phase 1 範圍內。
