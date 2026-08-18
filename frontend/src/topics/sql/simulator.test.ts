import { describe, expect, it } from "vitest";
import { sqlFailureFixtures, sqlLabHappyPath, sqlLabInitialState } from "./content";
import {
  createInitialSqlState,
  isSqlLabComplete,
  resetSqlLab,
  runSqlEvent,
  runSqlEvents,
  sqlSimulator,
} from "./simulator";

describe("SQL deterministic simulator", () => {
  it("starts without a query result", () => {
    expect(createInitialSqlState()).toEqual(sqlLabInitialState);
    expect(createInitialSqlState().result).toBeNull();
    expect(createInitialSqlState().phase).toBe("initial");
  });

  it("completes schema, selection, filter, aggregate, and sort", () => {
    const result = runSqlEvents(sqlLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toHaveLength(5);
    expect(result.state.result?.id).toBe("order-total");
    expect(result.state.result?.rows).toEqual([["Ada", 2000], ["Lin", 1250], ["Mina", 650]]);
    expect(isSqlLabComplete(result.state)).toBe(true);
  });

  it("blocks a filter until SELECT has produced rows", () => {
    const result = runSqlEvent(createInitialSqlState(), { type: "filter-paid" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.result).toBeNull();
    expect(result.state.lastMessage).toContain("選出 orders 欄位");
  });

  it("keeps GROUP BY output unsorted until ORDER BY runs", () => {
    const grouped = runSqlEvents(sqlLabHappyPath.slice(0, 4)).state;
    const ordered = runSqlEvent(grouped, { type: "order-total" });

    expect(grouped.phase).toBe("active");
    expect(grouped.result?.rows[0]).toEqual(["Lin", 1250]);
    expect(ordered.state.result?.rows[0]).toEqual(["Ada", 2000]);
    expect(ordered.state.phase).toBe("completed");
  });

  it("documents the main out-of-order failure fixtures", () => {
    expect(sqlFailureFixtures.map((fixture) => fixture.event)).toEqual(["select-columns", "filter-paid", "order-total"]);
    expect(runSqlEvent(createInitialSqlState(), { type: "select-columns" }).accepted).toBe(false);
    expect(runSqlEvent(createInitialSqlState(), { type: "order-total" }).accepted).toBe(false);
  });

  it("resets and remains deterministic", () => {
    const first = runSqlEvents(sqlLabHappyPath);
    const second = runSqlEvents(sqlLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetSqlLab()).toEqual(createInitialSqlState());
    expect(sqlSimulator.reset()).toEqual(createInitialSqlState());
  });
});
