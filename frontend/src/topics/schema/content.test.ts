import { describe, expect, it } from "vitest";
import { schemaLabHappyPath, schemaLesson, schemaLessonSteps, schemaProjects, schemaRelations, schemaResults, schemaTables, schemaTasks } from "./content";

describe("Schema lesson content", () => {
  it("answers the four orientation questions and covers the model pipeline", () => {
    expect(Object.values(schemaLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(schemaLesson.sections.map((section) => section.id)).toEqual([
      "identify-entities",
      "define-keys",
      "link-entities",
      "protect-integrity",
    ]);
    expect(schemaLesson.objectives).toHaveLength(4);
  });

  it("keeps every decision connected to deterministic tables and fixture rows", () => {
    expect(schemaLessonSteps).toHaveLength(5);
    expect(schemaLessonSteps.map((step) => step.id)).toEqual([
      "identify-entities",
      "define-keys",
      "link-project-task",
      "mark-nullable",
      "validate-integrity",
    ]);
    expect(schemaTables).toHaveLength(2);
    expect(schemaTables[1].columns).toHaveLength(5);
    expect(schemaProjects).toHaveLength(3);
    expect(schemaTasks).toHaveLength(4);
    expect(schemaRelations[0].cardinality).toContain("many");
    expect(schemaResults["mark-nullable"].rows).toHaveLength(5);
    expect(schemaResults["validate-integrity"].rows).toHaveLength(4);
    expect(schemaLabHappyPath).toHaveLength(5);
  });
});
