import { TopicLessonShell } from "../../components/TopicShell";
import { integrationLesson, integrationLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function IntegrationLesson({
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
      className="course-lesson-page"
      showMeta={false}
      moduleNumber="15"
      title={<>讓模組契約一起工作<br /><em>沿著 boundary 找到證據</em></>}
      description="從 integration boundary 開始，追蹤 success、contract failure 與 dependency failure 如何被觀察。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="整合測試教材">
        {integrationLesson.sections.map((section, sectionIndex) => {
          const step = integrationLessonSteps[sectionIndex];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(sectionIndex + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "先固定可觀察的 boundary，再讓整合結果留下證據。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>把 success 與 failure path 跑成可觀察的 boundary trace。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Integration Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
