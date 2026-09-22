import type { LessonOrientation } from "../topics/types";

export const gitOrientation: LessonOrientation = {
  what: "Git 是分散式版本控制系統：它把檔案變更保存成可命名、可比較、可回復的本地歷史。",
  why: "使用 Git 可以追蹤誰在什麼時候為什麼修改，安全地試驗與回復，並讓團隊用 branch、review 和 merge 協作。",
  when: "需要多人共同修改程式、保留變更脈絡、平行開發功能、處理衝突，或在發布前檢查歷史時使用 Git。",
  how: "從工作目錄整理修改，用 add 放進 staging、commit 留下快照，再以 branch 隔離工作、push 發布，透過 PR／MR review 後 merge。",
};

export const gitLessons = [
  {
    number: "01",
    title: "Commit 是一個可命名的時間點",
    body: "Git 不只是備份檔案。每次 commit 都保存一組完整狀態，並記錄它從哪個狀態演進而來。好的 commit 小而完整，訊息說明為什麼改。",
    command: 'git commit -m "add profile page"',
    takeaway: "先讓變更可以被解釋，再讓它可以被回復。",
  },
  {
    number: "02",
    title: "先挑選，再提交",
    body: "工作目錄是你正在修改的現場；staging area 是下一個 commit 的草稿。git add 不是存檔，而是把特定版本的檔案放進草稿。",
    command: "git add app.js",
    takeaway: "一個 commit 只回答一件事，review 才看得懂。",
  },
  {
    number: "03",
    title: "分支是會移動的標籤",
    body: "branch 不是另一份資料夾，而是一個指向 commit 的名稱。切出功能分支後，你可以獨立前進；merge 再把兩條歷史接回來。",
    command: "git switch -c feature/avatar",
    takeaway: "隔離進行中的工作，讓 main 保持可交付。",
  },
] as const;

