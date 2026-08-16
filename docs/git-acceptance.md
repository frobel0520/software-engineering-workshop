# GIT-REVIEW：Git 基礎與團隊協作 acceptance

> 類型：Git topic release gate／acceptance contract
> 狀態：Approved v1（2026-08-16）
> 依賴：M1 module foundation
> 範圍：瀏覽器內 deterministic Git／協作 simulator；不連線真實 GitHub、GitLab 或使用者 repository

## 0. 2026-08-16 release review checkpoint

本輪已完成 Git topic 的第一輪 release smoke check：

- Git Lesson 可進入 Git Lab；Git Lab 的錯誤指令會提供阻擋原因與下一步。
- `重設 Lab` 可回到 `0 / 17`；Git Lab 可返回課程地圖。
- Desktop 1280px、375px mobile 與 640px（200% zoom 的等效 CSS viewport）下均無水平溢出；375px 下 menu 可開關，Git Lab 的 reset、terminal input 與 17 個 workflow controls 均存在。
- Git Lab 使用原生 `button`、`form`、`select`，狀態與錯誤訊息已有 `aria-live`／`role="alert"`，進度有 `progressbar` 語意；CSS 已包含 `max-width: 720px` 的窄版規則與 `prefers-reduced-motion` 規則。

手動驗收已完成：使用實體鍵盤確認 `Tab`／`Enter`／`Space` 可操作 Git Lesson／Lab controls，並確認 terminal submit、reset、錯誤回饋與返回課程地圖流程；在 reduced-motion 偏好下，內容與操作仍完整。Git release gate 已核准。

本文件把 Git topic 的上線標準寫成可驗收條件。Git topic 不只教本地 commit；完成後，學習者應能在一般軟體專案中理解變更如何從工作目錄進入協作平台、CI pipeline 與合併流程。

## 1. 學習目標

完成 Git topic 後，學習者應能：

1. 說明工作目錄、暫存區、commit、branch、remote 與 hosted repository 的責任邊界。
2. 根據情境選擇本文件列出的 Git／平台操作，而不是只依照固定按鈕順序操作。
3. 以功能分支、清楚 commit、同步基線、發布分支與 PR／MR 完成一次可 review 的 cowork 流程。
4. 說明 commit、push、PR／MR、CI pipeline、merge 與部署之間的因果關係。
5. 遇到未提交修改、分支落後、衝突或需要移植單一修正時，能選擇 stash、fetch、rebase、merge 或 cherry-pick。

## 2. 必須理解的 12 項操作

| 操作 | 類型 | 何時使用 | 必須說清楚的邊界 |
| --- | --- | --- | --- |
| `git clone <url>` | Git CLI | 第一次把遠端 repository 複製到本機 | 建立本地 repository 與 remote 設定；不是建立 GitHub／GitLab fork |
| `git add <path>` | Git CLI | 挑選要放入下一個 commit 的修改 | 只更新暫存區，不等於 commit，也不會發布到遠端 |
| `git commit -m "..."` | Git CLI | 將暫存內容建立成可追蹤的本地快照 | 只存在本地歷史；不會自動 push、開 PR 或觸發遠端 CI |
| `git push` | Git CLI | 將本地 commit 發布到遠端 branch | 更新遠端 branch，可能觸發 push pipeline；不等於 merge 到 `dev`／`main` |
| `git pull` | Git CLI | 需要把遠端 branch 的變更整合進目前本地 branch | 通常是 fetch 加 merge 或 rebase；可能改變工作目錄，不能與 fetch 混為一談 |
| `git fetch` | Git CLI | 先取得遠端最新狀態，再決定如何整合 | 只更新 remote-tracking refs，不直接修改目前 branch 或工作檔案 |
| `git checkout` | Git CLI／legacy interface | 切換 branch，或從歷史取出檔案 | 現代 Git 通常用 `git switch` 切 branch、`git restore` 還原檔案；不得把 checkout 當成同步遠端 |
| `git rebase` | Git CLI | 將自己的功能分支接到最新基線後面 | 整理自己的 branch 歷史；可能改寫 commit ID，不應任意改寫已被他人共同使用的 branch |
| `git merge` | Git CLI | 將一條 branch 的歷史整合進目前 branch | 可能產生 merge commit 或衝突；不等於把工作發布到遠端 |
| `git stash` | Git CLI | 暫時收起未完成修改，以便切換 branch 或處理緊急工作 | 是暫存工作，不是正式歷史；之後必須知道如何恢復或清理 stash |
| `fork` | GitHub／GitLab platform | 沒有原 repository 寫入權限時建立自己的 hosted copy | 不是 Git CLI 指令；fork 後通常 clone 自己的 copy，再以 upstream／PR／MR 協作 |
| `git cherry-pick <commit>` | Git CLI | 將單一既有 commit 移植到目前 branch，例如挑選 hotfix | 會建立新的 commit；不是整條 branch merge，也可能產生衝突與重複修正 |

`checkout` 必須同時教 legacy 形式與現代替代方式，例如 `git checkout -b feature/x` 對應 `git switch -c feature/x`；`git checkout -- file` 對應 `git restore file`。

## 3. Pageflow 與 cowork happy path

```text
課程地圖
  → Git Lesson：理解本地狀態與操作選擇
  → Git Lab：clone／branch／add／commit／fetch／rebase／push
  → PR／MR Lesson：理解 review 與 pipeline
  → Pipeline Lab：觀察 commit／push 後的檢查與部署結果
  → merge／完成判定
  → 回到課程地圖
```

建議的一般軟體專案情境：

