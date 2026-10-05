/**
 * The Village -- data published by the digital_sim daily runner into
 * public/village/ (days/index.json, days/NNNN/story.json + trace.jsonl.gz,
 * world.json). Read at build time, so every episode page is static and the
 * site needs no backend. A new episode arrives as new files and a redeploy.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { digestOf, parseTrace, type Digest } from "./villageTrace";

const ROOT = path.join(process.cwd(), "public", "village");

export interface EpisodeIndexEntry {
  episode: number;
  date: string;
  title: string;
  summary: string;
  start_tick: number;
  end_tick: number;
  alive: number;
  born: number;
  died: number;
  written_by: string;
  path: string; // "days/0001/"
}

export interface VillageIndex {
  updated: string;
  episodes: EpisodeIndexEntry[];
  /** Set while the site shows a past test run instead of the daily world. */
  preview?: string;
}

export interface Facts {
  village_days: [string, string];
  alive_at_end: string[];
  born: { name: string; role: string; house_owner: string; when: string }[];
  died: { name: string; cause: string; when: string }[];
  built: { type: string; x: number; y: number; by: string | null; when: string }[];
  trades_completed: number;
  lessons_taught: number;
  goods_sold_at_market: number;
  richest: { name: string; coins: number }[];
  conversations: { from: string; to: string; said: string; reply: string }[];
}

export interface Story extends EpisodeIndexEntry {
  story: string[];
  facts: Facts;
  model?: string;
}

export interface Person {
  id: string;
  name: string;
  role: "explorer" | "builder" | "gatherer" | "scholar";
  alive: boolean;
  coins: number;
  food: number;
  tools_made: number;
  lessons_taught: number;
}

function read<T>(rel: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as T;
  } catch {
    return null;
  }
}

export function getIndex(): VillageIndex {
  return read<VillageIndex>("days/index.json") ?? { updated: "", episodes: [] };
}

export function getStory(episode: number): Story | null {
  const entry = getIndex().episodes.find((e) => e.episode === episode);
  const story = entry ? read<Story>(`${entry.path}story.json`) : null;
  // story.json does not carry its own folder; the index does.
  return story && entry ? { ...story, path: entry.path } : null;
}

export function getPeople(): Person[] {
  const world = read<{ people: Person[] }>("world.json");
  return (world?.people ?? []).slice().sort((a, b) => Number(b.alive) - Number(a.alive) || a.name.localeCompare(b.name));
}

/** URL the replay loads, relative to the site root. */
export const traceUrl = (e: EpisodeIndexEntry) => `/village/${e.path}trace.jsonl.gz`;

/**
 * The episode's poster, cast and chapters, worked out at build time from its
 * trace, so the page shows the village and its moments before anything
 * downloads. A few KB in the HTML instead of the 0.3 MB trace.
 */
export function getDigest(e: EpisodeIndexEntry): Digest | null {
  try {
    const raw = fs.readFileSync(path.join(ROOT, `${e.path}trace.jsonl.gz`));
    return digestOf(parseTrace(zlib.gunzipSync(raw).toString("utf8")));
  } catch {
    return null;
  }
}
