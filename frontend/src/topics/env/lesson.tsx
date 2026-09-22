import { TopicLessonShell } from "../../components/TopicShell";
import { envLesson, envLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function EnvLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      className="course-lesson-page"
      showMeta={false}
      moduleNumber="06"
      title={<>讓設定跟著環境走<br /><em>但別把秘密打包</em></>}
      description="從 .env.example、.env.local 到 client bundle，理解設定來源、公開邊界與 fail-fast 驗證。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="環境變數教材">
        {envLesson.sections.map((section, index) => {
          const step = envLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "設定是契約；秘密要留在正確的 runtime 邊界。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>把設定放到正確的邊界。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 ENV Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
