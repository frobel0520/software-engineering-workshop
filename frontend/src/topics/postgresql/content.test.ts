import { describe, expect, it } from "vitest";
import {
  postgresqlEvents,
  postgresqlLabHappyPath,
  postgresqlLesson,
  postgresqlLessonSteps,
  postgresqlPlans,
  postgresqlResults,
  postgresqlSession,
} from "./content";

describe("PostgreSQL lesson content", () => {
  it("answers the four orientation questions and covers PostgreSQL-specific concerns", () => {
    expect(Object.values(postgresqlLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(postgresqlLesson.sections.map((section) => section.id)).toEqual([
      "connect-and-inspect",
      "model-with-types",
      "return-and-query",
      "explain-and-commit",
    ]);
    expect(postgresqlLesson.objectives).toHaveLength(4);
  });

  it("keeps every check connected to deterministic PostgreSQL fixtures", () => {
    expect(postgresqlLessonSteps.map((step) => step.id)).toEqual([
      "inspect-session",
      "define-contract",
      "insert-returning",
      "read-jsonb",
      "create-jsonb-index",
      "explain-query",
      "commit-transaction",
    ]);
    expect(postgresqlEvents).toHaveLength(3);
    expect(postgresqlSession).toMatchObject({ database: "workshop", user: "student" });
    expect(postgresqlSession.serverVersion).toContain("PostgreSQL");
    expect(postgresqlPlans["before-index"].operation).toBe("seq-scan");
    expect(postgresqlPlans["after-index"].operation).toBe("bitmap-index-scan");
    expect(postgresqlLessonSteps[1].code).toContain("occurred_at timestamptz NOT NULL");
    expect(postgresqlLessonSteps[2].code).toContain("RETURNING id, occurred_at, payload");
    expect(postgresqlLessonSteps[4].code).toContain("USING GIN");
    expect(postgresqlLessonSteps[6].code).toContain("UPDATE events");
    expect(postgresqlResults["insert-returning"].rows[0][0]).toBe(104);
    expect(postgresqlLabHappyPath).toHaveLength(7);
  });
});
