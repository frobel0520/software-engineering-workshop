# DEPLOY-01：部署、版本與回滾驗收規格

> 狀態：Accepted for implementation
> 日期：2026-08-23
> Task：DEPLOY-01
> 上位契約：`docs/project-sa.md`、`docs/project-sd.md`

本文件鎖定部署主題的 release source、CI artifact、GitHub Pages publish、版本紀錄、回滾、部署後觀測與 deterministic feedback。後續 task 可以調整 TypeScript type 或視覺分段名稱，但不可改變本文件定義的 observable semantics。

## 1. 學習目標

完成本主題後，學習者應能：

1. 分辨 production artifact、Pages publish 與部署後可觀測狀態，不把「build 成功」當成「網站已上線」。
2. 讀懂部署 workflow 的 `main` trigger、`workflow_dispatch`、`frontend/dist` 與 `gh-pages` publish branch。
3. 理解 release source、版本識別、Pages base path 與 artifact provenance 的關係。
4. 在 artifact 缺失或部署驗證失敗時，保留 blocked／failed evidence，不把失敗版本誤標成 live。
5. 以固定 release scenario 練習成功發布、artifact 缺失與 rollback 到上一個可用版本。
6. 用部署狀態、live probe、release record 與 rollback evidence 判斷一次交付是否真的完成。

## 2. 教學邊界

本主題只呈現 deterministic deployment fixture，不啟動 GitHub Actions runner，不呼叫 GitHub API，不推送 `main` 或 `gh-pages`，不讀取 secrets，不連線真實 GitHub Pages，也不執行網路安裝。workflow、artifact、branch、URL、release version 與 probe result 都是可測試的教學資料。

fixture 以目前 repository 的 `.github/workflows/deploy-pages.yml` 為輸入快照：`main` push 或手動 dispatch 會在 `frontend` 安裝依賴、執行 test/build，將 `frontend/dist` 發布到 `gh-pages`。教學會顯示 workflow evidence，但不把遠端 Pages 即時狀態當成 Lab 結果。

本主題不重新定義 CI 的 test／lint／build gate；它只接收一個固定的 CI passed／artifact state，專注 release、publish、verify、record 與 rollback。真實 domain、DNS、CDN、帳號權限與維運告警留給後續產品決策。

## 3. Lesson／Lab Pageflow

```text
Deploy Lesson
  → release source、artifact 與 live site 的責任
  → 讀懂 Pages workflow、main trigger 與 gh-pages branch
  → 驗證 CI result、dist artifact 與 Pages base path
  → publish、live probe 與 release record
  → deployment failure 與上一個版本的 rollback
  → Deploy Lab
  → 選擇固定 release scenario
  → inspect deploy workflow
  → select main release
  → verify CI artifact
  → verify Pages base path
  → publish gh-pages
  → verify deployment
  → record release
  → evaluate release／rollback
  → 完成 success、missing artifact、rollback 三個 scenarios
  → reset 後重跑 green release regression
  → 標記 Deploy topic complete
```

## 4. Lesson outline

| Section | 要回答的問題 | 必須留下的判斷線索 |
| --- | --- | --- |
| Release boundary | build、publish、live verify 各保證什麼？ | build 產生 artifact；publish 更新部署來源；probe 才能證明指定版本可觀測。 |
| Workflow input | 部署為什麼只接受 release source？ | `main` push 或手動 dispatch 是 fixture input；學習 Lab 不把任意本機 branch 當 production source。 |
| Artifact provenance | `dist` 為什麼要和 base path 一起驗證？ | artifact 必須存在、來自通過 CI 的 source，且 Pages base path 與 repository path 一致。 |
| Publish boundary | gh-pages 更新代表什麼？ | publish 只表示部署分支被更新；仍需 live probe 與 release record，不可直接宣稱使用者可用。 |
| Rollback | 失敗版本怎樣退回？ | 保留失敗 release、指向上一個 verified version，記錄 rollback reason；不改寫失敗歷史。 |
| Observe and record | 怎樣知道交付完成？ | deployment status、live URL、probe、release version 與 branch pointer 共同形成 evidence。 |

## 5. Required scenarios

| Scenario | Fixture input | Fixture outcome | 教學重點 |
| --- | --- | --- | --- |
| `main-pages-success` | source `main`、CI passed、`dist` verified、Pages base path verified | `gh-pages` updated to `release-2026.08.23`；live probe 200；release `verified` | artifact、publish 與 live verification 必須全部完成，才是成功部署。 |
| `missing-artifact-blocked` | source `main`、CI passed、`dist` missing | publish blocked；`gh-pages` 保持上一個 verified version；release `blocked` | build／artifact 缺失時不可更新 Pages，也不可假裝 live。 |
| `rollback-after-probe-failure` | source `main`、new artifact verified、publish succeeded、live probe failed | release `release-2026.08.23` failed；rollback 到 `release-2026.08.16`；live probe 200 | rollback 指向上一個可用版本，保留失敗版本與原因。 |

