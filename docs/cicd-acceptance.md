# CICD-01：CI/CD 基礎驗收規格

> 狀態：Accepted for implementation
> 日期：2026-08-23
> Task：CICD-01
> 上位契約：`docs/project-sa.md`、`docs/project-sd.md`

本文件鎖定 CI/CD 主題的 learning boundary、workflow fixture、trigger／ref、job step、required check、merge gate、失敗回饋與完成邊界。後續 task 可以調整 TypeScript type 或視覺分段名稱，但不可改變本文件定義的 observable semantics。

## 1. 學習目標

完成本主題後，學習者應能：

1. 分辨 CI 的自動檢查與 CD 的可重複交付流程，不把「有 workflow」當成「所有步驟都成功」。
2. 讀懂 workflow trigger，知道 push、pull request 與手動 dispatch 會在什麼 ref 上啟動哪些 fixture job。
3. 理解 checkout、Node setup／cache、install、test、lint、build 的順序與 gate 責任。
4. 以 required check 判斷 pull request 是否可以進入 merge，而不是只看某個單獨 step 的綠色結果。
5. 分辨 test failure 與 build failure 的 evidence，知道下游 step 在 job failure 後不應被偽造為已執行。
6. 用固定的 success／failure scenario 重跑 pipeline，理解 reset、retry 與 deterministic feedback 的關係；本 Lab 不連接真實 GitHub Actions。

## 2. 教學邊界

本主題只呈現 deterministic workflow fixture，不啟動 GitHub Actions runner，不呼叫 GitHub API，不建立真實 pull request，不推送 branch，不讀取 repository secrets，也不執行網路安裝。command、job status、check result 與 merge status 都是可測試的教學資料。

fixture 以目前 repository 的 `.github/workflows/ci.yml` 為輸入快照：pull request 目標為 `dev` 或 `main` 時執行 frontend job；push 與 workflow dispatch 也可啟動同一個檢查 job。教學會顯示 workflow evidence，但不把目前遠端 CI 的即時狀態當成 Lab 結果。

本主題只教 CI gate 與 CD pipeline 的可觀察順序。GitHub Pages 的正式 publish、release branch、rollback 與部署後觀測留給 `DEPLOY-01`，不在本 contract 偷換範圍。

## 3. Lesson／Lab Pageflow

```text
CI/CD Lesson
  → CI、CD 與 pipeline gate 的責任
  → 讀懂 workflow trigger 與 branch ref
  → checkout、Node setup、cache 與 npm ci
  → test → lint → build 的 fail-fast 順序
  → required check 與 pull request merge gate
  → CICD Lab
  → 選擇固定 trigger／failure scenario
  → inspect workflow
  → checkout source
  → install dependencies
  → run test
  → run lint
  → run build
  → publish required check
  → 判斷 mergeable／blocked
  → 完成 success、test failure、build failure 三個 scenarios
  → reset 後重跑 green pipeline regression
  → 標記 CI/CD topic complete
```

## 4. Lesson outline

| Section | 要回答的問題 | 必須留下的判斷線索 |
| --- | --- | --- |
| CI／CD boundary | CI 與 CD 各自保證什麼？ | CI 驗證變更可合併；CD 將已驗證版本交給可追蹤的交付流程，不等於每次都直接 production deploy。 |
| Trigger／ref | 為什麼同一份 workflow 需要知道 event 與 branch？ | `pull_request` 的 base ref、`push` 的 branch ref 與 `workflow_dispatch` 都是 pipeline input，不能混為單一目前分支。 |
| Checkout／setup | runner 怎樣取得一致的輸入？ | checkout source、Node 22、npm cache 與 `frontend/package-lock.json` 共同固定安裝 context。 |
| Install | `npm ci` 為什麼不是可省略的暖身步驟？ | lockfile 驅動可重現依賴；install failure 應在 test 前停止，不能用上一輪 node_modules 假裝成功。 |
| Test／lint／build | 三個 gate 的順序如何解讀？ | test 先驗證行為，lint 驗證 TypeScript，build 驗證 production artifact；前一步失敗時下游維持 not-run。 |
| Required check | 綠色 job 為什麼會影響 merge？ | `frontend` required check 必須 passed；failure 會讓 merge gate blocked，即使 branch 本身沒有 conflict。 |
| Retry／feedback | 失敗後怎樣安全重跑？ | 保留失敗 boundary、reset fixture、修正輸入後重跑；不可累加舊 job output 或把 failure 改寫成 success。 |

## 5. Required scenarios

