import { TopicLessonShell } from "../../components/TopicShell";
import { indexLesson, indexLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function IndexLesson({
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
      moduleNumber="12"
      title={<>讓查詢走更短的路<br /><em>也讓寫入保持一致</em></>}
      description="從 table scan 與 index search 開始，接著用 rollback 與 commit 驗證交易的一致性邊界。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="索引與交易教材">
        {indexLesson.sections.map((section, sectionIndex) => {
          const step = indexLessonSteps[sectionIndex];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(sectionIndex + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "先量測，再決定要不要改變資料存取路徑。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>把效能與一致性變成可驗證的結果。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Index Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
