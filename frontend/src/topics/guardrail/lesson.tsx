import { guardrailLesson } from "./content";
import { TopicLessonShell } from "../../components/TopicShell";

export function GuardrailLesson({ completed, onOpenLab }: { completed: boolean; onOpenLab: () => void }) {
  return (
    <TopicLessonShell
      eyebrow="EXTENSION / AI & LLM ENGINEERING"
      moduleNumber="EX"
      title={<>在模型邊界<br /><em>放一道防線</em></>}
      description="從 Validator、Guard 到 OnFailAction，理解如何在 input、output 與 tool 三個掛載點建立可解釋、可重設的 deterministic guardrail pipeline。"
      completed={completed}
    >
      <section className="lesson-list" aria-label="Guardrail 教材">
        {guardrailLesson.sections.map((section, index) => (
          <article className="lesson-card" key={section.id}>
            <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>GUARDRAIL</small></div>
            <div className="lesson-copy"><h2>{section.title}</h2><p>{section.body}</p></div>
            <aside><small>學習目標</small><p>{guardrailLesson.objectives[index] ?? "讓每個失敗都留下可理解的理由。"}</p></aside>
          </article>
        ))}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">GUARDRAIL LAB</p><h2>把規則放進 pipeline。</h2><p>Extension track · deterministic fixture · 不呼叫真實模型</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Guardrail Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
