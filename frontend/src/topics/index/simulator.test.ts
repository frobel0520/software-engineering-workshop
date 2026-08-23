import { describe, expect, it } from "vitest";
import { indexFailureFixtures, indexLabHappyPath, indexLabInitialState } from "./content";
import {
  createInitialIndexState,
  indexSimulator,
  isIndexLabComplete,
  resetIndexLab,
  runIndexEvent,
  runIndexEvents,
} from "./simulator";

describe("Index and transaction deterministic simulator", () => {
  it("starts before the first query plan check", () => {
    expect(createInitialIndexState()).toEqual(indexLabInitialState);
    expect(createInitialIndexState().plan).toBeNull();
    expect(createInitialIndexState().transactionStatus).toBe("idle");
  });

  it("completes the index and transaction workflow", () => {
    const result = runIndexEvents(indexLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toHaveLength(5);
    expect(result.state.indexCreated).toBe(true);
    expect(result.state.plan?.operation).toBe("index-search");
    expect(result.state.transactionStatus).toBe("committed");
    expect(result.state.result?.id).toBe("commit-batch");
    expect(isIndexLabComplete(result.state)).toBe(true);
  });

  it("blocks plan verification until the index exists", () => {
    const result = runIndexEvent(createInitialIndexState(), { type: "verify-plan" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.plan).toBeNull();
    expect(result.state.lastMessage).toContain("建立 idx_orders_customer_id");
  });

  it("keeps rollback separate from the committed transfer", () => {
    const result = runIndexEvents(indexLabHappyPath.slice(0, 4));

    expect(result.state.phase).toBe("active");
    expect(result.state.transactionStatus).toBe("rolled-back");
    expect(result.state.result?.rows).toEqual([["Ada", 3000, "rolled back"], ["Lin", 1800, "rolled back"]]);
    expect(isIndexLabComplete(result.state)).toBe(false);
  });

  it("documents the main out-of-order failure fixtures", () => {
    expect(indexFailureFixtures.map((fixture) => fixture.event)).toEqual([
      "create-index",
      "verify-plan",
      "commit-batch",
    ]);
    expect(runIndexEvent(createInitialIndexState(), { type: "create-index" }).accepted).toBe(false);
    expect(runIndexEvent(createInitialIndexState(), { type: "commit-batch" }).accepted).toBe(false);
  });

  it("resets and remains deterministic", () => {
    const first = runIndexEvents(indexLabHappyPath);
    const second = runIndexEvents(indexLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetIndexLab()).toEqual(createInitialIndexState());
    expect(indexSimulator.reset()).toEqual(createInitialIndexState());
  });
});