| Scenario | Fixture input | Fixture outcome | 教學重點 |
| --- | --- | --- | --- |
| `pull-request-green` | event `pull_request`、base `dev`、test／lint／build 全部 pass | `frontend` required check passed，merge gate `mergeable` | 完整 CI gate 通過才表示 pull request 可以進入 merge。 |
| `pull-request-test-failure` | event `pull_request`、base `dev`、test fixture failed | test `failed`；lint／build `not-run`；required check failed；merge gate blocked | 不把下游未執行的 steps 畫成綠色，先保留第一個 failure boundary。 |
| `pull-request-build-failure` | event `pull_request`、base `dev`、test／lint pass、build fixture failed | build `failed`；required check failed；merge gate blocked | test 與 lint 綠色不能掩蓋 production build failure。 |

每個 scenario 都必須讓學習者看見：trigger event、target ref、workflow step、job status、每個 step 的 passed／failed／not-run、required check 與 merge gate；失敗時要看見下游沒有產生的結果。

## 6. Deterministic workflow fixture

### 6.1 Workflow inputs

```ts
const cicdFixture = {
  workflowPath: ".github/workflows/ci.yml",
  workflowName: "CI",
  jobId: "frontend",
  requiredCheck: "frontend",
  nodeVersion: "22",
  cacheDependencyPath: "frontend/package-lock.json",
  workingDirectory: "frontend",
  targetRefs: ["dev", "main"],
} as const;
```

固定 workflow evidence 如下；Lab 不執行它，只把每個設定當成可觀察 fixture：

```yaml
on:
  push:
  pull_request:
    branches: [dev, main]
  workflow_dispatch:

jobs:
  frontend:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm test
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
```

### 6.2 Observable pipeline stages

建議 simulator stage 順序為：

```text
inspect-workflow
  → select-trigger
  → checkout-source
  → install-dependencies
  → run-test
  → run-lint
  → run-build
  → publish-required-check
  → evaluate-merge-gate
```

固定 command／evidence contract：

| Stage | Command／input | Success evidence | Failure／not-run evidence |
| --- | --- | --- | --- |
| inspect workflow | `cat .github/workflows/ci.yml` | workflow `CI`、job `frontend`、required check `frontend` | 未檢查 workflow 時不能選擇 pipeline input |
| select trigger | `pull_request → dev` | event、base ref、target branch 可見 | 未支援的 event 或 ref 要被阻擋 |
| checkout source | `actions/checkout@v4` | source ref `fixture/feature` 已取得 | checkout 未完成時 install 為 not-run |
| install dependencies | `npm ci` in `frontend` | lockfile、Node 22、cache key 可見 | install failure 時 test／lint／build 都是 not-run |
| run test | `npm test` | test status `passed` | test failure 停在行為 gate，下游維持 not-run |
| run lint | `npm run lint` | TypeScript lint status `passed` | lint failure 停在型別 gate，build 維持 not-run |
| run build | `npm run build` | production build status `passed`、artifact `dist/` | build failure 保留 artifact `missing`，required check failed |
| publish check | `frontend` | required check `passed` | 任一 gate failure → required check `failed` |
| merge gate | `evaluate merge gate` | `mergeable` | required check failure → `blocked` |

Fixture rules：

- 相同 initial state 加上相同 event sequence，必須得到相同 trigger、ref、step status、check result、merge status 與 feedback。
- `pull-request-test-failure` 只能改變 test fixture outcome；不可同時改變 lint／build 的輸入或偽造下游 output。
- `pull-request-build-failure` 只能改變 build fixture outcome；test／lint 必須保留 passed，build artifact 必須保持 missing。
- `npm ci`、`npm test`、`npm run lint`、`npm run build` 都是固定文字證據，不可執行使用者電腦上的 shell、Node、網路或 GitHub runner。
- cache 只表達可重複安裝的 metadata，不產生跨 scenario 的隱藏 state；reset 後 cache evidence 應回到 fixture 起點。

## 7. Lab state boundary

後續 `CICD-03` simulator 應能表達下列概念；欄位名稱可微調，但不可移除其可觀察語意：

```text
CicdLabState {
  phase: initial | inspecting | running | blocked | completed
  selectedScenarioId: pull-request-green | pull-request-test-failure | pull-request-build-failure | null
  activeStageId: inspect-workflow | select-trigger | checkout-source | install-dependencies
                 | run-test | run-lint | run-build | publish-required-check
                 | evaluate-merge-gate | null
  completedStageIds: readonly string[]
  triggerEvent: pull_request | push | workflow_dispatch | null
  targetRef: dev | main | null
  workflowState: unknown | inspected
  installState: not-run | passed | failed
  testState: not-run | passed | failed
  lintState: not-run | passed | failed
  buildState: not-run | passed | failed
  artifactState: missing | created
  requiredCheck: pending | passed | failed
  mergeGate: pending | mergeable | blocked
  completedScenarioIds: readonly string[]
  regressionVerified: boolean
  lastFeedback: string
  lastCommand: string | null
  reset(): void
}
```

