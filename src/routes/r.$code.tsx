import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Clock,
  Copy,
  Download,
  FileIcon,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { retrieveShare, downloadShareFile, type ShareFile } from "@/lib/share-store";
import { Wordmark } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/r/$code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shared Snippet — CodeDropz" },
      {
        name: "description",
        content: "A temporary, self-destructing share from CodeDropz. Opens once and auto-deletes.",
      },
      { property: "og:title", content: "Shared Snippet — CodeDropz" },
      {
        property: "og:description",
        content: "A temporary, self-destructing share from CodeDropz.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SharePage,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; reason: "not_found" | "expired" | "exhausted" | "failed" }
  | {
      status: "ready";
      content: string;
      files: ShareFile[];
      remaining: number;
      expiresAt: number;
    };

function SharePage() {
  const { code } = Route.useParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    (async () => {
      try {
        const r = await retrieveShare(code);
        if (!r.ok) {
          setState({ status: "error", reason: r.reason });
        } else {
          setState({
            status: "ready",
            content: r.content,
            files: r.files,
            remaining: r.remaining,
            expiresAt: r.expiresAt,
          });
        }
      } catch {
        setState({ status: "error", reason: "failed" });
      }
    })();
  }, [code, attempt]);


  const retry = () => {
    fetched.current = false;
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-3xl px-4">
          <nav className="mt-4 glass rounded-2xl px-4 h-14 flex items-center justify-between">
            <Link to="/" className="shrink-0">
              <Wordmark />
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-full h-9 px-4 bg-primary text-primary-foreground hover:opacity-90"
            >
              <Link to="/">Create a Share</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-28 pb-20">
        {state.status === "loading" && <LoadingCard code={code} />}
        {state.status === "error" && <ErrorCard reason={state.reason} onRetry={retry} />}
        {state.status === "ready" && (
          <ReadyCard
            code={code}
            content={state.content}
            files={state.files}
            remaining={state.remaining}
            expiresAt={state.expiresAt}
          />
        )}
      </main>
    </div>
  );
}

function LoadingCard({ code }: { code: string }) {
  return (
    <div className="glass rounded-3xl p-10 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl animate-pulse" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
        <span className="font-mono text-sm font-semibold">{code.slice(0, 3)}</span>
      </div>
      <h1 className="mt-5 text-xl font-semibold">Opening your share…</h1>
      <p className="mt-2 text-sm text-muted-foreground">Fetching the snippet — this takes a second.</p>
    </div>
  );
}

function ErrorCard({
  reason,
  onRetry,
}: {
  reason: "not_found" | "expired" | "exhausted" | "failed";
  onRetry: () => void;
}) {
  const title =
    reason === "not_found"
      ? "Code not found"
      : reason === "expired"
        ? "This share has expired"
        : reason === "exhausted"
          ? "Access limit reached"
          : "Something went wrong";
  const text =
    reason === "not_found"
      ? "That code doesn't match any active share. It may have been deleted by the sender."
      : reason === "expired"
        ? "This share expired and was auto-deleted. Ask the sender for a new one."
        : reason === "exhausted"
          ? "This share reached its maximum number of views and was deleted."
          : "We couldn't open this share. Check your connection and try again.";
  return (
    <div className="glass rounded-3xl p-10 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h1 className="mt-5 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {reason === "failed" && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
            <RefreshCcw className="size-3.5" /> Try again
          </Button>
        )}
        <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:opacity-90">
          <Link to="/">Create your own share</Link>
        </Button>
      </div>
    </div>
  );
}

function useCountdown(expiresAt: number): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = expiresAt - now;
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ReadyCard({
  code,
  content,
  files,
  remaining,
  expiresAt,
}: {
  code: string;
  content: string;
  files: ShareFile[];
  remaining: number;
  expiresAt: number;
}) {
  const hasText = content.length > 0;
  const hasFiles = files.length > 0;
  const lines = useMemo(() => (hasText ? content.split("\n") : []), [content, hasText]);
  const [zipping, setZipping] = useState(false);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const countdown = useCountdown(expiresAt);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadOne = async (f: ShareFile, i: number) => {
    setBusyIdx(i);
    try {
      const blob = await downloadShareFile(f.storagePath);
      const name = f.path.split("/").pop() || "file";
      saveBlob(blob, name);
    } catch (e) {
      toast.error((e as Error).message || "Download failed");
    } finally {
      setBusyIdx(null);
    }
  };

  const downloadAllZip = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      if (hasText) zip.file("snippet.txt", content);
      for (const f of files) {
        const blob = await downloadShareFile(f.storagePath);
        zip.file(f.path, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      saveBlob(out, "codedropz.zip");
    } catch (e) {
      toast.error((e as Error).message || "Zip failed");
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-yellow-500/70" />
          <span className="size-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-xs tracking-[0.2em]" style={{ color: "var(--brand)" }}>
          {code}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {remaining === 0 ? "final view — deleted" : `${remaining} view(s) left`}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          Expires in <span className="font-mono text-foreground">{countdown}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" style={{ color: "var(--brand)" }} />
          Auto-deletes after last access
        </span>
</div>

      <div className="flex flex-wrap gap-2 border-b border-border bg-secondary/20 px-5 py-3">
        {hasText && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="size-4" /> Copy text
          </Button>
        )}
        {hasText && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-lg"
            onClick={() => saveBlob(new Blob([content], { type: "text/plain" }), "snippet.txt")}
          >
            <Download className="size-4" /> Download TXT
          </Button>
        )}
        {(hasFiles || hasText) && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-lg"
            onClick={downloadAllZip}
            disabled={zipping}
          >
            <Archive className="size-4" />
            {zipping ? "Zipping..." : hasFiles && files.length > 1 ? "Download all (.zip)" : "Download as .zip"}
          </Button>
        )}
      </div>

      <div className="max-h-[55vh] overflow-auto bg-background/50">
        {hasText && (
          <pre className="p-5 text-sm font-mono leading-relaxed">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-4">
                <span className="select-none text-muted-foreground/50 w-6 text-right">{i + 1}</span>
                <span className="whitespace-pre-wrap break-all">{l || " "}</span>
              </div>
            ))}
          </pre>
        )}
        {hasFiles && (
          <div className={cn("p-4 space-y-1.5", hasText && "border-t border-border")}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 pb-1">
              Attached files
            </div>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
                <FileIcon className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono truncate">{f.path}</div>
                  <div className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg shrink-0"
                  onClick={() => downloadOne(f, i)}
                  disabled={busyIdx === i}
                >
                  <Download className="size-3.5" />
                  {busyIdx === i ? "..." : "Download"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

</div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}