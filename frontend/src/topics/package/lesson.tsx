import { TopicLessonShell } from "../../components/TopicShell";
import { packageLesson, packageLessonSteps } from "./content";

export function PackageLesson({ completed, onOpenLab }: { completed: boolean; onOpenLab: () => void }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 05 / FOUNDATIONS"
      moduleNumber="05"
      title={<>讓依賴可重現<br /><em>而不是碰運氣</em></>}
      description="從 package.json、lockfile 到 clean install，理解版本解析與可重現依賴；所有操作都在固定 fixture 中完成。"
      completed={completed}
    >
      <section className="lesson-list" aria-label="套件管理教材">
        {packageLesson.sections.map((section, index) => {
          const step = packageLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>PACKAGE</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "先讀懂 dependency graph，再決定下一個操作。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">PACKAGE MANAGEMENT LAB</p><h2>把依賴裝得可重現。</h2><p>{packageLesson.objectives.length} 個學習目標 · 不連線真實 registry</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Package Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
