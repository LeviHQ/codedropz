// Mock in-memory + localStorage share store. Interface designed so a
// real backend can swap in without changing callers.

export type ExpirationMinutes = number;
export type AccessLimit = number;

export type Share = {
  code: string;
  content: string;
  createdAt: number;
  expiresAt: number;
  accessLimit: AccessLimit;
  accessCount: number;
};

const KEY = "cd:shares";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function readAll(): Record<string, Share> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function writeAll(all: Record<string, Share>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function generateCode(len = 6): string {
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
}

export function createShare(input: {
  content: string;
  expirationMinutes: ExpirationMinutes;
  accessLimit: AccessLimit;
}): Share {
  const all = readAll();
  pruneExpired(all);
  let code = generateCode();
  while (all[code]) code = generateCode();
  const now = Date.now();
  const share: Share = {
    code,
    content: input.content,
    createdAt: now,
    expiresAt: now + input.expirationMinutes * 60_000,
    accessLimit: input.accessLimit,
    accessCount: 0,
  };
  all[code] = share;
  writeAll(all);
  return share;
}

export type RetrieveResult =
  | { ok: true; content: string; remaining: number; expiresAt: number }
  | { ok: false; reason: "not_found" | "expired" | "exhausted" };

export function retrieveShare(rawCode: string): RetrieveResult {
  const code = rawCode.trim().toUpperCase();
  const all = readAll();
  pruneExpired(all);
  const s = all[code];
  if (!s) return { ok: false, reason: "not_found" };
  if (Date.now() > s.expiresAt) {
    delete all[code];
    writeAll(all);
    return { ok: false, reason: "expired" };
  }
  if (s.accessCount >= s.accessLimit) {
    return { ok: false, reason: "exhausted" };
  }
  s.accessCount += 1;
  const remaining = s.accessLimit - s.accessCount;
  const content = s.content;
  if (remaining <= 0) delete all[code];
  else all[code] = s;
  writeAll(all);
  return { ok: true, content, remaining, expiresAt: s.expiresAt };
}

function pruneExpired(all: Record<string, Share>) {
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(all)) {
    if (all[k].expiresAt < now) {
      delete all[k];
      changed = true;
    }
  }
  if (changed) writeAll(all);
}