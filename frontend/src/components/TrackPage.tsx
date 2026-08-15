import type { Track } from "../types";

interface TrackPageProps {
  track: Track;
  completedTopicIds: readonly string[];
  onBackToMap: () => void;
  onOpenTopic: (topicId: string) => void;
}

export function TrackPage({ track, completedTopicIds, onBackToMap, onOpenTopic }: TrackPageProps) {
  const completed = new Set(completedTopicIds);
  const readyCount = track.topics.filter((topic) => topic.status === "ready").length;
  const completedCount = track.topics.filter((topic) => topic.status === "ready" && completed.has(topic.id)).length;
  const progress = track.topics.length === 0 ? 0 : Math.round((completedCount / track.topics.length) * 100);

  return (
    <div className="page track-page">
      <button className="track-back" type="button" onClick={onBackToMap}>← 回到課程地圖</button>

      <header className="track-hero">
        <div>
          <p className="kicker">TRACK / {track.id.toUpperCase()}</p>
          <h1>{track.title}</h1>
          <p>{track.description}。先從已開放的 topic 開始，完成後再回到這個分類繼續。</p>
        </div>
        <div className="track-progress-block" aria-label={`${track.title} 分類進度`}>
          <span>{String(completedCount).padStart(2, "0")} / {String(track.topics.length).padStart(2, "0")}</span>
          <div className="track-progress-line"><i style={{ width: `${progress}%` }} /></div>
          <small>{readyCount} 個 topic 已開放</small>
        </div>
      </header>

      <section className="track-topic-section" aria-labelledby="track-topic-title">
        <div className="section-heading track-topic-heading">
          <div><p className="kicker">TOPIC SEQUENCE</p><h2 id="track-topic-title">這個分類包含什麼？</h2></div>
          <p>先理解主題，再進入對應的 Lab。</p>
        </div>

        <div className="track-topic-list">
          {track.topics.map((topic, index) => {
            const isComplete = completed.has(topic.id);
            const isReady = topic.status === "ready";
            return (
              <article className={`track-topic-row ${isReady ? "ready" : "planned"} ${isComplete ? "complete" : ""}`} key={topic.id}>
                <div className="track-topic-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="track-topic-copy">
                  <p className="track-topic-status">{isComplete ? "已完成" : isReady ? "READY" : "規劃中"}</p>
                  <h3>{topic.title}</h3>
                  <p>{topic.summary}</p>
                </div>
                <div className="track-topic-action">
                  {isReady ? (
                    <button className="track-topic-button" type="button" onClick={() => onOpenTopic(topic.id)}>
                      {isComplete ? "再次進入 →" : "進入 Lesson →"}
                    </button>
                  ) : <span className="track-topic-disabled">尚未開放</span>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
