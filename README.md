# Software Engineering Workshop

一個可以動手操作、也可以逐章擴充的軟體工程教材站。

目前部署來源：`frobel0520/software-engineering-workshop`。

目前可操作的 Core 主題有 9 / 19 個：**Git**、**GitHub／GitLab 遠端協作**、**命令列**、**IDE／除錯器**、**套件管理**、**環境變數**、**建置工具**、**REST API／FastAPI**、**身分驗證／授權**；另有 1 個不計入 Core 進度的 Extension：**Guardrails**。其餘 Core 主題保留在課程路線圖。

## Git 單元

- Git Lesson：涵蓋 `clone`、`add`、`commit`、`push`、`pull`、`fetch`、`checkout`、`rebase`、`stash`、`cherry-pick`、`merge` 與 GitHub／GitLab `fork`。
- 指令式 cowork Lab：親自走過 local history → remote branch → PR／MR → pipeline → merge。
- Pipeline fixture：顯示 `checkout`、`npm ci`、`test`、`lint`、`build` jobs 與 conflict／retry 情境。
- 確定性的瀏覽器模擬引擎，不會動到使用者電腦上的真實 repository。
- 進度保存在瀏覽器；每個已開放主題完成 Lab 後，才會標記該主題完成。

## Auth 單元

- Entra ID、OIDC、SSO 與七個 App Registration 設定值。
- 假資料驅動的設定判斷與 Authorization Code + PKCE 流程 Demo。
- 不連線 Microsoft、不處理真實帳號或 Secret。

## 其他已開放主題

- 遠端協作：模擬 `branch → commit → fetch → rebase → push → PR → CI → merge` 閉環。
- 命令列：在固定 fixture 中練習工作目錄、檔案讀取、搜尋與檢查流程。
- IDE／除錯器：模擬 breakpoint、paused frame、variables、step over 與 continue。
- 套件管理：練習 manifest、lockfile、registry 與 deterministic install 狀態。
- 環境變數：練習 `.env.example`、`.env.local`、Vite 公開邊界、fail-fast 驗證與 git 保護。
- 建置工具：練習 TypeScript gate、Vite production bundle、GitHub Pages base path、dist artifact 與 preview。
- REST API／FastAPI：逐行追蹤 React fetch、routing、validation、dependency、SQLModel／SQLite 與 JSON response。
- Guardrails Extension：模擬輸入、輸出與工具呼叫的安全防線，不連線真實模型。

## 本機啟動

```bash
cd frontend
npm install
npm run dev
```

開啟 http://localhost:5173。

## 驗證

```bash
cd frontend
npm test
npm run build
```

CI 會執行測試、TypeScript 型別檢查與正式建置。GitHub Pages workflow 會發布 `frontend/dist`。

## 架構

| 路徑 | 內容 |
| --- | --- |
| `shared/curriculum.json` | 19 個主題的唯一課程清單與完成狀態 |
| `frontend/src/content/` | 已完成教材內容 |
| `frontend/src/git/` | 可測試的 Git 模擬狀態機 |
| `frontend/src/components/` | 路線圖、教材與實驗場 UI |
| `.github/workflows/ci.yml` | 測試與正式建置 |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 發布 |
