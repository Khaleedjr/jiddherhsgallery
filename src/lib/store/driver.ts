import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Storage is a handful of keyed collections (products, orders, stock log) plus
 * counters. Two interchangeable drivers keep it that simple:
 *
 * - **Upstash Redis** over its REST API, when `KV_REST_API_URL` +
 *   `KV_REST_API_TOKEN` (or the `UPSTASH_REDIS_REST_*` pair) are set. This is
 *   the one to use on Vercel, where the filesystem does not survive a request.
 * - **JSON files** otherwise — `./.data` locally, or `JG_DATA_DIR` if set. Right
 *   for `next dev` and for any server with a real disk.
 */
export interface Driver {
  readonly kind: "redis" | "file";
  /** False when writes will not survive (the file driver on a serverless host). */
  readonly persistent: boolean;
  all<T>(collection: string): Promise<Record<string, T>>;
  get<T>(collection: string, id: string): Promise<T | null>;
  put<T>(collection: string, entries: Record<string, T>): Promise<void>;
  remove(collection: string, ids: string[]): Promise<void>;
  incr(counter: string, by?: number): Promise<number>;
  getValue<T>(key: string): Promise<T | null>;
  setValue<T>(key: string, value: T): Promise<void>;
  /** Visitor stats: adds to one day's counters, notes the visitor for that day's unique count, and keeps a short list of recent visits. */
  recordHit(hit: StatsHit): Promise<void>;
  /** Each day's counters and unique visitors, plus the unique visitors across all of them. */
  readStatsDays(days: string[]): Promise<{ days: StatsDay[]; visitors: number }>;
  /** The most recent visits, newest first, as recorded. */
  recentHits(limit: number): Promise<string[]>;
}

export type StatsHit = { day: string; counts: Record<string, number>; visitor: string; recent: string; keepRecent: number };
export type StatsDay = { counts: Record<string, number>; visitors: number };

/* ------------------------------------------------------------------ files */

type FileState = { mtimeMs: number; data: Record<string, unknown> };

class FileDriver implements Driver {
  readonly kind = "file" as const;
  private cache = new Map<string, FileState>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private dir: string,
    readonly persistent: boolean,
  ) {}

  private file(name: string) {
    return path.join(this.dir, `${name.replace(/[^a-z0-9-]/gi, "_")}.json`);
  }

  /** Read through a cache that notices when another process has rewritten the file. */
  private async load(name: string): Promise<Record<string, unknown>> {
    const file = this.file(name);
    let mtimeMs = -1;
    try {
      mtimeMs = (await fs.stat(file)).mtimeMs;
    } catch {
      return {};
    }
    const cached = this.cache.get(name);
    if (cached && cached.mtimeMs === mtimeMs) return cached.data;
    const data = JSON.parse(await fs.readFile(file, "utf8")) as Record<string, unknown>;
    this.cache.set(name, { mtimeMs, data });
    return data;
  }

  /** Writes are serialised and land via rename, so a reader never sees half a file. */
  private write(name: string, mutate: (data: Record<string, unknown>) => void) {
    const run = async () => {
      await fs.mkdir(this.dir, { recursive: true });
      const data = { ...(await this.load(name)) };
      mutate(data);
      const file = this.file(name);
      const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data));
      await fs.rename(tmp, file);
      this.cache.set(name, { mtimeMs: (await fs.stat(file)).mtimeMs, data });
      return data;
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async all<T>(collection: string) {
    return { ...(await this.load(collection)) } as Record<string, T>;
  }

  async get<T>(collection: string, id: string) {
    const data = await this.load(collection);
    return (data[id] as T | undefined) ?? null;
  }

  async put<T>(collection: string, entries: Record<string, T>) {
    await this.write(collection, (data) => Object.assign(data, entries));
  }

  async remove(collection: string, ids: string[]) {
    await this.write(collection, (data) => {
      for (const id of ids) delete data[id];
    });
  }

  async incr(counter: string, by = 1) {
    let value = 0;
    await this.write("meta", (data) => {
      value = Number(data[`seq:${counter}`] ?? 0) + by;
      data[`seq:${counter}`] = value;
    });
    return value;
  }

  async getValue<T>(key: string) {
    const data = await this.load("meta");
    return (data[key] as T | undefined) ?? null;
  }

  async setValue<T>(key: string, value: T) {
    await this.write("meta", (data) => {
      data[key] = value;
    });
  }

  /* Stats live in their own file: { "d:<day>": counters, "u:<day>": visitor ids, recent: [...] }. */
  async recordHit({ day, counts, visitor, recent, keepRecent }: StatsHit) {
    await this.write("stats", (data) => {
      const totals = ((data[`d:${day}`] as Record<string, number> | undefined) ??= {});
      for (const [field, by] of Object.entries(counts)) totals[field] = (totals[field] ?? 0) + by;
      const visitors = ((data[`u:${day}`] as string[] | undefined) ??= []);
      if (!visitors.includes(visitor)) visitors.push(visitor);
      data.recent = [recent, ...((data.recent as string[] | undefined) ?? [])].slice(0, keepRecent);
    });
  }

  async readStatsDays(days: string[]) {
    const data = await this.load("stats");
    const all = new Set<string>();
    const out = days.map((day) => {
      const visitors = (data[`u:${day}`] as string[] | undefined) ?? [];
      for (const v of visitors) all.add(v);
      return { counts: { ...((data[`d:${day}`] as Record<string, number> | undefined) ?? {}) }, visitors: visitors.length };
    });
    return { days: out, visitors: all.size };
  }

  async recentHits(limit: number) {
    return (((await this.load("stats")).recent as string[] | undefined) ?? []).slice(0, limit);
  }
}