每個 scenario 都必須讓學習者看見：release source、version、CI result、artifact、base path、Pages branch pointer、publish result、deployment status、live URL／probe、release record 與 rollback evidence；失敗時要看見未更新或已回復的邊界。

## 6. Deterministic deployment fixture

### 6.1 Workflow inputs

```ts
const deployFixture = {
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
```

固定 workflow evidence 如下；Lab 不執行它，只把每個設定當成可觀察 fixture：

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  publish:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm test && npm run build
        working-directory: frontend
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
      - uses: peaceiris/actions-gh-pages@v4
        with:
          publish_dir: ./frontend/dist
          publish_branch: gh-pages
```

### 6.2 Observable deployment stages

建議 simulator stage 順序為：

```text
inspect-workflow
  → select-release
  → verify-ci-artifact
  → verify-pages-base
  → publish-pages
  → verify-deployment
  → record-release
  → evaluate-release
```

固定 command／evidence contract：

| Stage | Command／input | Success evidence | Failure／not-run evidence |
| --- | --- | --- | --- |
| inspect workflow | `cat .github/workflows/deploy-pages.yml` | main trigger、workflow_dispatch、dist、gh-pages 可見 | 未 inspect 時不可選擇 release source |
| select release | `main → release-2026.08.23` | source、candidate version 與 previous verified version 可見 | 非 main source 應被阻擋 |
| verify CI artifact | `artifact: frontend/dist` | CI passed、dist exists、artifact provenance 可見 | artifact missing 時 publish 不可更新 gh-pages |
| verify Pages base | `VITE_BASE=/software-engineering-workshop/` | base path 與 repository path 一致 | base path mismatch 時 deployment blocked |
| publish Pages | `publish → gh-pages` | gh-pages pointer 指向 candidate version | artifact／base path 不完整時 branch 保持 previous version |
| verify deployment | `probe /software-engineering-workshop/` | live status 200、candidate version 可觀測 | probe failure 要保留 failed version，不宣稱 live |
| record release | `record release` | version、source、artifact、URL、status 完整 | 沒有 deployment evidence 時不可寫 verified record |
| evaluate release | `evaluate release / rollback` | verified 或 rolled-back 結論可見 | failed release 沒有 rollback evidence 時維持 blocked |

Fixture rules：

- 相同 initial state 加上相同 event sequence，必須得到相同 source、version、artifact、Pages pointer、deployment status、probe、release record 與 feedback。
- `missing-artifact-blocked` 只能改變 artifact outcome；不可同時改變 source、base path 或上一個 verified version。
- `rollback-after-probe-failure` 只能讓 candidate probe failed，並要求 rollback 指向 `currentVerifiedRelease`；不可刪除 failed release record。
- workflow、release command、URL、version 與 probe 都是固定文字／數值證據，不可執行 shell、網路、GitHub Actions 或 Pages API。
- reset 清除目前 candidate 的 publish／probe／record state，但保留 completed scenario audit 與 regression baseline。

## 7. Lab state boundary

後續 `DEPLOY-03` simulator 應能表達下列概念；欄位名稱可微調，但不可移除其可觀察語意：

```text
DeployLabState {
  phase: initial | inspecting | releasing | blocked | completed
  selectedScenarioId: main-pages-success | missing-artifact-blocked | rollback-after-probe-failure | null
  activeStageId: inspect-workflow | select-release | verify-ci-artifact | verify-pages-base
                 | publish-pages | verify-deployment | record-release | evaluate-release | null
  completedStageIds: readonly string[]
  releaseSource: main | null
  candidateVersion: string | null
  previousVerifiedVersion: string
  workflowState: unknown | inspected
  ciState: pending | passed | failed
  artifactState: missing | verified
  basePathState: unknown | verified | mismatch
  publishState: pending | published | blocked
  pagesBranchVersion: string
  deploymentState: pending | live | failed | rolled-back
  liveStatus: number | null
  liveUrl: string | null
  releaseRecord: none | verified | failed | rolled-back
  rollbackVersion: string | null
  completedScenarioIds: readonly string[]
  regressionVerified: boolean
  lastFeedback: string
  lastCommand: string | null
  reset(): void
}
```

失敗時保留已完成 stage 與第一個 failure boundary；不可把 artifact `missing` 變成 verified、把 `gh-pages` 指標移到未驗證版本，或在 probe failed 後直接顯示 live。

## 8. Failure feedback contract

- 未 inspect workflow 就選 release：阻擋，提示先確認 main trigger、artifact path 與 gh-pages branch。
- release source 不是 main：阻擋，指出 production fixture 只接受 `main` 或手動 dispatch 的 main release。
- CI 尚未 passed：阻擋，指出 Deploy 只接收 CI gate 結果，不重新偽造 test／build。
- artifact missing：保留 CI evidence，publish 與後續 live state 不得顯示成功，Pages pointer 保持 previous verified version。
- Pages base path mismatch：阻擋 publish，指出 repository path 與 Vite base path 必須一致。
- `rollback-after-probe-failure`：保留 candidate publish 與 probe failure，rollback 後才可將 Pages pointer 與 live status 指向 previous verified version。
- 沒有 release record 就 evaluate：阻擋，指出 version、source、artifact、URL 與 status 必須先被記錄。
- failed release 沒有 rollback：release 維持 blocked，不能宣稱 deployment complete。
- 已完成 scenario 再次操作：提示先 reset，避免 release output 與 branch pointer 重複累加。
- reset：清除目前 candidate 的 source、artifact、publish、probe、record 與 rollback state；保留 completed scenario audit 與 regression baseline。

## 9. Completion contract

只有下列條件全部成立時，Deploy Lab 才算完成：

- 三個 required scenarios 都完成各自的 terminal outcome。
- `main-pages-success` 顯示 candidate artifact、gh-pages publish、live status 200 與 verified release record。
- `missing-artifact-blocked` 顯示 artifact missing、publish blocked、Pages pointer 保持 previous verified version 與 blocked record。
- `rollback-after-probe-failure` 顯示 candidate probe failed、failed release record、rollback version、Pages pointer 回到 previous verified version 與 rolled-back record。
- reset 後重跑 green release，source、version、artifact、Pages pointer、probe、record 與 feedback 與第一次一致。
- 完成後使用 `se-workshop-deploy-complete` 保存進度。
- 本 task 只定義 contract；在 `DEPLOY-05` 前不得把 `deploy` 改成 curriculum `ready`。

單獨看見 `dist` 存在、gh-pages branch 更新、live URL 可開啟或 release record 存在，都不得單獨標記 Deploy topic 完成。

## 10. Out of scope

- 真實 GitHub Actions runner、GitHub API、GitHub Pages、branch push、release PR、review、secret、OIDC token 或第三方 action execution。
- 真實網路、DNS、CDN、domain、TLS、hosting quota、production traffic、monitoring provider 或 incident notification。
- 真實 npm registry、Node process、shell command、cache directory、Git history 或使用者 repository state。
- Docker、Kubernetes、artifact registry、container rollout、database migration 與 infrastructure-as-code；這些不屬於 Pages 基礎部署 fixture。
- 修改既有 `.github/workflows/deploy-pages.yml`、`.github/workflows/ci.yml`、branch protection 或共用 progress／route harness。

## 11. DEPLOY-01 驗收

- 文件明確描述 release／artifact／Pages／live probe／rollback boundary、workflow fixture、八個 observable stages、三個 scenarios、failure feedback、completion 與 out-of-scope。
- `DEPLOY-02` 可依本文件撰寫 lesson 與 workflow／artifact fixture，不需要重新決定 release source、version 或 Pages semantics。
- `DEPLOY-03` 可依本文件建立純 simulator；不需要真實 GitHub Pages、network、secret、shell 或 runner。
- `DEPLOY-04` 可依本文件設計 Lab 的 release selector、stage evidence、live probe、rollback、reset、keyboard、mobile 與 reduced-motion interaction。
- `DEPLOY-05` 可使用固定 completion key、route 與 progress contract 接入，且不改變既有 Docker、CI/CD 或其他 topic 的完成統計。
- 文件檢查與 `git diff --check` 通過；本 task 不要求重新執行完整 frontend test suite。

## 12. 已知 rework 風險

- 若未來要教 preview environment、canary、blue／green、multi-region 或非 Pages provider，應新增 acceptance contract，不偷換目前的單一 gh-pages branch boundary。
- 目前 live probe 只作為固定 status／URL evidence；若未來產品要求真實 uptime、RUM 或 alerting，需另立 provider 與隱私契約。
- 若 workflow 的 artifact path、base path、release branch 或 publish action 改變，應更新 fixture snapshot 與 integration contract；不可只更新畫面文字。
- 若 rollback 需要資料庫 migration、schema compatibility 或外部資源協調，應新增跨系統 release contract，不把真實 rollback side effect 帶入 Phase 1。
