import type { Curriculum } from "../types";

export function CurriculumMap({ curriculum, onOpenGit, onOpenAuth }: { curriculum: Curriculum; onOpenGit: () => void; onOpenAuth: () => void }) {
  const topicCount = curriculum.tracks.reduce((total, track) => total + track.topics.length, 0);

  return (
    <div className="page page-map">
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">SOFTWARE ENGINEERING / FIELD WORK</p>
          <h1>一次練好<br /><em>一個工程能力。</em></h1>
          <p className="hero-lead">
            19 個主題是一張地圖，不是一份今天要清空的待辦清單。現在只走第一站：Git。
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={onOpenGit}>開始 Git 單元 <span>→</span></button>
            <span className="duration">約 20 分鐘 · 含互動 Lab</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Git 工作流程示意圖">
          <div className="visual-label">CURRENT MODULE</div>
          <div className="visual-title">GIT</div>
          <div className="branch-diagram">
            <div className="branch branch-main"><i /><i /><i /></div>
            <div className="branch branch-feature"><i /><i /></div>
          </div>
          <div className="visual-footer"><span>01 / {String(topicCount).padStart(2, "0")}</span><b>READY</b></div>
        </div>
      </section>

      <section className="map-intro">
        <div><p className="kicker">CURRICULUM MAP</p><h2>完整路線圖</h2></div>
        <p>Git 已開放；其餘主題會逐項製作、測試、上線。</p>
      </section>

      <div className="track-grid">
        {curriculum.tracks.map((track, trackIndex) => (
          <section className="track-card" key={track.id}>
            <header>
              <span>{String(trackIndex + 1).padStart(2, "0")}</span>
              <div><h3>{track.title}</h3><p>{track.description}</p></div>
            </header>
            <div className="topic-stack">
              {track.topics.map((topic) => (
                <button
                  key={topic.id}
                  className={`topic-item ${topic.status}`}
                  disabled={topic.status !== "ready"}
                  onClick={topic.id === "git" ? onOpenGit : topic.id === "auth" ? onOpenAuth : undefined}
                >
                  <span className="topic-state">{topic.status === "ready" ? "●" : "○"}</span>
                  <span><b>{topic.title}</b><small>{topic.summary}</small></span>
                  <em>{topic.status === "ready" ? "開始 →" : "規劃中"}</em>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
