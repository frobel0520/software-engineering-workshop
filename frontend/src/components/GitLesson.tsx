import { gitLessons, gitWorkflow } from "../content/git";

export function GitLesson({ completed, onOpenLab }: { completed: boolean; onOpenLab: () => void }) {
  return (
    <div className="page lesson-page">
      <header className="lesson-hero">
        <div>
          <p className="kicker">MODULE 01 / FOUNDATIONS</p>
          <h1>Git：讓改變<br /><em>有跡可循</em></h1>
          <p>先建立正確的心智模型，再到 Lab 親手走過一次 branch → commit → merge。</p>
        </div>
        <div className={`module-status ${completed ? "done" : ""}`}>
          <span>{completed ? "✓" : "01"}</span>
          <div><small>MODULE STATUS</small><b>{completed ? "已完成" : "學習中"}</b></div>
        </div>
      </header>

      <section className="mental-model">
        <div className="section-heading">
          <div><p className="kicker">MENTAL MODEL</p><h2>檔案如何變成歷史</h2></div>
          <p>每一步都在縮小「這次到底要記錄什麼」。</p>
        </div>
        <div className="workflow-row">
          {gitWorkflow.map(([title, description], index) => (
            <div className="workflow-step" key={title}>
              <span>0{index + 1}</span><h3>{title}</h3><p>{description}</p>
              {index < gitWorkflow.length - 1 ? <i>→</i> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="lesson-list">
        {gitLessons.map((lesson) => (
          <article className="lesson-card" key={lesson.number}>
            <div className="lesson-index"><span>{lesson.number}</span><small>{lesson.eyebrow}</small></div>
            <div className="lesson-copy">
              <h2>{lesson.title}</h2>
              <p>{lesson.body}</p>
              <code><span>$</span> {lesson.command}</code>
            </div>
            <aside><small>記住這句</small><p>{lesson.takeaway}</p></aside>
          </article>
        ))}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">READY TO PRACTICE?</p><h2>看懂了，現在親手做一次。</h2><p>8 個指令，約 8 分鐘。輸錯不會破壞任何真實檔案。</p></div>
        <button className="button light" onClick={onOpenLab}>進入 Git Lab <span>→</span></button>
      </section>
    </div>
  );
}
