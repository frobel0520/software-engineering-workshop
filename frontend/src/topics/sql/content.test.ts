import { describe, expect, it } from "vitest";
import { sqlLesson, sqlLessonSteps, sqlOrders, sqlQueryResults, sqlTableColumns } from "./content";

describe("SQL lesson content", () => {
  it("answers the four orientation questions and covers the query pipeline", () => {
    expect(Object.values(sqlLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(sqlLesson.sections.map((section) => section.id)).toEqual([
      "inspect-shape",
      "select-columns",
      "filter-before-group",
      "aggregate-and-order",
    ]);
    expect(sqlLesson.objectives).toHaveLength(4);
  });

  it("keeps every query step connected to deterministic schema and rows", () => {
    expect(sqlLessonSteps).toHaveLength(5);
    expect(sqlLessonSteps.map((step) => step.id)).toEqual([
      "inspect-schema",
      "select-columns",
      "filter-paid",
      "group-customers",
      "order-total",
    ]);
    expect(sqlTableColumns).toHaveLength(4);
    expect(sqlOrders).toHaveLength(6);
    expect(sqlQueryResults["filter-paid"].rows).toHaveLength(4);
    expect(sqlQueryResults["order-total"].rows[0]).toEqual(["Ada", 2000]);
  });
});
