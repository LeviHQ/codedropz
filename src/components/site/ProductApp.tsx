import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Link2, Sparkles, ArrowRight, Download, RefreshCcw, AlertTriangle, Clock, ShieldCheck, Upload, FolderUp, X, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createShare,
  retrieveShare,
  type RetrieveResult,
} from "@/lib/share-store";
import { cn } from "@/lib/utils";

const ACCESS_OPTIONS = [
  { value: 1, label: "First Access" },
  { value: 5, label: "5 Accesses" },
  { value: 10, label: "10 Accesses" },
] as const;

const EXPIRY_OPTIONS = [
  { value: 10, label: "10 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 60, label: "1 Hour" },
] as const;

export function ProductApp() {
  return (
    <section id="product" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium" style={{ color: "var(--brand)" }}>
            The Product
          </div>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-gradient">
            Paste. Generate. Share.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Two clean flows. No accounts, no setup — just a code you can hand off.
          </p>
        </div>

        <div className="mt-10 relative">
          <div className="absolute -inset-8 rounded-[40px] opacity-40 blur-3xl pointer-events-none" style={{ background: "var(--gradient-brand)" }} />
          <div className="relative glass rounded-3xl p-3 md:p-4 shadow-[var(--shadow-card)]">
            <Tabs defaultValue="send" className="w-full">
              <TabsList className="mx-auto mb-4 grid w-full max-w-sm grid-cols-2 rounded-full bg-secondary p-1 h-11">
                <TabsTrigger value="send" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Send
                </TabsTrigger>
                <TabsTrigger value="receive" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Receive
                </TabsTrigger>
              </TabsList>
              <TabsContent value="send"><SendPanel /></TabsContent>
              <TabsContent value="receive"><ReceivePanel /></TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}

function SendPanel() {
  const [content, setContent] = useState("");
  const [access, setAccess] = useState<number>(1);
  const [expiry, setExpiry] = useState<number>(10);
  const [accessCustom, setAccessCustom] = useState<number>(20);
  const [expiryCustom, setExpiryCustom] = useState<number>(120);
  const [accessCustomActive, setAccessCustomActive] = useState(false);
  const [expiryCustomActive, setExpiryCustomActive] = useState(false);
  const [generated, setGenerated] = useState<{ code: string; expiresAt: number } | null>(null);
  const [remaining, setRemaining] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!generated) return;
    const tick = () => {
      const ms = generated.expiresAt - Date.now();
      if (ms <= 0) { setRemaining("Expired"); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [generated]);

  const finalAccess = accessCustomActive ? accessCustom : access;
  const finalExpiry = expiryCustomActive ? expiryCustom : expiry;

  const handleGenerate = async () => {
    if (!content.trim()) { toast.error("Paste some code or text first."); return; }
    setSubmitting(true);
    try {
      const s = await createShare({ content, expirationMinutes: finalExpiry, accessLimit: finalAccess });
      setGenerated({ code: s.code, expiresAt: s.expiresAt });
      toast.success("Share code generated");
    } catch (e) {
      toast.error((e as Error).message || "Failed to generate code");
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = generated
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?code=${generated.code}`
    : "";

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-yellow-500/70" />
            <span className="size-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">snippet.txt</span>
          <span className="text-[11px] text-muted-foreground">{content.length} chars</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your code here..."
          spellCheck={false}
          className="w-full min-h-[320px] resize-none bg-transparent px-5 py-4 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Delete after</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ACCESS_OPTIONS.map((a) => (
              <SegBtn key={a.value} active={!accessCustomActive && access === a.value} onClick={() => { setAccess(a.value); setAccessCustomActive(false); }}>
                {a.label}
              </SegBtn>
            ))}
            <SegBtn active={accessCustomActive} onClick={() => setAccessCustomActive(true)}>
              Custom
            </SegBtn>
          </div>
          {accessCustomActive && (
            <div className="mt-2">
              <Input
                type="number"
                min={1}
                max={999}
                value={accessCustom}
                onChange={(e) => setAccessCustom(Math.max(1, Math.min(999, Number(e.target.value))))}
                className="h-10 rounded-xl font-mono text-center"
                placeholder="Access count"
              />
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Expiration</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {EXPIRY_OPTIONS.map((a) => (
              <SegBtn key={a.value} active={!expiryCustomActive && expiry === a.value} onClick={() => { setExpiry(a.value); setExpiryCustomActive(false); }}>
                {a.label}
              </SegBtn>
            ))}
            <SegBtn active={expiryCustomActive} onClick={() => setExpiryCustomActive(true)}>
              Custom
            </SegBtn>
          </div>
          {expiryCustomActive && (
            <div className="mt-2">
              <Input
                type="number"
                min={1}
                max={999}
                value={expiryCustom}
                onChange={(e) => setExpiryCustom(Math.max(1, Math.min(999, Number(e.target.value))))}
                className="h-10 rounded-xl font-mono text-center"
                placeholder="Minutes"
              />
            </div>
          )}
        </div>

        {!generated ? (
          <Button
            onClick={handleGenerate}
            disabled={submitting}
            size="lg"
            className="mt-6 rounded-xl h-12 bg-primary text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]"
          >
            <Sparkles className="size-4" />
            {submitting ? "Generating..." : "Generate Share Code"}
          </Button>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your share code</div>
            <div className="mt-1 font-mono text-3xl md:text-4xl font-semibold tracking-[0.28em]" style={{ color: "var(--brand)" }}>
              {generated.code}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Expires in <span className="font-mono text-foreground">{remaining}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="rounded-lg"
                onClick={() => { navigator.clipboard.writeText(generated.code); toast.success("Code copied"); }}
              >
                <Copy className="size-4" /> Copy Code
              </Button>
              <Button
                variant="secondary"
                className="rounded-lg"
                onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Share link copied"); }}
              >
                <Link2 className="size-4" /> Copy Link
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full text-muted-foreground"
              onClick={() => { setGenerated(null); setContent(""); }}
            >
              <RefreshCcw className="size-3.5" /> New share
            </Button>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5" style={{ color: "var(--brand)" }} />
          Temporary. Auto-deletes on last access or expiry.
        </div>
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
        active
          ? "border-transparent text-primary-foreground shadow-sm"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
      style={active ? { background: "var(--brand)" } : undefined}
    >
      {children}
    </button>
  );
}

function ReceivePanel() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RetrieveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) setCode(c.toUpperCase());
  }, []);

  const handle = async () => {
    if (!code.trim()) { toast.error("Enter a code first"); inputRef.current?.focus(); return; }
    setLoading(true);
    try {
      const r = await retrieveShare(code);
      setResult(r);
      if (!r.ok) toast.error(errorText(r.reason));
      else toast.success("Snippet received");
    } catch (e) {
      toast.error((e as Error).message || "Failed to receive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Enter share code</div>
        <div className="mt-3 flex flex-col gap-3">
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            placeholder="e.g. AB72QK"
            className="h-14 rounded-xl font-mono text-xl tracking-[0.3em] text-center"
          />
          <Button size="lg" onClick={handle} disabled={loading} className="rounded-xl h-12 bg-primary text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
            {loading ? "Receiving..." : "Receive"} <ArrowRight className="size-4" />
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Codes are 6 characters, uppercase. Case-insensitive.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden min-h-[320px] flex flex-col">
        {!result && <EmptyReceived />}
        {result && !result.ok && <ErrorReceived reason={result.reason} onRetry={() => setResult(null)} />}
        {result && result.ok && <ReceivedView content={result.content} remaining={result.remaining} />}
      </div>
    </div>
  );
}

function EmptyReceived() {
  return (
    <div className="flex-1 grid place-items-center p-10 text-center">
      <div>
        <div className="mx-auto grid place-items-center size-12 rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
          <ArrowRight className="size-5" />
        </div>
        <h4 className="mt-4 text-lg font-medium">Ready to receive</h4>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Enter the 6-character code from the sender to instantly view the shared snippet.
        </p>
      </div>
    </div>
  );
}

function ErrorReceived({ reason, onRetry }: { reason: "not_found" | "expired" | "exhausted"; onRetry: () => void }) {
  return (
    <div className="flex-1 grid place-items-center p-10 text-center">
      <div>
        <div className="mx-auto grid place-items-center size-12 rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h4 className="mt-4 text-lg font-medium">{titleFor(reason)}</h4>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{errorText(reason)}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-full">
          Try another code
        </Button>
      </div>
    </div>
  );
}

function titleFor(r: "not_found" | "expired" | "exhausted") {
  return r === "not_found" ? "Code not found" : r === "expired" ? "Code expired" : "Access limit reached";
}
function errorText(r: "not_found" | "expired" | "exhausted") {
  return r === "not_found"
    ? "That code doesn't match any active share."
    : r === "expired"
    ? "This share has expired and was auto-deleted."
    : "This share reached its maximum number of accesses.";
}

function ReceivedView({ content, remaining }: { content: string; remaining: number }) {
  const lines = useMemo(() => content.split("\n"), [content]);
  const download = (filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-yellow-500/70" />
          <span className="size-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">received.txt</span>
        <span className="text-[11px]" style={{ color: "var(--brand)" }}>
          {remaining === 0 ? "final view — deleted" : `${remaining} views left`}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-4">
              <span className="select-none text-muted-foreground/50 w-6 text-right">{i + 1}</span>
              <span className="whitespace-pre-wrap break-all">{l || " "}</span>
            </div>
          ))}
        </pre>
      </div>
      <div className="border-t border-border p-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-lg"
          onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied to clipboard"); }}
        >
          <Copy className="size-4" /> Copy
        </Button>
        <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => download("snippet.txt")}>
          <Download className="size-4" /> Download TXT
        </Button>
        <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => download("snippet.code.txt")}>
          <Download className="size-4" /> Download Code
        </Button>
      </div>
    </>
  );
}
