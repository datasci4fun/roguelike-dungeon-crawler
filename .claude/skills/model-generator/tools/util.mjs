import fs from "node:fs";
import path from "node:path";

export function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function writeJSON(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

export function readText(p) {
  return fs.readFileSync(p, "utf8");
}

export function writeText(p, s) {
  fs.writeFileSync(p, s.endsWith("\n") ? s : s + "\n");
}

export function ensureMarkers(text, markers) {
  for (const m of markers) {
    if (!text.includes(m.start) || !text.includes(m.end)) {
      throw new Error(`Missing marker block: ${m.start} ... ${m.end}`);
    }
  }
}

export function extractBetween(text, startMarker, endMarker) {
  const a = text.indexOf(startMarker);
  const b = text.indexOf(endMarker);
  if (a === -1 || b === -1 || b < a) throw new Error(`Bad markers: ${startMarker} / ${endMarker}`);
  const start = a + startMarker.length;
  const mid = text.slice(start, b);
  return { pre: text.slice(0, start), mid, post: text.slice(b) };
}

export function stableSortBy(arr, keyFn) {
  return [...arr].sort((x, y) => {
    const a = keyFn(x);
    const b = keyFn(y);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}
