# DOCKER-01：Docker 基礎驗收規格

> 狀態：Accepted for implementation
> 日期：2026-08-23
> Task：DOCKER-01
> 上位契約：`docs/project-sa.md`、`docs/project-sd.md`

本文件鎖定 Docker 主題的學習目標、Lesson／Lab pageflow、static-site fixture、image／container／port boundary、失敗回饋與完成邊界。後續 task 可以調整 TypeScript type 或視覺分段名稱，但不可改變本文件定義的 observable semantics。

## 1. 學習目標

完成本主題後，學習者應能：

1. 分辨 image、container、Dockerfile 與 build context 的責任，不把 image 當成正在執行的 process。
2. 讀懂一個最小 static-site Dockerfile，知道 `COPY`、`EXPOSE` 與 runtime command 各自在什麼 boundary 生效。
3. 用固定 build context 建立可重現的 image，並知道 source artifact 缺少時 build 應在哪個步驟失敗。
4. 用 `docker run -p host:container` 發布 container port，分辨 container 內服務正常與 host 端可以連線是兩個檢查。
5. 以 `docker ps`、固定 HTTP probe 與 container state 判斷結果，不把「container 啟動」誤當成「服務可從 host 存取」。
6. 在完成後停止並移除 fixture container，理解 local cleanup 是可重複工作流的一部分；本 Lab 不連接真實 Docker daemon。

## 2. 教學邊界

本主題只呈現 deterministic fixture，不執行使用者電腦上的 Docker，不啟動真實 container，不下載 image，不連接 registry，也不修改 host port。Docker command、image digest 與 HTTP response 都是可測試的教學資料，不代表目前環境已安裝 Docker。

本主題的 fixture 假設上一個 Build topic 已產出 `frontend/dist/index.html`；Lab 以固定的 `dist/` artifact snapshot 表達這個輸入，不要求學習者真的先完成另一個 topic。

## 3. Lesson／Lab Pageflow

```text
Docker Lesson
  → image、container、Dockerfile 與 build context 的邊界
  → 讀懂 static-site Dockerfile
  → build cache 與可重現 tag
  → container port 與 host port mapping
  → runtime verification 與 cleanup
  → Docker Lab
  → 選擇 deterministic scenario
  → 檢查 context 與 Dockerfile
  → build image
  → run container
  → 驗證固定 HTTP probe 與 port mapping
  → stop／remove container
  → 完成 success、missing artifact、unpublished port 三個 scenarios
  → reset 後重跑固定 regression flow
  → 標記 Docker topic complete
```

## 4. Lesson outline

| Section | 要回答的問題 | 必須留下的判斷線索 |
| --- | --- | --- |
| Responsibility | image 與 container 有什麼不同？ | image 是可建立與標記的不可變輸入；container 是從 image 建立的執行個體，具有 running／stopped state。 |
| Dockerfile | Dockerfile 每一行如何影響結果？ | `FROM` 提供 base、`COPY` 需要 build context 中存在的 artifact、`EXPOSE` 描述 container port、runtime command 決定服務是否啟動。 |
| Context | 為什麼 build context 不是任意整個 repository？ | build 只能讀取 context 內的檔案；固定 context 與 `.dockerignore` 可縮小輸入並避免把不必要檔案帶入 build。 |
| Reproducibility | 怎樣知道 image 是哪一版？ | 使用固定 image tag、固定 fixture digest 與固定 build result；不可用目前時間或 random tag 作為驗收依據。 |
| Port mapping | container 內的 `80` 為什麼不等於 host 的 `8080`？ | `EXPOSE 80` 只是 metadata；`-p 8080:80` 才建立 host 到 container 的可觀察 mapping。 |
| Verification | container running 是否足以證明成功？ | 必須同時看到 running state、正確 mapping 與固定 HTTP probe success。 |
| Cleanup | 為什麼要 stop／remove？ | cleanup 讓相同 fixture 可重跑，避免殘留 container 或 port state 變成下一次的隱藏輸入。 |

## 5. Required scenarios

