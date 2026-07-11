// Real backend-backed share store using Lovable Cloud.
import { supabase } from "@/integrations/supabase/client";

export type ExpirationMinutes = number;
export type AccessLimit = number;

export type Share = {
  code: string;
  expiresAt: number;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(len = 6): string {
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
}

export async function createShare(input: {
  content: string;
  expirationMinutes: ExpirationMinutes;
  accessLimit: AccessLimit;
}): Promise<Share> {
  const expiresAtMs = Date.now() + input.expirationMinutes * 60_000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  // Retry on rare code collision (PK conflict)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("shares").insert({
      code,
      content: input.content,
      expires_at: expiresAtIso,
      access_limit: input.accessLimit,
    });
    if (!error) return { code, expiresAt: expiresAtMs };
    // 23505 = unique_violation → try a new code
    if ((error as { code?: string }).code !== "23505") {
      throw new Error(error.message || "Failed to create share");
    }
  }
  throw new Error("Could not generate a unique code, please try again.");
}

export type RetrieveResult =
  | { ok: true; content: string; remaining: number; expiresAt: number }
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
    remaining: row.remaining ?? 0,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : Date.now(),
  };
}