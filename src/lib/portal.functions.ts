// Server functions behind the private SDSM portal.
// The passcode lives in a server-only env var and never ships to the browser.
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type PortalSession = { unlocked?: boolean };

// Built per call — module-scope process.env reads are undefined on the Worker.
function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "portal-gate",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

// Hash both sides so the comparison never leaks length through timing.
function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requirePortal() {
  const session = await useSession<PortalSession>(sessionConfig());
  if (!session.data.unlocked) throw new Error("Portal is locked");
  return session;
}

export const unlockPortal = createServerFn({ method: "POST" })
  .inputValidator((data: { passcode: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env["PORTAL_PASSWORD"];
    if (!expected || !passwordMatches(data.passcode, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<PortalSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const portalStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<PortalSession>(sessionConfig());
  return { unlocked: !!session.data.unlocked };
});

export const lockPortal = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PortalSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export type PortalFile = {
  path: string;
  size: number;
  type: string;
};

export type PortalShare = {
  code: string;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  accessLimit: number;
  contentLength: number;
  files: PortalFile[];
};

export type PortalShareDetail = {
  code: string;
  content: string;
  files: (PortalFile & { storagePath: string })[];
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  accessLimit: number;
};

function normalizeFiles(raw: unknown): { meta: PortalFile[]; full: (PortalFile & { storagePath: string })[] } {
  if (!Array.isArray(raw)) return { meta: [], full: [] };
  const full: (PortalFile & { storagePath: string })[] = [];
  for (const f of raw as Record<string, unknown>[]) {
    const item = {
      path: typeof f.path === "string" ? f.path : "file",
      size: typeof f.size === "number" ? f.size : 0,
      type: typeof f.type === "string" ? f.type : "application/octet-stream",
      storagePath: typeof f.storagePath === "string" ? f.storagePath : "",
    };
    full.push(item);
  }
  return { meta: full, full };
}

// Lists every share in the database (newest first). Read-only: it never
// increments access_count or consumes views — the normal /r/CODE flow does that.
export const listPortalShares = createServerFn({ method: "GET" }).handler(async (): Promise<PortalShare[]> => {
  await requirePortal();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("shares")
    .select("code, content, created_at, expires_at, access_count, access_limit, files")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message || "Failed to load shares");
  return (data ?? []).map((row) => {
    const { meta } = normalizeFiles(row.files);
    return {
      code: row.code,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: new Date(row.expires_at).getTime(),
      accessCount: row.access_count ?? 0,
      accessLimit: row.access_limit ?? 0,
      contentLength: (row.content ?? "").length,
      files: meta,
    };
  });
});

// Full detail for one share, including the text content. Still read-only.
export const getPortalShare = createServerFn({ method: "GET" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }): Promise<PortalShareDetail | null> => {
    await requirePortal();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("shares")
      .select("code, content, files, created_at, expires_at, access_count, access_limit")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message || "Failed to load share");
    if (!row) return null;
    const { full } = normalizeFiles(row.files);
    return {
      code: row.code,
      content: row.content ?? "",
      files: full,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: new Date(row.expires_at).getTime(),
      accessCount: row.access_count ?? 0,
      accessLimit: row.access_limit ?? 0,
    };
  });
