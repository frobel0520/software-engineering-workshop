import type { LessonDefinition } from "../types";

export const dockerLesson: LessonDefinition = {
  title: "把靜態 artifact 放進可重複的執行環境",
  orientation: {
    what: "Docker 用 image 描述可重複建立的檔案與設定，用 container 表示從 image 啟動的執行個體；Dockerfile 與 build context 連起這兩個邊界。",
    why: "把 runtime 輸入整理好，能讓本機、CI 與部署使用相同的執行環境，也讓缺檔、錯誤 port 與殘留 container 變成可觀察的狀態。",
    when: "需要包裝 static site、重現服務環境、檢查 container 內外的 port 邊界，或在交付前驗證 image 與 runtime 行為時使用。",
    how: "先檢查 Dockerfile 與 build context，再 build image，run container，從 host probe 驗證 port mapping，最後 stop／remove 清理環境。",
  },
  objectives: [
    "分辨 image、container、Dockerfile 與 build context 的責任。",
    "讀懂 FROM、COPY、EXPOSE 與 runtime command 如何影響 static-site container。",
    "理解 tag、digest 與 source artifact 如何支援可重現的 build。",
    "分辨 container 內的 port metadata 與 host 端的 published port。",
    "用 HTTP probe 驗證 container running 不等於 host 可連線。",
    "完成 stop／remove cleanup，讓相同 Docker 輸入可以安全重跑。",
  ],
  sections: [
    {
      id: "image-and-container",
      title: "Image 是輸入，container 是執行個體",
      body: "image 是可被標記與建立的可重現輸入；container 是從 image 產生、具有 running／stopped state 的執行個體。看到 image build 成功，還不能推論服務已啟動。",
    },
    {
      id: "dockerfile-boundaries",
      title: "Dockerfile 把責任寫成步驟",
      body: "FROM 提供 base image，COPY 只能讀取 build context 內的 artifact，EXPOSE 描述 container 內的 port，runtime command 才決定啟動時要執行什麼。每一行都對應不同的驗證 boundary。",
    },
    {
      id: "build-context",
      title: "Context 決定 build 能看見什麼",
      body: "docker build 最後的 . 是 build context；Dockerfile 不能讀取 context 之外的檔案。這裡只提供 dist/index.html 與 Dockerfile，不讀取使用者真實 repository。",
    },
    {
      id: "reproducible-image",
      title: "用可重現輸入留下 image 證據",
      body: "image tag、checksum 與 source artifact 能讓兩次 build 比較相同輸入。這個 Lab 不下載 base image，也不把目前時間或 random id 當成驗收結果。",
    },
    {
      id: "published-port",
      title: "EXPOSE 不等於 host publish",
      body: "EXPOSE 80 只是描述 container 內的服務 port；docker run -p 8080:80 才建立 host 8080 到 container 80 的 mapping。兩者要分開觀察。",
    },
    {
      id: "runtime-probe",
      title: "Running 還要經過 host probe",
      body: "container running 只能證明執行個體啟動；curl probe 還要看到正確 mapping 與 HTTP 200。沒有 mapping 時要保留 unreachable，不可把成功結果寫死。",
    },
    {
      id: "cleanup-and-repeat",
      title: "清理是可重複流程的一部分",
      body: "先 stop 再 remove container，才能清除 runtime 與 port state，讓下一次流程不會被殘留狀態污染。完成 cleanup 後再 reset 重跑，結果應保持一致。",
    },
  ],
};

export type DockerStepId = "inspect-context" | "build-image" | "run-container" | "verify-probe" | "cleanup-container";

export interface DockerLessonStep {
  id: DockerStepId;
  sectionId: string;
  title: string;
  command: string;
  explanation: string;
  takeaway: string;
}

export const dockerLessonSteps: readonly DockerLessonStep[] = [
  {
    id: "inspect-context",
    sectionId: "build-context",
    title: "檢查 build context",
    command: "cat Dockerfile && ls dist",
    explanation: "先確認 Dockerfile 與 dist/index.html 都位於同一個 context，避免把 context 之外的檔案當成 build input。",
    takeaway: "Build 能看見什麼，先由 context 決定。",
  },
  {
    id: "build-image",
    sectionId: "reproducible-image",
    title: "建立 image",
    command: "docker build -t workshop-web:1 .",
    explanation: "用指定 tag 與 source artifact 建立 image；COPY 找不到 artifact 時，build 要在 boundary 停止。",
    takeaway: "Build success 的證據包含 tag、digest 與 source input。",
  },
  {
    id: "run-container",
    sectionId: "published-port",
    title: "啟動並發布 port",
    command: "docker run --name workshop-web -p 8080:80 workshop-web:1",
    explanation: "從 image 建立 container，並明確把 host 8080 publish 到 container 80；EXPOSE 本身不會建立這個 mapping。",
    takeaway: "Container port 與 host port 是兩個不同 boundary。",
  },
  {
    id: "verify-probe",
    sectionId: "runtime-probe",
    title: "驗證 host runtime",
    command: "curl http://localhost:8080/",
    explanation: "用 host probe 觀察 HTTP 200；container running 但沒有 published mapping 時，結果必須是 unreachable。",
    takeaway: "Running、mapping 與 probe success 要一起成立。",
  },
  {
    id: "cleanup-container",
    sectionId: "cleanup-and-repeat",
    title: "停止並移除 container",
    command: "docker stop workshop-web && docker rm workshop-web",
    explanation: "先停止 runtime，再移除 container，清掉可能影響下一次練習的 local state。",
    takeaway: "清理完成，流程才真正可重跑。",
  },
] as const;

