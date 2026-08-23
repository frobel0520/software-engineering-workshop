import { Fragment, useEffect, useMemo, useState } from "react";
import { curriculum } from "./curriculum";
import { aggregateProgress, completedReadyTopicIds } from "./progress/aggregation";
import { createLocalStorageProgressRepository } from "./progress/repository";
import { parseRoute, resolveRoute, topicPath, trackPath, type RouteDefinition } from "./routes/registry";
import { getTopicNavigationEntries, TOPIC_MODULE_IDS } from "./topics/registry";
import { CurriculumMap } from "./components/CurriculumMap";
import { TrackPage } from "./components/TrackPage";
import { TopicRouteView } from "./components/TopicRouteView";

function routeLabel(route: RouteDefinition): string {
  if (route.kind === "map") return "MAP";
  if (route.kind === "track") return `TRACK / ${route.trackId?.toUpperCase() ?? "CURRICULUM"}`;
  const topic = route.topicId?.toUpperCase() ?? "TOPIC";
  return route.kind === "lab" ? `${topic} LAB` : topic;
}

const topicNavigationEntries = getTopicNavigationEntries(curriculum);
const corePracticeTopics = topicNavigationEntries.filter((topic) => topic.trackKind === "core");
const extensionTopics = topicNavigationEntries.filter((topic) => topic.trackKind === "extension");

export default function App() {
  const [route, setRoute] = useState<RouteDefinition>(() => resolveRoute(window.location.hash, curriculum, TOPIC_MODULE_IDS));
  const [menuOpen, setMenuOpen] = useState(false);
  const [progressRevision, setProgressRevision] = useState(0);
  const progressRepository = useMemo(() => createLocalStorageProgressRepository(window.localStorage), []);
  const progress = aggregateProgress(curriculum, progressRepository);
  const completedTopicIds = useMemo(
    () => completedReadyTopicIds(curriculum, progressRepository),
    [progressRepository, progressRevision],
  );
  const activeTrack = route.kind === "track" ? curriculum.tracks.find((track) => track.id === route.trackId) : undefined;
  useEffect(() => {
    const syncRoute = () => {
      const parsedRoute = parseRoute(window.location.hash);
      const nextRoute = resolveRoute(window.location.hash, curriculum, TOPIC_MODULE_IDS);
      if (parsedRoute.path !== nextRoute.path) {
        window.location.hash = nextRoute.path;
        return;
      }
      setRoute(nextRoute);
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", syncRoute);
    syncRoute();
    return () => window.removeEventListener("hashchange", syncRoute);
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

  function openCurrentTopicLab() {
    if (route.topicId) goTopic(route.topicId, "lab");
  }

  function completeCurrentTopic() {
    if (route.topicId) completeTopic(route.topicId);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="brand" type="button" onClick={() => goPath("/map")}>
          <span className="brand-mark">SE</span>
          <span><b>Software Engineering</b></span>
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
          {corePracticeTopics.map(({ topicId, labNavigationLabel }) => (
            <button className={route.path === topicPath(topicId, "lab") ? "active" : ""} type="button" key={topicId} onClick={() => goTopic(topicId, "lab")}>
              <span>↳</span>{labNavigationLabel} Lab
            </button>
          ))}
        </nav>
        <div className="nav-label">EXTENSION / AI</div>
        <nav>
          {extensionTopics.map(({ topicId, navigationLabel, labNavigationLabel }) => (
            <Fragment key={topicId}>
              <button className={route.path === topicPath(topicId, "lesson") ? "active" : ""} type="button" onClick={() => goTopic(topicId, "lesson")}>
                <span>EX</span>{navigationLabel} {progressRepository.read(topicId) ? <i>✓</i> : null}
              </button>
              <button className={route.path === topicPath(topicId, "lab") ? "active" : ""} type="button" onClick={() => goTopic(topicId, "lab")}>
                <span>↳</span>{labNavigationLabel} Lab
              </button>
            </Fragment>
          ))}
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
        </header>
        {route.kind === "map" ? <CurriculumMap curriculum={curriculum} onOpenTrack={(trackId) => goPath(trackPath(trackId))} /> : null}
        {route.kind === "track" && activeTrack ? <TrackPage track={activeTrack} completedTopicIds={completedTopicIds} onBackToMap={() => goPath("/map")} onOpenTopic={(topicId) => goTopic(topicId, "lesson")} /> : null}
        {route.kind === "track" && !activeTrack ? <CurriculumMap curriculum={curriculum} onOpenTrack={(trackId) => goPath(trackPath(trackId))} /> : null}
        <TopicRouteView
          route={route}
          completed={route.topicId ? progressRepository.read(route.topicId) : false}
          onOpenLab={openCurrentTopicLab}
          onComplete={completeCurrentTopic}
        />
      </main>
      {menuOpen ? <button className="menu-scrim" type="button" aria-label="關閉選單" onClick={() => setMenuOpen(false)} /> : null}
    </div>
  );
}
