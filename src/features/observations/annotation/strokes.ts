export type NormalizedPoint = { x: number; y: number };
export type Stroke = { id: string; points: NormalizedPoint[] };

export const normalizePoint = (x: number, y: number, width: number, height: number): NormalizedPoint => ({
  x: Math.max(0, Math.min(1, width ? x / width : 0)),
  y: Math.max(0, Math.min(1, height ? y / height : 0)),
});
export const addStroke = (strokes: Stroke[], stroke: Stroke) =>
  stroke.points.length ? [...strokes, stroke] : strokes;
export const undoStroke = (strokes: Stroke[]) => strokes.slice(0, -1);
export const clearStrokes = (): Stroke[] => [];
export const strokePath = (stroke: Stroke, width: number, height: number) =>
  stroke.points
    .map((point, index) => `${index ? "L" : "M"}${point.x * width} ${point.y * height}`)
    .join(" ");
