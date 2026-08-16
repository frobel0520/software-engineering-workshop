import { useEffect, useMemo, useState } from "react";
import curriculumData from "@shared/curriculum.json";
import { aggregateProgress } from "./progress/aggregation";
import { createLocalStorageProgressRepository } from "./progress/repository";
import { parseRoute, topicPath, trackPath, type RouteDefinition } from "./routes/registry";
import { CurriculumMap } from "./components/CurriculumMap";
import { TrackPage } from "./components/TrackPage";
import { GitLab } from "./components/GitLab";
import { GitLesson } from "./components/GitLesson";
import { AuthLesson } from "./components/AuthLesson";
import { AuthLab } from "./components/AuthLab";
import { CliLab } from "./components/CliLab";
import { IdeLab } from "./components/IdeLab";
import { CliLesson } from "./topics/cli/lesson";
import { IdeLesson } from "./topics/ide/lesson";
import { RemoteLesson } from "./topics/remote/lesson";
import { RemoteLab } from "./topics/remote/lab";
import { GuardrailLesson } from "./topics/guardrail/lesson";
import { GuardrailLab } from "./topics/guardrail/lab";
import { PackageLesson } from "./topics/package/lesson";
import { PackageLab } from "./topics/package/lab";
import type { Curriculum } from "./types";

const curriculum = curriculumData as Curriculum;

function routeLabel(route: RouteDefinition): string {
  if (route.kind === "map") return "MAP";
  if (route.kind === "track") return `TRACK / ${route.trackId?.toUpperCase() ?? "CURRICULUM"}`;
  const topic = route.topicId?.toUpperCase() ?? "TOPIC";
  return route.kind === "lab" ? `${topic} LAB` : topic;
}

