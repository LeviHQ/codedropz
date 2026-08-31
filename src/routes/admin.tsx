import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, LogOut, RefreshCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wordmark } from "@/components/site/Logo";
import {
  adminDeleteShare,
  adminUpdateShare,
  adminListShares,
  adminLogin,
  adminLogout,
  adminStatus,
  type AdminShareRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Console — CodeDropz" },
      {
        name: "description",
        content: "Password-protected CodeDropz admin console for viewing and editing active shares.",
      },
      { property: "og:title", content: "Admin Console — CodeDropz" },
      {
        property: "og:description",
        content: "Manage active CodeDropz shares: edit content, expiry, access limits, or delete.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminPage() {
  const status = useServerFn(adminStatus);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const list = useServerFn(adminListShares);

  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<AdminShareRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const load = useCallback(async () => {
    setLoadingRows(true);
    try {
      const res = await list();
      setRows(res.rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load shares");
    } finally {
      setLoadingRows(false);
    }
  }, [list]);

  useEffect(() => {
    (async () => {
      try {
        const res = await status();
        setUnlocked(res.unlocked);
        if (res.unlocked) await load();
      } finally {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await login({ data: { password } });
      if (!res.ok) {
        toast.error("Incorrect password");
        return;
      }
      setPassword("");
      setUnlocked(true);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await logout();
    setUnlocked(false);
    setRows([]);
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            {unlocked && (
              <>
                <Button variant="ghost" size="sm" onClick={load} disabled={loadingRows}>
                  <RefreshCcw className={loadingRows ? "size-4 animate-spin" : "size-4"} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="size-4" />
                  Lock
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {!unlocked ? (
          <div className="mx-auto max-w-sm glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="size-4 text-primary" />
              <h1 className="text-lg font-semibold">Admin access</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the admin password to manage shares.
            </p>
            <form onSubmit={onLogin} className="space-y-3">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" className="w-full rounded-lg" disabled={busy || !password}>
                {busy ? "Checking..." : "Unlock"}
              </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Shares database</h1>
                <p className="text-sm text-muted-foreground">
                  {rows.length} active {rows.length === 1 ? "row" : "rows"} in the shares table.
                </p>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                No shares right now. Create one from the product panel and refresh.
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => (
                  <ShareRowEditor key={row.code} row={row} onChanged={load} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ShareRowEditor({ row, onChanged }: { row: AdminShareRow; onChanged: () => void }) {
  const update = useServerFn(adminUpdateShare);
  const del = useServerFn(adminDeleteShare);
  const [content, setContent] = useState(row.content);
  const [expiresAt, setExpiresAt] = useState(toLocalInput(row.expires_at));
  const [limit, setLimit] = useState(String(row.access_limit));
  const [count, setCount] = useState(String(row.access_count));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await update({
        data: {
          code: row.code,
          content,
          expires_at: new Date(expiresAt).toISOString(),
          access_limit: Number(limit),
          access_count: Number(count),
        },
      });
      toast.success(`Saved ${row.code}`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete share ${row.code}? This also removes its files.`)) return;
    setDeleting(true);
    try {
      await del({ data: { code: row.code } });
      toast.success(`Deleted ${row.code}`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg tracking-widest text-primary">{row.code}</span>
          <span className="text-xs text-muted-foreground">
            created {new Date(row.created_at).toLocaleString()} · {row.file_count} file(s)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="rounded-lg">
            <Save className="size-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={remove}
            disabled={deleting}
            className="rounded-lg"
          >
            <Trash2 className="size-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-3">
        <label className="text-xs text-muted-foreground">
          Expires at
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 w-full rounded-lg bg-secondary border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Access limit
          <input
            type="number"
            min={1}
            max={9999}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="mt-1 w-full rounded-lg bg-secondary border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Access count
          <input
            type="number"
            min={0}
            max={9999}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="mt-1 w-full rounded-lg bg-secondary border border-border px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <label className="text-xs text-muted-foreground">
        Content
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
    </div>
  );
}