export const gitCommandGuide = [
  {
    id: "clone",
    title: "先把專案帶到本機",
    command: "git clone <url>",
    body: "第一次參與既有專案時，用 clone 建立本地 repository，同時設定 origin。若你沒有原 repository 的寫入權限，先在 GitHub／GitLab fork，再 clone 自己的 copy。",
    when: "第一次開始一個既有 repository；fork 是平台動作，不是 Git 指令。",
    takeaway: "clone 複製專案；fork 建立 hosted copy。",
  },
  {
    id: "checkout",
    title: "切換你要工作的分支",
    command: "git checkout -b feature/profile",
    body: "checkout 的 legacy 用法可以建立並切換分支。現代 Git 通常用 git switch -c feature/profile；checkout 也能從歷史取出檔案，這正是它容易讓人混淆的地方。",
    when: "開始功能工作或切換既有分支；只想還原檔案時改用 git restore。",
    takeaway: "切換分支前先確認未提交修改，不要把 checkout 當成同步遠端。",
  },
  {
    id: "add",
    title: "挑選這次要提交的修改",
    command: "git add src/profile.ts",
    body: "add 把指定檔案的目前版本放進 staging area。它不是存檔，也不會建立 commit；你可以用它把一個大修改拆成幾個可 review 的單位。",
    when: "準備建立 commit，且只想提交部分檔案或部分變更。",
    takeaway: "先挑選，再提交；staging 是下一個 commit 的草稿。",
  },
  {
    id: "commit",
    title: "留下可追蹤的本地快照",
    command: 'git commit -m "add profile page"',
    body: "commit 將暫存內容寫進本地歷史，形成可比較、可回復、可 review 的變更單位。commit 完成後，遠端與其他 coworker 還看不到它。",
    when: "一組完整且能說明目的的變更已經準備好。",
    takeaway: "commit 是本地歷史，不是發布，也不會自動觸發遠端 CI。",
  },
  {
    id: "stash",
    title: "暫時收起還沒完成的工作",
    command: "git stash",
    body: "stash 把未完成的工作暫時收起，讓工作目錄回到乾淨狀態。它適合切換任務或處理緊急修正，但不是正式歷史，也不是團隊共享的備份。",
    when: "手上的修改還不能 commit，卻必須先切換分支或處理另一件事。",
    takeaway: "stash 是暫存工作；回來後要用 stash pop 或 stash apply 恢復。",
  },
  {
    id: "fetch",
    title: "先更新你對遠端的認知",
    command: "git fetch origin",
    body: "fetch 下載遠端最新的 objects 與 branch 參照，更新 origin/dev 等 remote-tracking branch，但不直接修改你目前的工作檔案。",
    when: "要比較遠端進度、準備 rebase／merge，或先確認 coworker 是否已發布新 commit。",
    takeaway: "fetch 只更新參照；它不會替你整合變更。",
  },
  {
    id: "pull",
    title: "取得並整合遠端變更",
    command: "git pull --rebase origin dev",
    body: "pull 通常等於 fetch 加上 merge 或 rebase，會把遠端變更整合進目前分支，因此可能改變工作目錄。團隊應明確知道專案採 merge 還是 rebase，避免每個人得到不同歷史。",
    when: "你確定要把遠端變更直接整合到目前分支，而不是只先觀察遠端狀態。",
    takeaway: "pull 會整合；fetch 只觀察。",
  },
  {
    id: "rebase",
    title: "把自己的分支接到最新基線",
    command: "git rebase origin/dev",
    body: "rebase 將自己的 commit 重新接到最新 origin/dev 後面，讓待審查歷史更直。它可能改寫 commit ID，不應任意對已被多人共用的 branch 使用。",
    when: "發布功能分支前，想先整理自己的歷史並提早發現衝突。",
    takeaway: "rebase 整理自己的分支，不是覆寫遠端 dev。",
  },
  {
    id: "cherry-pick",
    title: "只移植一個特定修正",
    command: "git cherry-pick a1b2c3d",
    body: "cherry-pick 把指定 commit 的變更套用到目前分支，並建立一個新的 commit。它適合把 hotfix 或單一修正移植到另一條 release branch。",
    when: "只需要某一個 commit，不想把整條功能分支 merge 進來。",
    takeaway: "cherry-pick 移植單一 commit；可能造成衝突或重複修正。",
  },
  {
    id: "push",
    title: "把本地歷史發布給團隊",
    command: "git push -u origin feature/profile",
    body: "push 將本地缺少的 objects 與 branch ref 傳到 hosted repository。遠端 branch 更新後，其他人、PR／MR 與 CI 才能看到這組 commit。",
    when: "本地 commit 已整理好，準備讓 coworker review 或觸發平台流程。",
    takeaway: "push 發布 branch，不等於 merge 到 dev 或 main。",
  },
  {
    id: "merge",
    title: "把兩條歷史整合起來",
    command: "git merge feature/profile",
    body: "merge 將指定分支的歷史整合到目前分支，可能產生 merge commit，也可能需要解決衝突。平台上的 PR／MR merge 是同一個概念加上 review、checks 與權限規則。",
    when: "功能分支已 review 且通過 required checks，要整合進 dev 或 main。",
    takeaway: "merge 是整合歷史；先確認 review、CI 與 branch protection。",
  },
  {
    id: "fork",
    title: "沒有寫入權限時先建立副本",
    command: "Fork repository → git clone <your-url>",
    body: "fork 是 GitHub／GitLab 上的 hosted copy，常用於沒有原 repository 寫入權限的協作者。你 clone 自己的 fork，再透過 upstream 與 PR／MR 把變更送回原專案。",
    when: "外部 contributor 或跨團隊協作者需要在沒有直接 push 權限的情況下貢獻。",
    takeaway: "fork 是平台上的權限與協作邊界；不是本地 branch。",
  },
] as const;

export const gitPipeline = [
  ["commit", "本地歷史增加", "只改變本地 repository，遠端與 CI 還看不到。"],
  ["push", "遠端 branch 更新", "hosted repository 收到 objects 與 branch ref。"],
  ["PR／MR", "建立 review context", "平台比較 source／target branch，等待 review 與 checks。"],
  ["pipeline", "runner 執行 jobs", "checkout、npm ci、test、lint、build 產生可讀結果。"],
  ["merge", "整合到 dev／main", "required checks 與權限通過後，平台才整合歷史。"],
  ["deploy", "發布靜態產品", "本專案 push 到 main 後再建置並發布 frontend/dist。"],
] as const;

export const gitWorkflow = [
  ["工作目錄", "修改尚未選入下一次提交"],
  ["暫存區", "下一個 commit 的精確草稿"],
  ["Repository", "已命名、可追溯的歷史"],
] as const;
