import type { Curriculum } from "../types";

export function CurriculumMap({ curriculum, onOpenTrack }: { curriculum: Curriculum; onOpenTrack: (trackId: string) => void }) {
  const topicCount = curriculum.tracks.filter((track) => (track.kind ?? "core") === "core").reduce((total, track) => total + track.topics.length, 0);

  return (
    <div className="page page-map">
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">SOFTWARE ENGINEERING / FIELD WORK</p>
          <h1>一次練好<br /><em>一個工程能力。</em></h1>
          <p className="hero-lead">
            19 個主題是一張地圖，不是一份今天要清空的待辦清單。先選一個能力分類，再沿著分類內的 topic 前進。
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => onOpenTrack("foundations")}>查看開發基本功 <span>→</span></button>
            <span className="duration">先選分類 · 再進入 topic Lab</span>
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
        <p>Core 主題與 Guardrail Extension 會分開計算進度；每個開放 topic 都先經過 Lesson、Lab 與 QA。</p>
      </section>

      <div className="track-grid">
        {curriculum.tracks.map((track, trackIndex) => (
          <section className="track-card" key={track.id}>
            <header>
              <span>{String(trackIndex + 1).padStart(2, "0")}</span>
              <div>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
                <button className="track-card-link" type="button" onClick={() => onOpenTrack(track.id)}>進入分類 <span>→</span></button>
              </div>
            </header>
            <div className="topic-stack">
              {track.topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`topic-item ${topic.status}`}
                >
                  <span className="topic-state">{topic.status === "ready" ? "●" : "○"}</span>
                  <span><b>{topic.title}</b><small>{topic.summary}</small></span>
                  <em>{topic.status === "ready" ? "查看分類" : "規劃中"}</em>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