export const dockerFixture = {
  contextPath: ".",
  dockerfilePath: "Dockerfile",
  sourceArtifact: "dist/index.html",
  imageTag: "workshop-web:1",
  imageDigest: "sha256:docker-image-001",
  containerName: "workshop-web",
  containerPort: 80,
  hostPort: 8080,
  probePath: "/",
  probeStatus: 200,
  bodyMarker: "SE_WORKSHOP_HOME",
} as const;

export interface DockerFileFixture {
  path: string;
  lines: readonly string[];
}

export const dockerFileFixture: DockerFileFixture = {
  path: dockerFixture.dockerfilePath,
  lines: [
    "FROM nginx:alpine",
    "COPY dist/ /usr/share/nginx/html/",
    "EXPOSE 80",
  ],
};

export type DockerScenarioId = "static-site-success" | "missing-build-artifact" | "unpublished-container-port";

export interface DockerScenarioFixture {
  id: DockerScenarioId;
  title: string;
  artifactPresent: boolean;
  imageBuild: "succeeds" | "fails";
  containerOutcome: "not-created" | "running";
  portMapping: "published" | "absent";
  probeOutcome: "success" | "unreachable" | "not-run";
  failureBoundary: "copy" | "host-port" | null;
  learningPoint: string;
}

export const dockerScenarioFixtures: readonly DockerScenarioFixture[] = [
  {
    id: "static-site-success",
    title: "Static site 可以被 host 存取",
    artifactPresent: true,
    imageBuild: "succeeds",
    containerOutcome: "running",
    portMapping: "published",
    probeOutcome: "success",
    failureBoundary: null,
    learningPoint: "image、container、published port、HTTP probe 與 cleanup 必須全部成立。",
  },
  {
    id: "missing-build-artifact",
    title: "缺少 dist artifact",
    artifactPresent: false,
    imageBuild: "fails",
    containerOutcome: "not-created",
    portMapping: "absent",
    probeOutcome: "not-run",
    failureBoundary: "copy",
    learningPoint: "COPY 找不到 source artifact 時，build 不應產生成功 image 或 container。",
  },
  {
    id: "unpublished-container-port",
    title: "Container running 但 port 未發布",
    artifactPresent: true,
    imageBuild: "succeeds",
    containerOutcome: "running",
    portMapping: "absent",
    probeOutcome: "unreachable",
    failureBoundary: "host-port",
    learningPoint: "EXPOSE 不等於 host publish；container running 不代表 host 可以連線。",
  },
] as const;

export interface DockerCommandFixture {
  stepId: DockerStepId;
  command: string;
  boundary: string;
  successEvidence: string;
  failureEvidence: string;
}

export const dockerCommandFixtures: readonly DockerCommandFixture[] = [
  {
    stepId: "inspect-context",
    command: "cat Dockerfile && ls dist",
    boundary: "build context / Dockerfile",
    successEvidence: "Dockerfile 與 dist/index.html 都在同一個 context",
    failureEvidence: "尚未確認 source artifact，不能開始 build",
  },
  {
    stepId: "build-image",
    command: "docker build -t workshop-web:1 .",
    boundary: "COPY / image",
    successEvidence: "workshop-web:1 · sha256:docker-image-001",
    failureEvidence: "COPY dist/ 找不到 dist/index.html，image 保持 absent",
  },
  {
    stepId: "run-container",
    command: "docker run --name workshop-web -p 8080:80 workshop-web:1",
    boundary: "container / host port",
    successEvidence: "workshop-web running · 8080→80",
    failureEvidence: "image 尚未 built，或 host port 尚未 published",
  },
  {
    stepId: "verify-probe",
    command: "curl http://localhost:8080/",
    boundary: "host runtime probe",
    successEvidence: "HTTP 200 · SE_WORKSHOP_HOME",
    failureEvidence: "unreachable：檢查 host 8080 與 container 80 的 mapping",
  },
  {
    stepId: "cleanup-container",
    command: "docker stop workshop-web && docker rm workshop-web",
    boundary: "runtime / local cleanup",
    successEvidence: "container stopped and removed",
    failureEvidence: "running container 不能直接移除，請先 stop",
  },
] as const;

export interface DockerFailureFixture {
  command: string;
  message: string;
  expectedBoundary: string;
}

export const dockerFailureFixtures: readonly DockerFailureFixture[] = [
  {
    command: "docker build -t workshop-web:1 .",
    message: "請先檢查 Dockerfile 與 dist/index.html，再開始 image build。",
    expectedBoundary: "build context",
  },
  {
    command: "docker run --name workshop-web -p 8080:80 workshop-web:1",
    message: "image 尚未建立；請先完成 docker build，再啟動 container。",
    expectedBoundary: "image",
  },
  {
    command: "curl http://localhost:8080/",
    message: "container 可能正在執行，但 host port 尚未發布；檢查 -p 8080:80。",
    expectedBoundary: "host port",
  },
  {
    command: "docker rm workshop-web",
    message: "請先停止 running container，再執行 remove cleanup。",
    expectedBoundary: "cleanup",
  },
] as const;
