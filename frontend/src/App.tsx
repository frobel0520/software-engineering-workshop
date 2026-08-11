import { useEffect, useState } from "react";
import curriculumData from "@shared/curriculum.json";
import { CurriculumMap } from "./components/CurriculumMap";
import { GitLab } from "./components/GitLab";
import { GitLesson } from "./components/GitLesson";
import { AuthLesson } from "./components/AuthLesson";
import { AuthLab } from "./components/AuthLab";
import type { Curriculum } from "./types";

const curriculum = curriculumData as Curriculum;
type Route = "map" | "git" | "lab" | "auth" | "auth-lab";
const routes: Route[] = ["map", "git", "lab", "auth", "auth-lab"];
const completionKey = "se-workshop-git-complete";
const authCompletionKey = "se-workshop-auth-complete";

function readRoute(): Route {
  const route = window.location.hash.replace(/^#\/?/, "") as Route;
  return routes.includes(route) ? route : "map";
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gitComplete, setGitComplete] = useState(() => localStorage.getItem(completionKey) === "true");
  const [authComplete, setAuthComplete] = useState(() => localStorage.getItem(authCompletionKey) === "true");
  const completedCount = Number(gitComplete) + Number(authComplete);

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

  function completeAuth() {
    localStorage.setItem(authCompletionKey, "true");
    setAuthComplete(true);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="brand" onClick={() => go("map")}>
          <span className="brand-mark">SE</span>
          <span><b>Software Engineering</b><small>FIELD MANUAL · 2026</small></span>
        </button>
        <div className="nav-label">目錄 / CONTENTS</div>
        <nav>
          <button className={route === "map" ? "active" : ""} onClick={() => go("map")}><span>00</span>課程地圖</button>
          <button className={route === "git" ? "active" : ""} onClick={() => go("git")}><span>01</span>Git 基礎 {gitComplete ? <i>✓</i> : null}</button>
          <button className={route === "auth" ? "active" : ""} onClick={() => go("auth")}><span>02</span>Auth／OIDC {authComplete ? <i>✓</i> : null}</button>
        </nav>
        <div className="nav-label">實作 / PRACTICE</div>
        <nav>
          <button className={route === "lab" ? "active" : ""} onClick={() => go("lab")}><span>↳</span>Git Lab</button>
          <button className={route === "auth-lab" ? "active" : ""} onClick={() => go("auth-lab")}><span>↳</span>Auth Lab</button>
        </nav>
        <div className="sidebar-progress">
          <div><span>總進度</span><b>{completedCount} / 19</b></div>
          <div className="progress-track"><i style={{ width: `${(completedCount / 19) * 100}%` }} /></div>
          <p>Git 與 Auth 已開放。</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" aria-label="開啟選單" onClick={() => setMenuOpen((value) => !value)}>☰</button>
          <div className="breadcrumb"><span>WORKSHOP</span><i>/</i><b>{route === "map" ? "MAP" : route === "git" ? "GIT" : route === "lab" ? "GIT LAB" : route === "auth" ? "AUTH" : "AUTH LAB"}</b></div>
          <div className="top-status">已開放 <b>2 / 19</b></div>
        </header>
        {route === "map" ? <CurriculumMap curriculum={curriculum} onOpenGit={() => go("git")} onOpenAuth={() => go("auth")} /> : null}
        {route === "git" ? <GitLesson completed={gitComplete} onOpenLab={() => go("lab")} /> : null}
        {route === "lab" ? <GitLab onComplete={completeGit} /> : null}
        {route === "auth" ? <AuthLesson completed={authComplete} onOpenLab={() => go("auth-lab")} /> : null}
        {route === "auth-lab" ? <AuthLab onComplete={completeAuth} /> : null}
      </main>
      {menuOpen ? <button className="menu-scrim" aria-label="關閉選單" onClick={() => setMenuOpen(false)} /> : null}
    </div>
  );
}
