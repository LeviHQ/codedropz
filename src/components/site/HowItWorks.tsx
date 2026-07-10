import { Clipboard, Sparkles, Send, KeyRound, Download, Trash2 } from "lucide-react";
import { SectionHeader } from "./WhyCodeDrop";

const STEPS = [
  { icon: Clipboard, title: "Paste your code", desc: "Drop any snippet or text into the editor." },
  { icon: Sparkles, title: "Generate a code", desc: "Get a secure 8-character share code instantly." },
  { icon: Send, title: "Share it", desc: "Hand the code (or link) to the receiver." },
  { icon: KeyRound, title: "Receiver enters code", desc: "They paste the code on their device." },
  { icon: Download, title: "Snippet appears", desc: "Retrieved instantly on their screen." },
  { icon: Trash2, title: "Auto delete", desc: "Snippet vanishes after last access or expiry." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          eyebrow="How it works"
          title="Six steps. Under a minute."
          subtitle="From paste to auto-delete — the entire lifecycle of a CodeDrop."
        />
        <div className="mt-14 relative">
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px"
            style={{ background: "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--brand) 60%, transparent), transparent)" }}
          />
          <ol className="space-y-6 md:space-y-10">
            {STEPS.map((s, i) => {
              const left = i % 2 === 0;
              return (
                <li key={s.title} className="md:grid md:grid-cols-2 md:gap-10 items-center relative">
                  <div className={left ? "md:pr-10 md:text-right" : "md:col-start-2 md:pl-10"}>
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className={`flex items-center gap-3 ${left ? "md:justify-end" : ""}`}>
                        <div className="grid place-items-center size-9 rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                          <s.icon className="size-4" />
                        </div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                          Step {i + 1}
                        </div>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 size-3 rounded-full" style={{ background: "var(--brand)" }} />
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}