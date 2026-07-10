import { X, Check } from "lucide-react";

const OLD = ["Email", "WhatsApp", "Telegram", "GitHub Gist", "Pastebin"];
const OLD_PROBLEMS = [
  "Requires an account",
  "Too many steps",
  "Permanent history",
  "Not built for quick transfers",
];
const NEW = [
  "No login, ever",
  "One-time secure code",
  "Temporary storage",
  "Auto delete on access or expiry",
  "Instant, distraction-free sharing",
];

export function WhyCodeDrop() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          eyebrow="Why CodeDrop"
          title="Sharing code shouldn't require a login."
          subtitle="Skip the friction of chat apps, gists, and pastebins. CodeDrop is built for the moment you just need to move a snippet from one screen to another."
        />

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">The old way</div>
            <h3 className="mt-2 text-2xl font-semibold">Traditional sharing</h3>

            <div className="mt-6 flex flex-wrap gap-2">
              {OLD.map((o) => (
                <span key={o} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground line-through decoration-destructive/60">
                  <X className="size-3.5 text-destructive" />
                  {o}
                </span>
              ))}
            </div>

            <ul className="mt-6 space-y-3">
              {OLD_PROBLEMS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 grid place-items-center size-5 rounded-full bg-destructive/10 text-destructive">
                    <X className="size-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-3xl p-[1px] overflow-hidden" style={{ background: "var(--gradient-brand)" }}>
            <div className="rounded-[calc(1.5rem-1px)] bg-card p-6 md:p-8 h-full">
              <div className="text-xs uppercase tracking-widest" style={{ color: "var(--brand)" }}>
                The CodeDrop way
              </div>
              <h3 className="mt-2 text-2xl font-semibold">Just paste. Generate. Share.</h3>

              <ul className="mt-6 space-y-3">
                {NEW.map((n) => (
                  <li key={n} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid place-items-center size-5 rounded-full" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                      <Check className="size-3" />
                    </span>
                    <span className="text-foreground">{n}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Preview</span>
                  <span style={{ color: "var(--brand)" }}>Live</span>
                </div>
                <div className="mt-2 font-mono text-xl tracking-[0.3em]" style={{ color: "var(--brand)" }}>
                  AB72QK91
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow, title, subtitle, center = true,
}: { eyebrow: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium" style={{ color: "var(--brand)" }}>
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-gradient">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}