| Scenario | Fixture outcome | 教學重點 |
| --- | --- | --- |
| `static-site-success` | `dist/index.html` 存在；image build 成功；container 以 `8080:80` 啟動；HTTP probe 回傳固定 `200` | image、container、port mapping 與 runtime verification 必須全部成立，不能只看 build 成功。 |
| `missing-build-artifact` | Dockerfile 的 `COPY dist/ /usr/share/nginx/html/` 找不到 `dist/index.html`，build 在 context／copy boundary 失敗 | source artifact 缺失時應保留明確的 build failure，不建立成功 image，也不啟動 container。 |
| `unpublished-container-port` | image build 成功、container running，但 run 沒有 `8080:80` mapping；固定 HTTP probe 無法從 host 存取 | container 內 process running 不代表 host 可連線；應修正 run command，不偽造 HTTP success。 |

每個 scenario 都必須讓學習者看見：目前 stage、Dockerfile／command evidence、image state、container state、port mapping、probe result，以及失敗時沒有產生的 artifact 或副作用。

## 6. Deterministic fixture

### 6.1 Static-site inputs

```ts
const dockerFixture = {
  contextPath: ".",
  dockerfilePath: "Dockerfile",
  sourceArtifact: "dist/index.html",
  imageTag: "workshop-web:1",
  imageDigest: "sha256:docker-fixture-001",
  containerName: "workshop-web",
  containerPort: 80,
  hostPort: 8080,
  probePath: "/",
  probeStatus: 200,
} as const;
```

固定 Dockerfile 顯示內容如下；Lab 不執行它，只把每一行當成可觀察的 fixture evidence：

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

固定 happy-path command sequence：

```text
docker build -t workshop-web:1 .
docker run --name workshop-web -p 8080:80 workshop-web:1
curl http://localhost:8080/
docker stop workshop-web
docker rm workshop-web
```

Fixture rules：

- `dist/index.html`、image tag、digest、container name、port 與 HTTP status 都是固定值；不可使用目前時間、random id、真實 host 或網路回應。
- `docker build` 只在 `contextPath` 內尋找 `Dockerfile` 與 `sourceArtifact`；不可讀取使用者真實 repository 以外的資料。
- `EXPOSE 80` 不會自動建立 host mapping；只有 run event 提供 `8080:80` 時，probe 才能通過。
- `missing-build-artifact` 只能改變 source artifact presence；不得同時改變 port mapping 或 runtime command。
- `unpublished-container-port` 只能改變 port mapping；image build 必須成功，container 必須保持 running，probe 才能顯示不可達。
- 相同 initial state 加上相同 event sequence，必須得到相同 image、container、mapping、probe、feedback 與 completion 結果。

### 6.2 Observable command evidence

每個 command event 至少要呈現 command、boundary、結果與下一步；不可只顯示顏色或 `failed`：

| Command | Boundary | Success evidence | Failure evidence |
| --- | --- | --- | --- |
| `docker build -t workshop-web:1 .` | build context／image | fixed tag 與 digest 出現，image state 為 `built` | `COPY dist/` 找不到 source artifact，image state 保持 `absent` |
| `docker run --name workshop-web -p 8080:80 workshop-web:1` | container／port | container 為 `running`，mapping 為 `8080→80` | image 尚未 built，或 mapping 未發布；不得假裝 container 可用 |
| `curl http://localhost:8080/` | host runtime probe | status `200`、body marker `SE_WORKSHOP_HOME` | mapping 不存在時 status 為 `unreachable`，指出要檢查 host／container port |
| `docker stop workshop-web` | runtime cleanup | container 為 `stopped` | 未有 running container 時阻擋，指出先選擇正確 scenario state |
| `docker rm workshop-web` | local cleanup | container state 為 `removed` | running container 不可直接移除，指出先 stop |

## 7. Lab state boundary

後續 `DOCKER-03` simulator 應能表達下列概念；欄位名稱可微調，但不可移除其可觀察語意：

```text
DockerLabState {
  phase: initial | inspecting | building | running | blocked | completed
  selectedScenarioId: static-site-success | missing-build-artifact | unpublished-container-port | null
  activeStepId: inspect-context | build-image | run-container | verify-probe | cleanup-container | null
  completedStepIds: readonly string[]
  imageState: absent | built
  containerState: absent | running | stopped | removed
  portMapping: absent | published | mismatched
  probeState: pending | success | unreachable
  completedScenarioIds: readonly string[]
  lastFeedback: none | success | blocked
  lastMessage: string
  canReset: true
}
```

建議的 observable stage 順序為 `inspect-context → build-image → run-container → verify-probe → cleanup-container`。視覺上可以合併 command card，但必須保留 build boundary、container state、port mapping、probe result 與 cleanup evidence。