/* ------------------------------------------------------------------ redis */

type Command = Array<string | number>;
const PREFIX = "jg:";
/** Upstash rejects requests over 1 MB, so writes are split into requests well under that. */
const REQUEST_BUDGET = 450 * 1024;

class RedisDriver implements Driver {
  readonly kind = "redis" as const;
  readonly persistent = true;

  constructor(
    private url: string,
    private token: string,
  ) {}

  private async send<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.url.replace(/\/$/, "")}${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Redis request failed: ${response.status} ${await response.text()}`);
    return (await response.json()) as T;
  }

  private async run<T>(command: Command): Promise<T> {
    const { result, error } = await this.send<{ result?: T; error?: string }>("", command);
    if (error) throw new Error(`Redis error: ${error}`);
    return result as T;
  }

  private async pipeline(commands: Command[]) {
    await this.pipelineResults(commands);
  }

  private async pipelineResults<T = unknown>(commands: Command[]): Promise<T[]> {
    if (!commands.length) return [];
    const results = await this.send<Array<{ result?: T; error?: string }>>("/pipeline", commands);
    const failed = results.find((entry) => entry.error);
    if (failed) throw new Error(`Redis error: ${failed.error}`);
    return results.map((entry) => entry.result as T);
  }

  async all<T>(collection: string) {
    const flat = (await this.run<string[] | null>(["HGETALL", PREFIX + collection])) ?? [];
    const out: Record<string, T> = {};
    for (let i = 0; i < flat.length; i += 2) out[flat[i]] = JSON.parse(flat[i + 1]) as T;
    return out;
  }

  async get<T>(collection: string, id: string) {
    const raw = await this.run<string | null>(["HGET", PREFIX + collection, id]);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async put<T>(collection: string, entries: Record<string, T>) {
    // Pack fields into HSETs of at most REQUEST_BUDGET bytes, one request each.
    let command: Command = ["HSET", PREFIX + collection];
    let size = 0;
    const flush = async () => {
      if (command.length > 2) await this.pipeline([command]);
      command = ["HSET", PREFIX + collection];
      size = 0;
    };
    for (const [id, value] of Object.entries(entries)) {
      const json = JSON.stringify(value);
      const bytes = Buffer.byteLength(json) + Buffer.byteLength(id) + 16;
      if (size && size + bytes > REQUEST_BUDGET) await flush();
      command.push(id, json);
      size += bytes;
    }
    await flush();
  }

  async remove(collection: string, ids: string[]) {
    if (ids.length) await this.run(["HDEL", PREFIX + collection, ...ids]);
  }

  async incr(counter: string, by = 1) {
    return Number(await this.run<number>(["INCRBY", `${PREFIX}seq:${counter}`, by]));
  }

  async getValue<T>(key: string) {
    const raw = await this.run<string | null>(["GET", PREFIX + key]);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async setValue<T>(key: string, value: T) {
    await this.run(["SET", PREFIX + key, JSON.stringify(value)]);
  }

  /* Stats keys: a hash of counters per day, a HyperLogLog of visitors per day (12 KB at most, however
     many visit), and one capped list of recent visits. A visit costs one request of a few commands. */
  async recordHit({ day, counts, visitor, recent, keepRecent }: StatsHit) {
    const hash = `${PREFIX}stats:d:${day}`;
    await this.pipeline([
      ...Object.entries(counts).map(([field, by]): Command => ["HINCRBY", hash, field, by]),
      ["PFADD", `${PREFIX}stats:u:${day}`, visitor],
      ["LPUSH", `${PREFIX}stats:recent`, recent],
      ["LTRIM", `${PREFIX}stats:recent`, 0, keepRecent - 1],
    ]);
  }

  async readStatsDays(days: string[]) {
    const out: StatsDay[] = [];
    // A month of days per request keeps each reply well under Upstash's size limits.
    for (let i = 0; i < days.length; i += 31) {
      const chunk = days.slice(i, i + 31);
      const results = await this.pipelineResults<string[] | number | null>([
        ...chunk.map((day): Command => ["HGETALL", `${PREFIX}stats:d:${day}`]),
        ...chunk.map((day): Command => ["PFCOUNT", `${PREFIX}stats:u:${day}`]),
      ]);
      chunk.forEach((_, index) => {
        const flat = (results[index] as string[] | null) ?? [];
        const counts: Record<string, number> = {};
        for (let j = 0; j < flat.length; j += 2) counts[flat[j]] = Number(flat[j + 1]) || 0;
        out.push({ counts, visitors: Number(results[chunk.length + index]) || 0 });
      });
    }
    const visitors = days.length ? Number(await this.run<number>(["PFCOUNT", ...days.map((day) => `${PREFIX}stats:u:${day}`)])) || 0 : 0;
    return { days: out, visitors };
  }

  async recentHits(limit: number) {
    return (await this.run<string[] | null>(["LRANGE", `${PREFIX}stats:recent`, 0, limit - 1])) ?? [];
  }
}

/* ------------------------------------------------------------------ select */

let driver: Driver | undefined;

export function getDriver(): Driver {
  if (driver) return driver;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    driver = new RedisDriver(url, token);
  } else {
    const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const dir = process.env.JG_DATA_DIR ?? (serverless ? "/tmp/jg-data" : path.join(process.cwd(), ".data"));
    driver = new FileDriver(dir, !serverless || Boolean(process.env.JG_DATA_DIR));
  }
  return driver;
}
