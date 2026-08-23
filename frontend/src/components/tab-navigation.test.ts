import { describe, expect, it } from "vitest";
import { tabIndexForKey } from "./tab-navigation";

describe("tab keyboard navigation", () => {
  it("wraps through horizontal and vertical arrow keys", () => {
    expect(tabIndexForKey("ArrowRight", 0, 3)).toBe(1);
    expect(tabIndexForKey("ArrowDown", 2, 3)).toBe(0);
    expect(tabIndexForKey("ArrowLeft", 0, 3)).toBe(2);
    expect(tabIndexForKey("ArrowUp", 2, 3)).toBe(1);
  });

  it("jumps to the first or last tab with Home and End", () => {
    expect(tabIndexForKey("Home", 2, 3)).toBe(0);
    expect(tabIndexForKey("End", 0, 3)).toBe(2);
  });

  it("ignores unsupported keys and invalid tab positions", () => {
    expect(tabIndexForKey("Enter", 1, 3)).toBeNull();
    expect(tabIndexForKey("ArrowRight", -1, 3)).toBeNull();
    expect(tabIndexForKey("ArrowRight", 0, 0)).toBeNull();
  });
});