## 8. Failure feedback contract

- 未選擇 scenario 就執行 inspect：阻擋，提示先選擇一個 deterministic fixture。
- 未檢查 context／Dockerfile 就 build：阻擋，指出尚未確認的 source artifact 與下一步。
- 尚未有 image 就 run：阻擋，指出 image tag 尚未建立，不能直接啟動 container。
- `missing-build-artifact` 找不到 `dist/index.html`：保留 `COPY` boundary evidence，說明 build 未產生 image，也未啟動 container。
- `unpublished-container-port` 的 container 雖 running 但 probe unreachable：保留 running evidence，指出 `EXPOSE` 不等於 host publish，下一步是修正 `-p 8080:80`。
- 未完成 cleanup 就宣告 scenario 完成：阻擋，指出 container 仍為 running 或 stopped，下一步是 stop／remove。
- 已完成的 scenario 再次操作：提示先 reset，避免重複累加 container 或 image state。
- reset：回到固定 initial fixture，清除 selected scenario、steps、image、container、mapping、probe、feedback 與 completion state。

## 9. Completion contract

只有下列條件全部成立時，Docker Lab 才算完成：

- 三個 required scenarios 都完成各自的 terminal outcome。
- `static-site-success` 顯示固定 image tag／digest、`running` container、`8080→80` mapping、HTTP `200` 與 cleanup complete。
- `missing-build-artifact` 在 build context／copy boundary 停止，沒有成功 image、running container 或 probe success。
- `unpublished-container-port` 保留 running container evidence，但 probe 為 unreachable，並完成修正後的 regression flow。
- reset 後重跑固定 happy path，image、container、mapping、probe、feedback 與 cleanup 結果與第一次一致。
- 完成後使用 `se-workshop-docker-complete` 保存進度。
- 本 task 只定義 contract；在 `DOCKER-05` 前不得把 `docker` 改成 curriculum `ready`。

單獨看見 Dockerfile、build success、container running 或 port metadata，都不得單獨標記 topic 完成。

## 10. Out of scope

- 真實 Docker daemon、host filesystem、container runtime、kernel isolation 或 local port binding。
- Docker Hub／registry login、image push／pull、private registry、credentials、SBOM、signing、vulnerability scanner 與 production hardening。
- Docker Compose、Kubernetes、swarm、service mesh、multi-container network 與 volume persistence。
- 真實 nginx、HTTP server、browser request、CI runner 或 GitHub Actions container execution。
- 以 Docker container 取代 GitHub Pages；Phase 1 Pages 仍只發布 `frontend/dist` 的 static artifact。
- 修改既有 route registry、ProgressRepository、共用 simulator harness 或 `CORE-008` dispatcher。

## 11. DOCKER-01 驗收

- 文件明確描述 image／container／Dockerfile／context／port 的責任邊界、Lesson／Lab pageflow、三個 scenarios、deterministic fixture、failure feedback、completion 與 out-of-scope。
- `DOCKER-02` 可依本文件撰寫教材與 Dockerfile fixture，不需要重新決定 static-site input、port mapping 或 cleanup semantics。
- `DOCKER-03` 可依本文件建立純 simulator；不需要真實 Docker、host port、network 或 registry。
- `DOCKER-04` 可依本文件設計 Lab 的 command evidence、reset、錯誤回饋、keyboard、mobile 與 reduced-motion interaction。
- `DOCKER-05` 可使用固定 completion key、route 與 progress contract 接入，且不改變既有 topic 的完成統計。
- 文件檢查與 `git diff --check` 通過；本 task 不要求重新執行完整 frontend test suite。

## 12. 已知 rework 風險

- 若未來產品要教多階段 build、Compose 或 production image hardening，應新增 acceptance contract，不偷換本主題的 single-container static-site boundary。
- `nginx:alpine` 與固定 digest 目前是教學 fixture，不代表 production base image policy；若未來要求 supply-chain pinning，新增欄位與驗收即可，不改變 image／container／port 核心語意。
- 若 GitHub Pages 的 artifact layout 改變，`dist/index.html` 可調整為新的固定 source artifact，但 build boundary 與 host／container port boundary 必須保留。
- 若共用 simulator harness 需要增加 command replay 或 resource cleanup primitive，改動應由共用契約 task 處理，不把 framework change 偷塞進 DOCKER topic。
