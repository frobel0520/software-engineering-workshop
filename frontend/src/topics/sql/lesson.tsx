import { TopicLessonShell } from "../../components/TopicShell";
import { sqlLesson, sqlLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function SqlLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 10 / DATA"
      moduleNumber="10"
      title={<>讓資料庫回答一個<br /><em>精準問題</em></>}
      description="從 orders schema、SELECT 與 WHERE，一路追到 customer 聚合和 ORDER BY 報表。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="SQL 教材">
        {sqlLesson.sections.map((section, index) => {
          const step = sqlLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>SQL</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.query}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "查詢的終點不是語法通過，而是結果能回答一個明確問題。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">SQL QUERY LAB</p><h2>把一張 orders 表變成可讀的答案。</h2><p>{sqlLesson.objectives.length} 個學習目標 · 固定 SQLite fixture，不連線真實資料庫</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 SQL Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
