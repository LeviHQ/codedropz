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

export async function createShare(input: {
  content: string;
  expirationMinutes: ExpirationMinutes;
  accessLimit: AccessLimit;
  files?: File[];
}): Promise<Share> {
  const expiresAtMs = Date.now() + input.expirationMinutes * 60_000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  // Retry on rare code collision (PK conflict)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();

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
    });
    if (!error) return { code, expiresAt: expiresAtMs };

    // rollback uploaded files on failure
    if (uploaded.length > 0) {
      await supabase.storage.from(BUCKET).remove(uploaded.map((f) => f.storagePath));
    }
    // 23505 = unique_violation → try a new code
    if ((error as { code?: string }).code !== "23505") {
      throw new Error(error.message || "Failed to create share");
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