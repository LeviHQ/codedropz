import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { admin?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "codedropz-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  if (!session.data.admin) throw new Error("Unauthorized");
  return session;
}

export type AdminShareRow = {
  code: string;
  content: string;
  expires_at: string;
  access_limit: number;
  access_count: number;
  created_at: string;
  file_count: number;
};

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { unlocked: session.data.admin === true };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({
    password: String(data?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("ADMIN_PASSWORD is not configured");
    if (!data.password || !matches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminListShares = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("shares")
    .select("code, content, expires_at, access_limit, access_count, created_at, files")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows: AdminShareRow[] = (data ?? []).map((r) => ({
    code: r.code,
    content: r.content ?? "",
    expires_at: r.expires_at,
    access_limit: r.access_limit,
    access_count: r.access_count,
    created_at: r.created_at,
    file_count: Array.isArray(r.files) ? r.files.length : 0,
  }));
  return { rows };
});

export const adminUpdateShare = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      code: string;
      content: string;
      expires_at: string;
      access_limit: number;
      access_count: number;
    }) => {
      const code = String(data?.code ?? "").trim().toUpperCase();
      if (!code) throw new Error("Missing share code");
      const expires = new Date(data.expires_at);
      if (Number.isNaN(expires.getTime())) throw new Error("Invalid expiry date");
      const limit = Number(data.access_limit);
      const count = Number(data.access_count);
      if (!Number.isFinite(limit) || limit < 1 || limit > 9999)
        throw new Error("Access limit must be between 1 and 9999");
      if (!Number.isFinite(count) || count < 0 || count > 9999)
        throw new Error("Access count must be between 0 and 9999");
      const content = String(data?.content ?? "");
      if (content.length > 200000) throw new Error("Content too large");
      return {
        code,
        content,
        expires_at: expires.toISOString(),
        access_limit: Math.floor(limit),
        access_count: Math.floor(count),
      };
    },
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("shares")
      .update({
        content: data.content,
        expires_at: data.expires_at,
        access_limit: data.access_limit,
        access_count: data.access_count,
      })
      .eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteShare = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => ({
    code: String(data?.code ?? "").trim().toUpperCase(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!data.code) throw new Error("Missing share code");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: files } = await supabaseAdmin.storage
      .from("share-files")
      .list(data.code, { limit: 200 });
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from("share-files")
        .remove(files.filter((f) => f.id).map((f) => `${data.code}/${f.name}`));
    }
    const { error } = await supabaseAdmin.from("shares").delete().eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
