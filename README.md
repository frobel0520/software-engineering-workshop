# Software Engineering Workshop

一個可以動手操作、也可以逐章擴充的軟體工程教材站。

網站：https://frobel0520.github.io/software-engineering-workshop/ （部署來源：`frobel0520/software-engineering-workshop`）

本站是 [Learning Atlas](https://frobel0520.github.io/learning-atlas/)「軟體工程」路線，導覽有返回 Learning Atlas 的連結（2026-09-25 起）。

> 開發狀態：Core／Extension 功能開發已完成，現在進入測試／驗收階段；除測試發現的問題外，不再新增功能。
> 自動化基線（2026-08-23）：84 個測試檔／279 個測試、TypeScript lint、production build 與 Pages build 均通過。
> 2026-08-25 依外部檢視修正桌面側欄無法捲動、行動版抽屜的鍵盤與無障礙問題，並加上 Playwright 導覽回歸測試（`frontend/e2e/`），CI 一併執行。

目前可操作的 Core 主題有 19 / 19 個：**Git**、**GitHub／GitLab 遠端協作**、**命令列**、**IDE／除錯器**、**套件管理**、**環境變數**、**建置工具**、**REST API／FastAPI**、**身分驗證／授權**、**SQL**、**資料庫設計**、**索引與交易**、**PostgreSQL**、**單元測試**、**整合測試**、**日誌**、**Docker 基礎**、**CI/CD**、**部署**；另有 2 個不計入 Core 進度的 Extension：**Guardrails**、**問題處理方法**。Core 19 個主題全部開放。

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
- 單元測試：用 unit boundary、Arrange／Act／Assert、red／green、edge case 與 regression suite 建立快速回饋。
- 整合測試：用 module contract、deterministic fixture、success／failure scenario 與 boundary evidence 驗證模組協作。
- 日誌：用結構化事件、severity、correlationId、safe context 與 redaction 留下可追蹤線索。
- CI/CD：用固定 workflow、trigger／ref、ordered gates、failure boundary、required check 與 merge gate 重跑交付檢查。
- 部署：用 main release、frontend/dist、GitHub Pages、live probe、release record 與 rollback 驗證可觀測交付。
- Guardrails Extension：模擬輸入、輸出與工具呼叫的安全防線，不連線真實模型。
- 問題處理 Extension：從問題定義、重現、蒐證、假設、錯誤邊界到驗證與預防復發。

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

瀏覽器端導覽回歸測試（Playwright，第一次需要先安裝 Chromium）：

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

CI 會依序執行 vitest、lint、正式建置與 Playwright 測試。GitHub Pages workflow 會發布 `frontend/dist`。

## 分支與發布

功能從 `feature/*` 進 `dev`，再由 `dev` 進 `main` 發布；`main` 受 ruleset 保護，必須經 PR 且通過必要檢查。`frontend/index.html` 載入 Harbor 維護腳本（`data-project="software-engineering-workshop"`，2026-09-15 起），Harbor 開啟維護模式時顯示維護畫面，連不上時頁面照常顯示。

## 架構

| 路徑 | 內容 |
| --- | --- |
| `shared/curriculum.json` | 19 個主題的唯一課程清單與完成狀態 |
| `frontend/src/content/` | 已完成教材內容 |
| `frontend/src/git/` | 可測試的 Git 模擬狀態機 |
| `frontend/src/components/` | 路線圖、教材與實驗場 UI |
| `frontend/e2e/` | Playwright 導覽回歸測試 |
| `docs/` | 專案計畫、SA、SD、任務拆解、各主題驗收紀錄與 release audit |
| `.github/workflows/ci.yml` | 測試、lint、正式建置與 Playwright |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 發布 |
