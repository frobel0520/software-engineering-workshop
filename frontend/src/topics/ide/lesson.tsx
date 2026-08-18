import { TopicLessonShell } from "../../components/TopicShell";
import { ideLesson, ideLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function IdeLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 04 / FOUNDATIONS"
      moduleNumber="04"
      title={<>用除錯器看見程式<br /><em>正在做什麼</em></>}
      description="先在固定的 editor fixture 建立 context，再設定 breakpoint、閱讀 paused state，最後用 step over 與 continue 觀察程式如何完成。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="IDE／除錯器教材">
        {ideLesson.sections.map((section, index) => {
          const step = ideLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>IDE</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>›</span> {step.command}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "先讀懂執行線索，再決定下一個 debugger 動作。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">DEBUGGER LAB</p><h2>把除錯流程走一遍。</h2><p>{ideLesson.objectives.length} 個學習目標 · 只使用瀏覽器內固定 fixture</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 IDE Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
