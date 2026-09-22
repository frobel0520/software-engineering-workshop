import { TopicLessonShell } from "../../components/TopicShell";
import { logsLesson, logsLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function LogsLesson({
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
      moduleNumber="16"
      title={<>讓每一筆日誌都留下可追蹤的線索<br /><em>沿著 timeline 找到安全證據</em></>}
      description="從 structured event、severity、correlationId 與 safe context 開始，重跑正常完成、輸入拒絕與依賴逾時的 request timeline。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="日誌教材">
        {logsLesson.sections.map((section, sectionIndex) => {
          const step = logsLessonSteps[sectionIndex];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(sectionIndex + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "先固定可觀察的 event，再讓日誌留下安全證據。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>把 request timeline 跑成可安全重現的 evidence。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Logs Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
