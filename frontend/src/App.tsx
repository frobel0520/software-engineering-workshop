import { useEffect, useState } from "react";
import curriculumData from "@shared/curriculum.json";
import { CurriculumMap } from "./components/CurriculumMap";
import { GitLab } from "./components/GitLab";
import { GitLesson } from "./components/GitLesson";
import type { Curriculum } from "./types";

const curriculum = curriculumData as Curriculum;
type Route = "map" | "git" | "lab";
const routes: Route[] = ["map", "git", "lab"];
const completionKey = "se-workshop-git-complete";

function readRoute(): Route {
  const route = window.location.hash.replace(/^#\/?/, "") as Route;
  return routes.includes(route) ? route : "map";
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gitComplete, setGitComplete] = useState(() => localStorage.getItem(completionKey) === "true");

  useEffect(() => {
    const onHashChange = () => { setRoute(readRoute()); setMenuOpen(false); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function go(next: Route) {
    window.location.hash = `/${next}`;
  }

  function completeGit() {
    localStorage.setItem(completionKey, "true");
    setGitComplete(true);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="brand" onClick={() => go("map")}>
          <span className="brand-mark"><i /><i /><i /></span>
          <span><b>Software Engineering</b><small>WORKSHOP</small></span>
        </button>
        <div className="nav-label">START HERE</div>
        <nav>
          <button className={route === "map" ? "active" : ""} onClick={() => go("map")}><span>00</span>課程地圖</button>
          <button className={route === "git" ? "active" : ""} onClick={() => go("git")}><span>01</span>Git 基礎 {gitComplete ? <i>✓</i> : null}</button>
        </nav>
        <div className="nav-label">PRACTICE</div>
        <nav><button className={route === "lab" ? "active" : ""} onClick={() => go("lab")}><span>↳</span>Git Lab</button></nav>
        <div className="sidebar-progress">
          <div><span>總進度</span><b>{gitComplete ? "1" : "0"} / 19</b></div>
          <div className="progress-track"><i style={{ width: gitComplete ? "5.26%" : "0%" }} /></div>
          <p>{gitComplete ? "Git 已完成。下一站由你決定。" : "目前只開放 Git。"}</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" aria-label="開啟選單" onClick={() => setMenuOpen((value) => !value)}>☰</button>
          <div className="breadcrumb"><span>WORKSHOP</span><i>/</i><b>{route === "map" ? "MAP" : route === "git" ? "GIT" : "GIT LAB"}</b></div>
          <div className="top-status"><span className="status-dot" /> MODULE 01 READY</div>
        </header>
        {route === "map" ? <CurriculumMap curriculum={curriculum} onOpenGit={() => go("git")} /> : null}
        {route === "git" ? <GitLesson completed={gitComplete} onOpenLab={() => go("lab")} /> : null}
        {route === "lab" ? <GitLab onComplete={completeGit} /> : null}
      </main>
      {menuOpen ? <button className="menu-scrim" aria-label="關閉選單" onClick={() => setMenuOpen(false)} /> : null}
    </div>
  );
}
