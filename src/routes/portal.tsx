import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileIcon,
  FileText,
  Lock,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wordmark } from "@/components/site/Logo";
import { cn } from "@/lib/utils";
import {
  getPortalShare,
  listPortalShares,
  lockPortal,
  portalStatus,
  unlockPortal,
  type PortalShare,
  type PortalShareDetail,
} from "@/lib/portal.functions";
import { downloadShareFile } from "@/lib/share-store";

export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Private Portal — CodeDropz" },
      { name: "description", content: "Passcode-protected portal to browse all active CodeDropz shares." },
      { property: "og:title", content: "Private Portal — CodeDropz" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PortalPage,
});

type ShareStatus = "active" | "expired" | "exhausted";

function statusOf(s: { expiresAt: number; accessCount: number; accessLimit: number }, now: number): ShareStatus {
  if (s.expiresAt <= now) return "expired";
  if (s.accessLimit > 0 && s.accessCount >= s.accessLimit) return "exhausted";
  return "active";
}

function countdownText(expiresAt: number, now: number): string {
  const ms = expiresAt - now;
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m`;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function isPdf(f: { path: string; type: string }) {
  return f.type === "application/pdf" || /\.pdf$/i.test(f.path);
}

function PortalPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    portalStatus()
      .then((r) => setUnlocked(r.unlocked))
      .catch(() => setUnlocked(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mt-4 glass rounded-2xl px-4 h-14 flex items-center justify-between">
            <Link to="/" className="shrink-0">
              <Wordmark />
            </Link>
            <div className="flex items-center gap-1.5">
              {unlocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-9 text-muted-foreground hover:text-foreground"
                  onClick={async () => {
                    await lockPortal();
                    setUnlocked(false);
                  }}
                >
                  <LogOut className="size-3.5" /> Lock
                </Button>
              )}
              <Button
                asChild
                size="sm"
                className="rounded-full h-9 px-4 bg-primary text-primary-foreground hover:opacity-90"
              >
                <Link to="/">Create a Share</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-28 pb-20">
        {unlocked === null && (
          <div className="glass rounded-3xl p-10 text-center shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">Checking portal…</p>
          </div>
        )}
        {unlocked === false && <Gate onUnlocked={() => setUnlocked(true)} />}
        {unlocked === true && <ShareExplorer now={now} />}
      </main>
    </div>
  );
}

function Gate({ onUnlocked }: { onUnlocked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const passcode = (new FormData(e.currentTarget).get("passcode") as string) ?? "";
    setBusy(true);
    setError(false);
    try {
      const r = await unlockPortal({ data: { passcode } });
      if (r.ok) onUnlocked();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-10 text-center shadow-[var(--shadow-card)]">
      <div
        className="mx-auto grid size-12 place-items-center rounded-2xl"
        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
      >
        <Lock className="size-5" />
      </div>
      <h1 className="mt-5 text-xl font-semibold">Private Portal</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Enter the access passcode to browse every share in the database and read PDFs right in the browser.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col items-center gap-3">
        <input
          name="passcode"
          type="password"
          autoComplete="current-password"
          autoFocus
          placeholder="Access passcode"
          className="h-11 w-64 rounded-xl border border-border bg-background/60 px-4 text-center font-mono tracking-[0.3em] outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as string]: "var(--brand)" }}
        />
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5" /> Wrong passcode
          </p>
        )}
        <Button type="submit" disabled={busy} className="rounded-full bg-primary text-primary-foreground hover:opacity-90">
          {busy ? "Checking…" : "Unlock Portal"}
        </Button>
      </form>
    </div>
  );
}

function ShareExplorer({ now }: { now: number }) {
  const [shares, setShares] = useState<PortalShare[] | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await listPortalShares();
      setShares(list);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load shares");
      setShares([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = shares?.find((s) => s.code === openCode) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">All Shares</h1>
          <p className="text-xs text-muted-foreground">
            {shares ? `${shares.filter((s) => statusOf(s, now) === "active").length} active of ${shares.length} total` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" style={{ color: "var(--brand)" }} />
            Read-only — views are not consumed here
          </span>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => void load()}>
            <RefreshCcw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {shares === null && (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)]">
          Loading shares…
        </div>
      )}

      {shares !== null && shares.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)]">
          No shares in the database yet.
        </div>
      )}

      {shares !== null && shares.length > 0 && (
        <div className="space-y-2">
          {shares.map((s) => {
            const st = statusOf(s, now);
            return (
              <button
                key={s.code}
                onClick={() => setOpenCode(s.code)}
                className="glass w-full rounded-2xl px-5 py-4 text-left shadow-[var(--shadow-card)] transition-transform hover:scale-[1.005] focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: "var(--brand)" }}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-mono text-sm font-semibold tracking-[0.2em]" style={{ color: "var(--brand)" }}>
                    {s.code}
                  </span>
                  <StatusBadge status={st} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {st === "expired" ? "Expired" : `Expires in ${useCountdownSafe(s.expiresAt, now)}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Views {s.accessCount}/{s.accessLimit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.files.length > 0 ? `${s.files.length} file(s)` : "Text only"}
                    {s.contentLength > 0 ? " + text" : ""}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && <ShareDetail code={open.code} now={now} onClose={() => setOpenCode(null)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: ShareStatus }) {
  const cfg =
    status === "active"
      ? { cls: "bg-green-500/10 text-green-600 dark:text-green-400", label: "Active" }
      : status === "expired"
        ? { cls: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", label: "Expired" }
        : { cls: "bg-destructive/10 text-destructive", label: "Limit reached" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function ShareDetail({ code, now, onClose }: { code: string; now: number; onClose: () => void }) {
  const [detail, setDetail] = useState<PortalShareDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [viewer, setViewer] = useState<{ name: string; url: string } | null>(null);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [zipping, setZipping] = useState(false);
  const viewerUrl = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await getPortalShare({ data: { code } });
        setDetail(d);
      } catch {
        setFailed(true);
      }
    })();
  }, [code]);

  // Revoke the PDF blob URL when the viewer closes or the page unmounts.
  useEffect(() => {
    return () => {
      if (viewerUrl.current) URL.revokeObjectURL(viewerUrl.current);
    };
  }, []);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadOne = async (f: PortalShareDetail["files"][number], i: number) => {
    setBusyIdx(i);
    try {
      const blob = await downloadShareFile(f.storagePath);
      saveBlob(blob, f.path.split("/").pop() || "file");
    } catch (e) {
      toast.error((e as Error).message || "Download failed");
    } finally {
      setBusyIdx(null);
    }
  };

  const openPdf = async (f: PortalShareDetail["files"][number]) => {
    try {
      const blob = await downloadShareFile(f.storagePath);
      if (viewerUrl.current) URL.revokeObjectURL(viewerUrl.current);
      viewerUrl.current = URL.createObjectURL(blob);
      setViewer({ name: f.path, url: viewerUrl.current });
    } catch (e) {
      toast.error((e as Error).message || "Could not open file");
    }
  };

  const downloadZip = async () => {
    if (!detail) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      if (detail.content) zip.file("snippet.txt", detail.content);
      for (const f of detail.files) {
        zip.file(f.path, await downloadShareFile(f.storagePath));
      }
      saveBlob(await zip.generateAsync({ type: "blob" }), `${detail.code}.zip`);
    } catch (e) {
      toast.error((e as Error).message || "Zip failed");
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tracking-[0.2em]" style={{ color: "var(--brand)" }}>
              {code}
            </span>
            {detail && <StatusBadge status={statusOf(detail, now)} />}
            {detail && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Views {detail.accessCount}/{detail.accessLimit} · Expires in {useCountdownSafe(detail.expiresAt, now)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {detail && detail.files.length > 0 && (
              <Button variant="secondary" size="sm" className="rounded-lg" onClick={downloadZip} disabled={zipping}>
                <Archive className="size-3.5" /> {zipping ? "Zipping…" : "Download all (.zip)"}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-background/50">
          {failed && <p className="p-8 text-center text-sm text-destructive">Could not load this share.</p>}
          {!failed && !detail && <p className="p-8 text-center text-sm text-muted-foreground">Loading share…</p>}

          {detail && detail.content.length > 0 && (
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <FileText className="size-3.5" /> Text content
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    navigator.clipboard.writeText(detail.content);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy className="size-3.5" /> Copy text
                </Button>
              </div>
              <pre className="max-h-56 overflow-auto p-4 pt-1 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
                {detail.content}
              </pre>
            </div>
          )}

          {detail && detail.files.length > 0 && (
            <div className="p-4 space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 pb-1">Attached files</div>
              {detail.files.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2"
                >
                  <FileIcon className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono truncate">{f.path}</div>
                    <div className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</div>
                  </div>
                  {isPdf(f) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg shrink-0"
                      onClick={() => void openPdf(f)}
                    >
                      <BookOpen className="size-3.5" /> Read
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-lg shrink-0"
                    onClick={() => void downloadOne(f, i)}
                    disabled={busyIdx === i}
                  >
                    <Download className="size-3.5" /> {busyIdx === i ? "…" : "Download"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setViewer(null)} />
          <div className="relative z-10 flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{viewer.name}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8"
                  onClick={() => window.open(viewer.url, "_blank", "noopener")}
                >
                  <ExternalLink className="size-3.5" /> Open in tab
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setViewer(null)} aria-label="Close reader">
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <iframe title={viewer.name} src={viewer.url} className="min-h-0 flex-1 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
