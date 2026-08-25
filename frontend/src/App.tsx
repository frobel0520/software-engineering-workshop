import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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

const MOBILE_NAVIGATION_QUERY = "(max-width: 720px)";
const MOBILE_NAVIGATION_ID = "mobile-course-navigation";
const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

function matchesMobileNavigationQuery(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_NAVIGATION_QUERY).matches;
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR));
}

export default function App() {
  const [route, setRoute] = useState<RouteDefinition>(() => resolveRoute(window.location.hash, curriculum, TOPIC_MODULE_IDS));
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(matchesMobileNavigationQuery);
  const [progressRevision, setProgressRevision] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const wasMenuOpenRef = useRef(false);
  const progressRepository = useMemo(() => createLocalStorageProgressRepository(window.localStorage), []);
  const progress = aggregateProgress(curriculum, progressRepository);
  const completedTopicIds = useMemo(
    () => completedReadyTopicIds(curriculum, progressRepository),
    [progressRepository, progressRevision],
  );
  const activeTrack = route.kind === "track" ? curriculum.tracks.find((track) => track.id === route.trackId) : undefined;

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAVIGATION_QUERY);
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
      if (!mediaQuery.matches) setMenuOpen(false);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    sidebar.toggleAttribute("inert", isMobileViewport && !menuOpen);
  }, [isMobileViewport, menuOpen]);

  useEffect(() => {
    const wasMenuOpen = wasMenuOpenRef.current;
    const activeElement = document.activeElement;

    if (isMobileViewport && menuOpen && (!wasMenuOpen || !sidebarRef.current?.contains(activeElement))) {
      getFocusableElements(sidebarRef.current)[0]?.focus();
    }

    if (isMobileViewport && !menuOpen && wasMenuOpen) {
      menuButtonRef.current?.focus();
    }

    wasMenuOpenRef.current = menuOpen;
  }, [isMobileViewport, menuOpen]);

  useEffect(() => {
    if (!isMobileViewport || !menuOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isMobileViewport, menuOpen]);

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

  function handleSidebarKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isMobileViewport || !menuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(sidebarRef.current);
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    if (!firstFocusableElement || !lastFocusableElement) return;

    const activeElement = document.activeElement;
    if (!sidebarRef.current?.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastFocusableElement : firstFocusableElement).focus();
      return;
    }

    if (event.shiftKey && activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
    } else if (!event.shiftKey && activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  }

  return (
    <div className="app-shell">
      <aside
        id={MOBILE_NAVIGATION_ID}
        ref={sidebarRef}
        className={`sidebar ${menuOpen ? "open" : ""}`}
        aria-label="課程選單"
        aria-hidden={isMobileViewport ? !menuOpen : undefined}
        onKeyDown={handleSidebarKeyDown}
      >
        <button className="brand" type="button" onClick={() => goPath("/map")}>
          <span className="brand-mark">SE</span>
          <span><b>Software Engineering</b></span>
        </button>
        <div className="nav-label">目錄 / CONTENTS</div>
        <nav aria-label="課程內容">
          <button className={route.path === "/map" ? "active" : ""} type="button" onClick={() => goPath("/map")}><span>00</span>課程地圖</button>
          <div className="nav-label nav-label-nested">路線 / TRACKS</div>
          {curriculum.tracks.map((track, index) => (
            <button className={route.path === trackPath(track.id) ? "active" : ""} type="button" key={track.id} onClick={() => goPath(trackPath(track.id))}>
              <span>{String(index + 1).padStart(2, "0")}</span>{track.title}
            </button>
          ))}
        </nav>
        <div className="nav-label">實作 / PRACTICE</div>
        <nav aria-label="實作課程">
          {corePracticeTopics.map(({ topicId, labNavigationLabel }) => (
            <button className={route.path === topicPath(topicId, "lab") ? "active" : ""} type="button" key={topicId} onClick={() => goTopic(topicId, "lab")}>
              <span>↳</span>{labNavigationLabel} Lab
            </button>
          ))}
        </nav>
        <div className="nav-label">EXTENSION / AI</div>
        <nav aria-label="延伸課程">
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
          <button
            ref={menuButtonRef}
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "關閉課程選單" : "開啟課程選單"}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_NAVIGATION_ID}
            onClick={() => setMenuOpen((value) => !value)}
          >
            ☰
          </button>
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
