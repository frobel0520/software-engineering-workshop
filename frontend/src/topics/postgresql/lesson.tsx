import { TopicLessonShell } from "../../components/TopicShell";
import { postgresqlLesson, postgresqlLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function PostgreSqlLesson({
  completed,
  onOpenLab,
  orientation,
}: {
  completed: boolean;
  onOpenLab: () => void;
  orientation: LessonOrientation;
}) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 13 / DATA"
      moduleNumber="13"
      title={<>從 psql 連線到<br /><em>可驗證的寫入</em></>}
      description="從 PostgreSQL session、型別與 JSONB 開始，追到 RETURNING、EXPLAIN 與 transaction commit。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="PostgreSQL 教材">
        {postgresqlLesson.sections.map((section, sectionIndex) => {
          const step = postgresqlLessonSteps[sectionIndex];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(sectionIndex + 1).padStart(2, "0")}</span><small>PGSQL</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "先確認 session，再把資料庫行為變成可觀察結果。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">POSTGRESQL LAB</p><h2>把 PostgreSQL 的邊界跑成一條可驗證流程。</h2><p>{postgresqlLesson.objectives.length} 個學習目標 · 固定 events fixture，不連線真實資料庫</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 PostgreSQL Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