失敗時保留已完成 stage 與第一個 failure boundary；不可把 `not-run` 變成 `failed`，也不可在 required check failed 後顯示 `mergeable`。

## 8. Failure feedback contract

- 未 inspect workflow 就選 trigger：阻擋，提示先確認 workflow、job 與 required check。
- 沒有選擇支援的 trigger／target ref：阻擋，列出 `pull_request → dev/main`、`push` 或 `workflow_dispatch` 的 fixture boundary。
- 未 checkout 就 install：阻擋，指出 source ref 尚未取得。
- install failure：保留 lockfile／Node／cache evidence，test、lint、build 都是 not-run。
- `pull-request-test-failure`：保留 test failure，lint／build 不顯示成功，required check 為 failed、merge gate 為 blocked。
- 未通過 test 就執行 lint 或 build：阻擋，指出 pipeline 順序與目前第一個 failure。
- `pull-request-build-failure`：保留 test／lint passed、build failed 與 artifact missing，required check 為 failed。
- required check failed：merge gate 只能是 blocked；branch 無 conflict 也不能越過 required check。
- 已完成 scenario 再次操作：提示先 reset，避免 job output 與 stage state 重複累加。
- reset：清除目前 scenario 的 trigger、ref、step status、check、merge gate 與 feedback；保留已完成 scenario audit 與 regression baseline。

## 9. Completion contract

只有下列條件全部成立時，CI/CD Lab 才算完成：

- 三個 required scenarios 都完成各自的 terminal outcome。
- `pull-request-green` 顯示完整 stage、required check passed 與 mergeable。
- `pull-request-test-failure` 顯示 test failed、lint／build not-run、required check failed 與 merge gate blocked。
- `pull-request-build-failure` 顯示 test／lint passed、build failed、artifact missing、required check failed 與 merge gate blocked。
- reset 後重跑 green pipeline，trigger、ref、stage status、check、merge gate 與 feedback 與第一次一致。
- 完成後使用 `se-workshop-cicd-complete` 保存進度。
- 本 task 只定義 contract；在 `CICD-05` 前不得把 `cicd` 改成 curriculum `ready`。

單獨看見 workflow 存在、test passed、required check passed 或 branch 沒有 conflict，都不得單獨標記 CI/CD topic 完成。

## 10. Out of scope

- 真實 GitHub Actions runner、GitHub API、pull request、branch push、merge、review、secrets、OIDC token 或第三方 action execution。
- 真實 npm registry、網路安裝、Node process、shell command、cache directory 或使用者 repository state。
- GitHub Pages publish、release branch、rollback、production deploy、domain／DNS、post-deploy monitoring 與 incident response；這些屬於 `DEPLOY-01`。
- Docker／Compose、Kubernetes、artifact registry、image signing、SBOM 與 vulnerability scanner；這些不屬於 CI/CD 基礎 workflow fixture。
- 修改既有 `.github/workflows/ci.yml`、`.github/workflows/deploy-pages.yml`、branch protection 或共用 progress／route harness。

## 11. CICD-01 驗收

- 文件明確描述 CI／CD boundary、trigger／ref、workflow fixture、九個 observable stages、三個 scenarios、failure feedback、completion 與 out-of-scope。
- `CICD-02` 可依本文件撰寫 lesson 與 workflow fixture，不需要重新決定 job step、required check 或 failure semantics。
- `CICD-03` 可依本文件建立純 simulator；不需要真實 GitHub Actions、runner、network、secret 或 shell。
- `CICD-04` 可依本文件設計 Lab 的 trigger selector、step evidence、required check、merge gate、reset、keyboard、mobile 與 reduced-motion interaction。
- `CICD-05` 可使用固定 completion key、route 與 progress contract 接入，且不改變既有 Docker 或其他 topic 的完成統計。
- 文件檢查與 `git diff --check` 通過；本 task 不要求重新執行完整 frontend test suite。

## 12. 已知 rework 風險

- 若未來要教 matrix build、parallel jobs、approval environment 或 reusable workflow，應新增 acceptance contract，不偷換目前的單一 frontend required-check boundary。
- 目前 cache 只作為可觀察 metadata；若未來產品要求量測 cache hit／miss 或成本，新增 fixture 欄位，不把真實 runner cache 帶入 Phase 1。
- 若 workflow 的 Node version、working directory 或 required check 名稱改變，應更新 fixture snapshot 與 integration contract；不可只更新畫面文字。
- 若 Deploy topic 要展示 Pages publish 的正式 pipeline，應透過 `DEPLOY-01` contract 定義 release／artifact／rollback boundary，不在本 topic 擴張。
