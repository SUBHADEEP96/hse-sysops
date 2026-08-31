import { addStroke, clearStrokes, normalizePoint, strokePath, undoStroke } from "./strokes";

describe("annotation stroke state", () => {
  const stroke = { id: "one", points: [{ x: 0.25, y: 0.5 }] };
  test("adds, undoes and clears independent strokes", () => {
    const added = addStroke([], stroke);
    expect(added).toEqual([stroke]);
    expect(undoStroke(added)).toEqual([]);
    expect(clearStrokes()).toEqual([]);
  });
  test("normalizes and clamps coordinates for stable resizing", () => {
    expect(normalizePoint(50, 25, 100, 100)).toEqual({ x: 0.5, y: 0.25 });
    expect(normalizePoint(120, -5, 100, 100)).toEqual({ x: 1, y: 0 });
    expect(strokePath(stroke, 200, 100)).toBe("M50 50");
  });
});
