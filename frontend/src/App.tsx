import { useEffect, useMemo, useState } from "react";
import curriculumData from "@shared/curriculum.json";
import { aggregateProgress } from "./progress/aggregation";
import { createLocalStorageProgressRepository } from "./progress/repository";
import { parseRoute, topicPath, type RouteDefinition } from "./routes/registry";
import { CurriculumMap } from "./components/CurriculumMap";
import { GitLab } from "./components/GitLab";
import { GitLesson } from "./components/GitLesson";
import { AuthLesson } from "./components/AuthLesson";
import { AuthLab } from "./components/AuthLab";
import { CliLab } from "./components/CliLab";
import { CliLesson } from "./topics/cli/lesson";
import type { Curriculum } from "./types";

const curriculum = curriculumData as Curriculum;

function routeLabel(route: RouteDefinition): string {
  if (route.kind === "map") return "MAP";
  const topic = route.topicId?.toUpperCase() ?? "TOPIC";
  return route.kind === "lab" ? `${topic} LAB` : topic;
}
export default function App() {
  const [route, setRoute] = useState<RouteDefinition>(() => parseRoute(window.location.hash));
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setProgressRevision] = useState(0);
  const progressRepository = useMemo(() => createLocalStorageProgressRepository(window.localStorage), []);
  const progress = aggregateProgress(curriculum, progressRepository);
  const gitComplete = progressRepository.read("git");
  const authComplete = progressRepository.read("auth");
  const cliComplete = progressRepository.read("cli");

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function goPath(path: string) {
    window.location.hash = path;
  }

  function goTopic(topicId: string, kind: "lesson" | "lab") {
    goPath(topicPath(topicId, kind));
  }

  function completeTopic(topicId: string) {
    progressRepository.markComplete(topicId);
    setProgressRevision((value) => value + 1);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="brand" type="button" onClick={() => goPath("/map")}>
          <span className="brand-mark">SE</span>
          <span><b>Software Engineering</b><small>FIELD MANUAL · 2026</small></span>
        </button>
        <div className="nav-label">目錄 / CONTENTS</div>
        <nav>
          <button className={route.path === "/map" ? "active" : ""} type="button" onClick={() => goPath("/map")}><span>00</span>課程地圖</button>
          <button className={route.path === "/git" ? "active" : ""} type="button" onClick={() => goTopic("git", "lesson")}><span>01</span>Git 基礎 {gitComplete ? <i>✓</i> : null}</button>
          <button className={route.path === "/auth" ? "active" : ""} type="button" onClick={() => goTopic("auth", "lesson")}><span>02</span>Auth／OIDC {authComplete ? <i>✓</i> : null}</button>
          <button className={route.path === "/cli" ? "active" : ""} type="button" onClick={() => goTopic("cli", "lesson")}><span>03</span>命令列 {cliComplete ? <i>✓</i> : null}</button>
        </nav>
        <div className="nav-label">實作 / PRACTICE</div>
        <nav>
          <button className={route.path === "/lab" ? "active" : ""} type="button" onClick={() => goTopic("git", "lab")}><span>↳</span>Git Lab</button>
          <button className={route.path === "/auth-lab" ? "active" : ""} type="button" onClick={() => goTopic("auth", "lab")}><span>↳</span>Auth Lab</button>
          <button className={route.path === "/cli-lab" ? "active" : ""} type="button" onClick={() => goTopic("cli", "lab")}><span>↳</span>CLI Lab</button>
        </nav>
        <div className="sidebar-progress">
          <div><span>總進度</span><b>{progress.coreProgress.completed} / {progress.coreProgress.total}</b></div>
          <div className="progress-track"><i style={{ width: `${progress.coreProgress.percent}%` }} /></div>
          <p>已開放 {progress.coreProgress.ready} / {progress.coreProgress.total} 個 Core topic。</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" type="button" aria-label="開啟選單" onClick={() => setMenuOpen((value) => !value)}>☰</button>
          <div className="breadcrumb"><span>WORKSHOP</span><i>/</i><b>{routeLabel(route)}</b></div>
          <div className="top-status">已開放 <b>{progress.coreProgress.ready} / {progress.coreProgress.total}</b></div>
        </header>
        {route.kind === "map" ? <CurriculumMap curriculum={curriculum} onOpenGit={() => goTopic("git", "lesson")} onOpenAuth={() => goTopic("auth", "lesson")} onOpenCli={() => goTopic("cli", "lesson")} /> : null}
        {route.kind === "lesson" && route.topicId === "git" ? <GitLesson completed={gitComplete} onOpenLab={() => goTopic("git", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "git" ? <GitLab onComplete={() => completeTopic("git")} /> : null}
        {route.kind === "lesson" && route.topicId === "auth" ? <AuthLesson completed={authComplete} onOpenLab={() => goTopic("auth", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "auth" ? <AuthLab onComplete={() => completeTopic("auth")} /> : null}
        {route.kind === "lesson" && route.topicId === "cli" ? <CliLesson completed={cliComplete} onOpenLab={() => goTopic("cli", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "cli" ? <CliLab onComplete={() => completeTopic("cli")} /> : null}
      </main>
      {menuOpen ? <button className="menu-scrim" type="button" aria-label="關閉選單" onClick={() => setMenuOpen(false)} /> : null}
    </div>
  );
}
