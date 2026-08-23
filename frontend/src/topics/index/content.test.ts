import { describe, expect, it } from "vitest";
import {
  indexAccounts,
  indexLabHappyPath,
  indexLesson,
  indexLessonSteps,
  indexOrders,
  indexQueryPlans,
  indexResults,
} from "./content";

describe("Index and transaction lesson content", () => {
  it("answers the four orientation questions and covers the two data concerns", () => {
    expect(Object.values(indexLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(indexLesson.sections.map((section) => section.id)).toEqual([
      "read-path",
      "target-index",
      "atomic-write",
      "consistency-check",
    ]);
    expect(indexLesson.objectives).toHaveLength(4);
  });

  it("keeps every check connected to deterministic plans and fixtures", () => {
    expect(indexLessonSteps.map((step) => step.id)).toEqual([
      "inspect-plan",
      "create-index",
      "verify-plan",
      "rollback-batch",
      "commit-batch",
    ]);
    expect(indexOrders).toHaveLength(6);
    expect(indexAccounts).toHaveLength(2);
    expect(indexQueryPlans["before-index"].operation).toBe("table-scan");
    expect(indexQueryPlans["after-index"].rowsExamined).toBe(2);
    expect(indexResults["commit-batch"].rows).toEqual([["Ada", 2800, "committed"], ["Lin", 2000, "committed"]]);
    expect(indexLabHappyPath).toHaveLength(5);
  });
});
