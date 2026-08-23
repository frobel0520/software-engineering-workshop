# M6 Release Audit：Core 19/19

> 日期：2026-08-23
> Release source：`origin/dev` → `feature/release-19-19` → `main`
> Scope：RELEASE-001～RELEASE-007
> Status：Released

## 結論

Core 19 個 topic 全部為 `ready`，Extension 2 個 topic 維持獨立完成統計。完整 regression、Pages base build、route／progress audit、delivery topic browser smoke、`main` release 與 GitHub Pages live verification 均已完成。

## RELEASE-001：curriculum、registry、route、progress

- Core total：19。
- Core ready：19。
- Core ready IDs：`git`、`remote`、`cli`、`ide`、`package`、`env`、`build`、`rest`、`auth`、`sql`、`schema`、`index`、`postgresql`、`unit`、`integration`、`logs`、`docker`、`cicd`、`deploy`。
- Extension ready：`guardrail`、`problem-solving`，不污染 Core denominator。
- 每個 ready topic 都有 registry module、lesson route、Lab route、completion key 與 integration coverage。
- 最後兩個 completion key：`se-workshop-cicd-complete`、`se-workshop-deploy-complete`。

## RELEASE-002：既有功能回歸

- Git、Auth、既有 topic route、progress repository、protected completion keys 經完整 test suite 驗證。
- 19/19 denominator assertions 已同步更新；planned-topic aggregation test 改用明確的最小 planned curriculum，避免把 ready topic 當成 planned fixture。
- 未發現 conflict marker：`<<<<<<<`、`=======`、`>>>>>>>`。

## RELEASE-003／RELEASE-004：cross-topic UX、keyboard、mobile、reduced motion

- Docker、CI/CD、Deploy 的 Lesson → Lab route 可達；Lab 具有 reset、`aria-live` feedback、progressbar、native buttons/input 與 observable state。
- CI/CD browser smoke：green pipeline、test failure（lint／build 保持 `not-run`）、390×844 mobile、menu open/close、command input focus。
- Deploy browser smoke：green release、artifact blocked、probe failure → rollback、reset/replay completion、390×844 mobile、menu open/close、command input focus。
- CI/CD、Deploy mobile viewport 的 document width 為 375，viewport width 為 390，無水平溢出。
- CI/CD、Deploy topic styles 都包含 `prefers-reduced-motion` media rule；必要資訊不依賴動畫或顏色。
- Docker 的 desktop/mobile、failure、cleanup 與 keyboard smoke 已在 Docker topic integration 階段通過。

## RELEASE-005：automated gates

- `npm --prefix frontend test`：83 test files / 265 tests passed。
- `npm --prefix frontend run lint`：passed。
- `VITE_BASE=/software-engineering-workshop/ npm --prefix frontend run build`：passed。
- Pages build output `frontend/dist/index.html` 使用 `/software-engineering-workshop/assets/...` base path。
- `git diff --check`：passed。

## RELEASE-006：release、遠端狀態與 Pages

- `git merge-tree --write-tree origin/main origin/dev`：clean，未發現 merge conflict。
- M5 的 feature PR（Docker、CI/CD、Deploy）均經 `feature/* → dev`、required checks 與 squash merge。
- Release PR #90 已 squash merge 到 `main`，merge commit：`2838d34`。
- Publish workflow #16：`32611711879`，Success。
- GitHub Pages build/deploy #16：`32611742414`，Success；`origin/gh-pages`：`4204778`。
- Live site：[GitHub Pages](https://frobel0520.github.io/software-engineering-workshop/) 與 `#/deploy-lab` route smoke check 通過，頁面顯示 `19 / 19`。
- GitHub audit：0 open pull requests、0 open issues。

## RELEASE-007：文件交接

- README、project plan、project SA、project SD、task breakdown、accessibility checklist、acceptance contracts 與本 audit 對齊 19/19。
- M5 Delivery 與 M6 Hardening／Release 均標記 done。
- `CORE-008` 維持非阻塞 architecture follow-up，不阻擋本 release。

## Known follow-up

- GitHub Actions 顯示 Node.js 20 runtime deprecation warning（checkout、setup-node、upload-artifact）；本次不影響 workflow success，後續可獨立升級 action major version。