1. 從既有 repository `clone`；若無寫入權限，先 `fork` 再 clone 自己的 copy。
2. 從 `dev` 或指定基線建立功能 branch；可用 `checkout`／`switch`。
3. 修改檔案，用 `git diff` 檢查，再用 `add` 與 `commit` 留下小而完整的變更。
4. 若本地有未完成修改但需要切換任務，使用 `stash`；若需要移植單一修正，使用 `cherry-pick`。
5. 發布前用 `fetch` 取得遠端狀態，再用 `rebase` 或 `merge` 整合；確認後 `push`，建立 PR／MR。

Lab 必須讓學習者在至少一個分支錯誤情境中做選擇，而不是只能依序點擊唯一正確按鈕。

## 4. Commit／push／pipeline 實際發生什麼事

| 時點 | 本地或平台事件 | 學習者必須觀察到的結果 |
| --- | --- | --- |
| `commit` | Git 將暫存內容寫入本地 object database，並移動目前 branch ref | 本地歷史增加；遠端看不到；不會自動執行 GitHub／GitLab pipeline |
| `push` | Git 將缺少的 objects 與 branch ref 傳到 hosted repository | 遠端 branch 更新；平台可以收到 push event；其他人能看到新的 branch／commit |
| PR／MR 建立或更新 | 平台比較 source branch 與 target branch，建立 review context | 顯示 diff、commit、review 對話與 required checks；GitHub 使用 PR，GitLab 使用 Merge Request |
| pipeline 觸發 | 平台依 workflow／`.gitlab-ci.yml` 規則建立 pipeline 與 jobs | 學習者能看到 pending／running／passed／failed，而不是只有一個抽象的 CI 按鈕 |
| job 執行 | runner checkout 指定 commit，安裝依賴並執行檢查 | 本專案現行 CI 是 `checkout → setup Node → npm ci → npm test → npm run lint → npm run build` |
| merge | 平台在 required checks、review 與 branch protection 通過後整合 source branch | target branch 出現整合結果；push 到 `main` 可再觸發部署流程 |
| Pages deploy | deploy workflow 建置並發布靜態輸出 | 本專案現行流程是 `main push → test/build → publish frontend/dist to gh-pages` |

GitHub 與 GitLab 的名稱可以不同，但教材必須保留共同概念：hosted repository、source／target branch、PR／MR、pipeline、job、runner、required check、merge gate 與 deployment。

## 5. Fixture contract

Git／pipeline simulator 應使用下列可重設 fixture，不連線外部 provider：

```ts
type GitReleasePhase = "initial" | "local" | "published" | "review" | "blocked" | "merged";
type WorkingTreeState = "clean" | "dirty" | "staged";
type PipelineState = "not-started" | "pending" | "running" | "passed" | "failed";
type ReviewState = "none" | "open" | "approved" | "merged";

interface GitReleaseState {
  phase: GitReleasePhase;
  provider: "github" | "gitlab";
  localBranch: "dev" | "feature/profile";
  targetBranch: "dev" | "main";
  workingTree: WorkingTreeState;
  localCommitCount: number;
  remoteBranch: "absent" | "published";
  review: ReviewState;
  pipeline: PipelineState;
  pipelineJobs: readonly ("checkout" | "install" | "test" | "lint" | "build")[];
  stashCount: number;
  selectedCommit: string | null;
  lastMessage: string;
  canReset: true;
}
```

初始狀態必須表示：位於 `dev`、工作目錄乾淨、沒有功能 branch、沒有遠端 branch、沒有 PR／MR、pipeline 尚未開始。

## 6. 失敗情境與回饋

| 情境 | 結果 | 必須教會的判斷 |
| --- | --- | --- |
| 未 `add` 就 `commit` | commit 不包含未暫存修改 | commit 只記錄暫存區內容 |
| 未 `fetch` 就直接 rebase | blocked 或提示基線可能過期 | 先取得遠端認知，再整理歷史 |
| 工作目錄 dirty 時切換 branch | blocked，或要求先 stash／commit | 不要用 checkout 藏掉未完成修改 |
| 未 push 就建立 PR／MR | blocked | hosted platform 看不到本地 commit |
| pipeline 尚未通過就 merge | blocked | merge gate 由 checks／review／branch protection 控制 |
| rebase 已共享的 branch | warning／blocked | 改寫他人正在使用的歷史有協作風險 |
| cherry-pick 不存在的 commit | failed，state 不產生部分套用 | 先確認 commit ID 與來源歷史 |
| merge 或 cherry-pick 發生衝突 | conflict state，不能偽造完成 | 使用者必須理解解衝突後才能繼續 |

每個錯誤回饋都要說明目前狀態、原因與下一步；不可只顯示顏色、錯誤代碼或「操作失敗」。

## 7. 完成條件

Git topic 只有在下列條件全部成立時，才能標記 ready／complete：

- Lesson 明確解釋 12 項操作的用途、使用時機與不可混淆的邊界。
- Lab 至少覆蓋 local change → commit → remote publish → PR／MR → pipeline → merge 的完整閉環。
- Lab 至少讓學習者練習 `stash`、`cherry-pick`、`fetch`／`pull` 差異與一個 conflict／blocked 情境。
- Pipeline UI 能顯示 job 階段與結果，並連結到本專案實際的 test／lint／build／Pages 概念。
- GitHub PR 與 GitLab Merge Request 的共同概念與名稱差異有明確說明。
- reset、determinism、completion、keyboard、mobile 與錯誤回饋均有測試或手動驗收紀錄。

Git v1 已把 12 項操作、cowork pipeline、pipeline jobs、stash／cherry-pick、conflict／retry 與 GitHub／GitLab provider terminology 接入 Lesson／Lab；仍需完成完整 keyboard、mobile、reduced-motion 與 release review，才能將本文件狀態改為 approved。
