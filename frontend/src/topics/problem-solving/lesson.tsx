import { TopicLessonShell } from "../../components/TopicShell";
import { problemSolvingLesson, problemSolvingLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function ProblemSolvingLesson({
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
      moduleNumber="EX"
      title={<>從症狀走到<br /><em>可驗證的修復</em></>}
      description="把除錯、事故處理與錯誤邊界整理成一條可重複的工程工作流。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="問題處理方法教材">
        {problemSolvingLesson.sections.map((section, sectionIndex) => {
          const step = problemSolvingLessonSteps[sectionIndex];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(sectionIndex + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "先保留證據，再決定下一個可驗證的動作。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div>
          <h2>把猜測改成可追蹤的檢查。</h2>
        </div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Problem Solving Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
