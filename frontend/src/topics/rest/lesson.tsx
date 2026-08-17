import { TopicLessonShell } from "../../components/TopicShell";
import { restLesson } from "./content";
import type { LessonOrientation } from "../types";

export function RestLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 08 / WEB & API"
      moduleNumber="08"
      title={<>一個 request<br /><em>穿過哪些程式碼？</em></>}
      description="從 React fetch、FastAPI routing 與 Pydantic validation，一路追到 ORM、SQLite 與 JSON response。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="FastAPI request lifecycle 教材">
        {restLesson.sections.map((section, index) => (
          <article className="lesson-card" key={section.id}>
            <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>REQUEST</small></div>
            <div className="lesson-copy"><h2>{section.title}</h2><p>{section.body}</p></div>
            <aside><small>觀察重點</small><p>{restLesson.objectives[index]}</p></aside>
          </article>
        ))}
      </section>
      <section className="lab-cta">
        <div><p className="kicker">FASTAPI REQUEST LAB</p><h2>讓 request 自己帶你讀程式。</h2><p>逐行解說 · deterministic simulator · 不連線真實 backend</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 FastAPI Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
