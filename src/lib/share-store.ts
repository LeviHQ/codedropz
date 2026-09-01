// Real backend-backed share store using Lovable Cloud.
import { supabase } from "@/integrations/supabase/client";

export type ExpirationMinutes = number;
export type AccessLimit = number;

export type ShareFile = {
  path: string;      // relative path (may include folder)
  storagePath: string; // path in bucket
  size: number;
  type: string;
};

export type Share = {
  code: string;
  expiresAt: number;
  senderToken: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BUCKET = "share-files";

export function generateCode(len = 6): string {
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
}

function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function sanitizePath(p: string): string {
  return p.replace(/^\/+/, "").replace(/\.\.+/g, "_");
}

async function uploadFiles(code: string, files: File[]): Promise<ShareFile[]> {
  const out: ShareFile[] = [];
  for (const f of files) {
    const rel = sanitizePath((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name);
    const storagePath = `${code}/${rel}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, f, {
      cacheControl: "3600",
      upsert: false,
      contentType: f.type || "application/octet-stream",
    });
    if (error) throw new Error(`Upload failed for ${rel}: ${error.message}`);
    out.push({ path: rel, storagePath, size: f.size, type: f.type || "application/octet-stream" });
  }
  return out;
}

/** Allowed shape for user-chosen codes. */
export const CUSTOM_CODE_RE = /^[A-Z0-9]{4,12}$/;

export function normalizeCustomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function createShare(input: {
  content: string;
  expirationMinutes: ExpirationMinutes;
  accessLimit: AccessLimit;
  files?: File[];
  /** Optional user-chosen code. When omitted a random code is generated. */
  customCode?: string;
}): Promise<Share> {
  const expiresAtMs = Date.now() + input.expirationMinutes * 60_000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const senderToken = generateToken();

  const custom = input.customCode ? normalizeCustomCode(input.customCode) : "";
  if (input.customCode && !CUSTOM_CODE_RE.test(custom)) {
    throw new Error("Custom code must be 4–12 letters or numbers.");
  }

  const attempts = custom ? 1 : 5;
  // Retry on rare code collision (PK conflict)
  for (let attempt = 0; attempt < attempts; attempt++) {
    const code = custom || generateCode();

    let uploaded: ShareFile[] = [];
    if (input.files && input.files.length > 0) {
      uploaded = await uploadFiles(code, input.files);
    }

    const { error } = await supabase.from("shares").insert({
      code,
      content: input.content,
      expires_at: expiresAtIso,
      access_limit: input.accessLimit,
      files: uploaded as unknown as never,
      sender_token: senderToken,
    });
    if (!error) return { code, expiresAt: expiresAtMs, senderToken };

    // rollback uploaded files on failure
    if (uploaded.length > 0) {
      await supabase.storage.from(BUCKET).remove(uploaded.map((f) => f.storagePath));
    }
    // 23505 = unique_violation → try a new code
    if ((error as { code?: string }).code !== "23505") {
      throw new Error(error.message || "Failed to create share");
    }
    if (custom) {
      throw new Error(`Code "${custom}" is already in use. Try another one.`);
    }
  }
  throw new Error("Could not generate a unique code, please try again.");
}

export type RetrieveResult =
  | { ok: true; content: string; files: ShareFile[]; remaining: number; expiresAt: number }
  | { ok: false; reason: "not_found" | "expired" | "exhausted" };

export async function retrieveShare(rawCode: string): Promise<RetrieveResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "not_found" };
  const { data, error } = await supabase.rpc("retrieve_share", { _code: code });
  if (error) throw new Error(error.message || "Failed to retrieve share");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, reason: "not_found" };
  if (!row.ok) {
    const reason = (row.reason ?? "not_found") as "not_found" | "expired" | "exhausted";
    return { ok: false, reason };
  }
  return {
    ok: true,
    content: row.content ?? "",
    files: (row.files ?? []) as ShareFile[],
    remaining: row.remaining ?? 0,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : Date.now(),
  };
}

export async function downloadShareFile(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error(error?.message || "Download failed");
  return data;
}

/** Absolute URL that opens a share directly (e.g. https://codedropz.vercel.app/r/AB72QK). */
export function shareUrl(code: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://codedropz.vercel.app";
  return `${origin}/r/${code}`;
}

/** Recursively lists every stored object under a folder prefix. */
async function listStoragePaths(prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 200 });
  if (error || !data) return [];
  const paths: string[] = [];
  for (const item of data) {
    if (item.id) {
      paths.push(`${prefix}/${item.name}`);
    } else {
      paths.push(...(await listStoragePaths(`${prefix}/${item.name}`)));
    }
  }
  return paths;
}

/**
 * Deletes a share (content + uploaded files) before it expires.
 * Only the sender — who holds the private token — can cancel a share.
 */
export async function cancelShare(code: string, token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("delete_share", { _code: code, _token: token });
  if (error) throw new Error(error.message || "Failed to cancel share");
  const deleted = data === true;
  if (deleted) {
    // Best-effort cleanup of uploaded files (safe: row is already gone).
    try {
      const paths = await listStoragePaths(code);
      if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    } catch {
      // Orphaned files are unreachable once the row is deleted.
    }
  }
  return deleted;
}