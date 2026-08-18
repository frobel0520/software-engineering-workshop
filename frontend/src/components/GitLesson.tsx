import { TopicOrientation } from "./TopicShell";
import type { LessonOrientation } from "../topics/types";
import { gitCommandGuide, gitLessons, gitPipeline, gitWorkflow } from "../content/git";

export function GitLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <div className="page lesson-page">
      <header className="lesson-hero">
        <div>
          <p className="kicker">MODULE 01 / FOUNDATIONS</p>
          <h1>Git：讓改變<br /><em>有跡可循</em></h1>
          <p>先建立本地歷史與遠端協作的心智模型，再到 Lab 親手走過 clone → commit → push → pipeline → merge。</p>
        </div>
        <div className={`module-status ${completed ? "done" : ""}`}>
          <span>{completed ? "✓" : "01"}</span>
          <div><small>MODULE STATUS</small><b>{completed ? "已完成" : "學習中"}</b></div>
        </div>
      </header>

      <TopicOrientation orientation={orientation} />

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

      <section className="lesson-list git-command-guide" aria-label="Git 指令與使用時機">
        <div className="section-heading"><div><p className="kicker">COMMAND DECISION GUIDE</p><h2>知道指令，更要知道什麼時候用</h2></div><p>每個操作都要能說明它改變了哪一層狀態。</p></div>
        {gitCommandGuide.map((guide, index) => (
          <article className="lesson-card" key={guide.id}>
            <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>{guide.category}</small></div>
            <div className="lesson-copy">
              <h2>{guide.title}</h2>
              <p>{guide.body}</p>
              <code><span>$</span> {guide.command}</code>
            </div>
            <aside><small>什麼時候用</small><p>{guide.when}</p><small>記住這句</small><p>{guide.takeaway}</p></aside>
          </article>
        ))}
      </section>

      <section className="mental-model git-pipeline-model" aria-label="Commit 到部署的 pipeline">
        <div className="section-heading">
          <div><p className="kicker">FROM COMMIT TO DEPLOY</p><h2>push 之後，平台做了什麼？</h2></div>
          <p>Git command 改變 repository；hosted platform 再依規則啟動 review、pipeline 與部署。</p>
        </div>
        <div className="workflow-row">
          {gitPipeline.map(([label, title, description], index) => (
            <div className="workflow-step" key={label}>
              <span>0{index + 1}</span><h3>{title}</h3><p><b>{label}</b> · {description}</p>
              {index < gitPipeline.length - 1 ? <i>→</i> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="lab-cta">
        <div><p className="kicker">READY TO PRACTICE?</p><h2>看懂了，現在親手做一次。</h2><p>一條 cowork workflow，約 12 分鐘。輸錯不會破壞任何真實 repository。</p></div>
        <button className="button light" onClick={onOpenLab}>進入 Git Lab <span>→</span></button>
      </section>
    </div>
  );
}
