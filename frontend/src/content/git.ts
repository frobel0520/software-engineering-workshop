export const gitLessons = [
  {
    number: "01",
    eyebrow: "SNAPSHOT",
    title: "Commit 是一個可命名的時間點",
    body: "Git 不只是備份檔案。每次 commit 都保存一組完整狀態，並記錄它從哪個狀態演進而來。好的 commit 小而完整，訊息說明為什麼改。",
    command: 'git commit -m "add profile page"',
    takeaway: "先讓變更可以被解釋，再讓它可以被回復。",
  },
  {
    number: "02",
    eyebrow: "STAGING AREA",
    title: "先挑選，再提交",
    body: "工作目錄是你正在修改的現場；staging area 是下一個 commit 的草稿。git add 不是存檔，而是把特定版本的檔案放進草稿。",
    command: "git add app.js",
    takeaway: "一個 commit 只回答一件事，review 才看得懂。",
  },
  {
    number: "03",
    eyebrow: "BRANCH",
    title: "分支是會移動的標籤",
    body: "branch 不是另一份資料夾，而是一個指向 commit 的名稱。切出功能分支後，你可以獨立前進；merge 再把兩條歷史接回來。",
    command: "git switch -c feature/avatar",
    takeaway: "隔離進行中的工作，讓 main 保持可交付。",
  },
] as const;

export const gitWorkflow = [
  ["工作目錄", "修改尚未選入下一次提交"],
  ["暫存區", "下一個 commit 的精確草稿"],
  ["Repository", "已命名、可追溯的歷史"],
] as const;