export default function App() {
  const [route, setRoute] = useState<RouteDefinition>(() => parseRoute(window.location.hash));
  const [menuOpen, setMenuOpen] = useState(false);
  const [progressRevision, setProgressRevision] = useState(0);
  const progressRepository = useMemo(() => createLocalStorageProgressRepository(window.localStorage), []);
  const progress = aggregateProgress(curriculum, progressRepository);
  const completedTopicIds = useMemo(
    () => curriculum.tracks.flatMap((track) => track.topics).filter((topic) => progressRepository.read(topic.id)).map((topic) => topic.id),
    [progressRepository, progressRevision],
  );
  const activeTrack = route.kind === "track" ? curriculum.tracks.find((track) => track.id === route.trackId) : undefined;
  const gitComplete = progressRepository.read("git");
  const authComplete = progressRepository.read("auth");
  const cliComplete = progressRepository.read("cli");
  const ideComplete = progressRepository.read("ide");
  const remoteComplete = progressRepository.read("remote");
  const guardrailComplete = progressRepository.read("guardrail");
  const packageComplete = progressRepository.read("package");

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
          <div className="nav-label nav-label-nested">路線 / TRACKS</div>
          {curriculum.tracks.map((track, index) => (
            <button className={route.path === trackPath(track.id) ? "active" : ""} type="button" key={track.id} onClick={() => goPath(trackPath(track.id))}>
              <span>{String(index + 1).padStart(2, "0")}</span>{track.title}
            </button>
          ))}
        </nav>
        <div className="nav-label">實作 / PRACTICE</div>
        <nav>
          <button className={route.path === "/lab" ? "active" : ""} type="button" onClick={() => goTopic("git", "lab")}><span>↳</span>Git Lab</button>
          <button className={route.path === "/auth-lab" ? "active" : ""} type="button" onClick={() => goTopic("auth", "lab")}><span>↳</span>Auth Lab</button>
          <button className={route.path === "/cli-lab" ? "active" : ""} type="button" onClick={() => goTopic("cli", "lab")}><span>↳</span>CLI Lab</button>
          <button className={route.path === "/ide-lab" ? "active" : ""} type="button" onClick={() => goTopic("ide", "lab")}><span>↳</span>IDE Lab</button>
          <button className={route.path === "/package-lab" ? "active" : ""} type="button" onClick={() => goTopic("package", "lab")}><span>↳</span>Package Lab</button>
          <button className={route.path === "/remote-lab" ? "active" : ""} type="button" onClick={() => goTopic("remote", "lab")}><span>↳</span>Remote Lab</button>
        </nav>
        <div className="nav-label">EXTENSION / AI</div>
        <nav>
          <button className={route.path === "/guardrail" ? "active" : ""} type="button" onClick={() => goTopic("guardrail", "lesson")}><span>EX</span>Guardrails {guardrailComplete ? <i>✓</i> : null}</button>
          <button className={route.path === "/guardrail-lab" ? "active" : ""} type="button" onClick={() => goTopic("guardrail", "lab")}><span>↳</span>Guardrail Lab</button>
        </nav>
        <div className="sidebar-progress">
          <div><span>總進度</span><b>{progress.coreProgress.completed} / {progress.coreProgress.total}</b></div>
          <div className="progress-track"><i style={{ width: `${progress.coreProgress.percent}%` }} /></div>
          <p>已開放 {progress.coreProgress.ready} / {progress.coreProgress.total} 個 Core topic。</p>
          <p>Extension {progress.extensionProgress.completed} / {progress.extensionProgress.total} 完成。</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" type="button" aria-label="開啟選單" onClick={() => setMenuOpen((value) => !value)}>☰</button>
          <div className="breadcrumb"><span>WORKSHOP</span><i>/</i><b>{routeLabel(route)}</b></div>
          <div className="top-status">已開放 <b>{progress.coreProgress.ready} / {progress.coreProgress.total}</b></div>
        </header>
        {route.kind === "map" ? <CurriculumMap curriculum={curriculum} onOpenTrack={(trackId) => goPath(trackPath(trackId))} /> : null}
        {route.kind === "track" && activeTrack ? <TrackPage track={activeTrack} completedTopicIds={completedTopicIds} onBackToMap={() => goPath("/map")} onOpenTopic={(topicId) => goTopic(topicId, "lesson")} /> : null}
        {route.kind === "track" && !activeTrack ? <CurriculumMap curriculum={curriculum} onOpenTrack={(trackId) => goPath(trackPath(trackId))} /> : null}
        {route.kind === "lesson" && route.topicId === "git" ? <GitLesson completed={gitComplete} onOpenLab={() => goTopic("git", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "git" ? <GitLab onComplete={() => completeTopic("git")} /> : null}
        {route.kind === "lesson" && route.topicId === "auth" ? <AuthLesson completed={authComplete} onOpenLab={() => goTopic("auth", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "auth" ? <AuthLab onComplete={() => completeTopic("auth")} /> : null}
        {route.kind === "lesson" && route.topicId === "cli" ? <CliLesson completed={cliComplete} onOpenLab={() => goTopic("cli", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "cli" ? <CliLab onComplete={() => completeTopic("cli")} /> : null}
        {route.kind === "lesson" && route.topicId === "ide" ? <IdeLesson completed={ideComplete} onOpenLab={() => goTopic("ide", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "ide" ? <IdeLab onComplete={() => completeTopic("ide")} /> : null}
        {route.kind === "lesson" && route.topicId === "remote" ? <RemoteLesson completed={remoteComplete} onOpenLab={() => goTopic("remote", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "remote" ? <RemoteLab onComplete={() => completeTopic("remote")} /> : null}
        {route.kind === "lesson" && route.topicId === "guardrail" ? <GuardrailLesson completed={guardrailComplete} onOpenLab={() => goTopic("guardrail", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "guardrail" ? <GuardrailLab onComplete={() => completeTopic("guardrail")} /> : null}
        {route.kind === "lesson" && route.topicId === "package" ? <PackageLesson completed={packageComplete} onOpenLab={() => goTopic("package", "lab")} /> : null}
        {route.kind === "lab" && route.topicId === "package" ? <PackageLab onComplete={() => completeTopic("package")} /> : null}
      </main>
      {menuOpen ? <button className="menu-scrim" type="button" aria-label="關閉選單" onClick={() => setMenuOpen(false)} /> : null}
    </div>
  );
}
