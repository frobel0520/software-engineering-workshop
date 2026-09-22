import { remoteLesson, remoteLessonSteps } from "./content";
import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";

export function RemoteLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      className="foundation-lesson-page"
      showMeta={false}
      moduleNumber="02"
      title={<>把本地工作<br /><em>送進協作流程</em></>}
      description="理解 origin、fetch、rebase、push 與 PR 的責任邊界，再走完一次可 review、可合併的遠端工作流。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="遠端協作教材">
        {remoteLesson.sections.map((section, index) => {
          const step = remoteLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "先讓協作狀態可被解釋，再讓它可被合併。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>把分支送上 review。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Remote Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
