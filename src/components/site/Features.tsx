import { LogOut, ShieldCheck, Trash2, Zap, KeyRound, Smartphone, Palette, Code2 } from "lucide-react";
import { SectionHeader } from "./WhyCodeDrop";

const FEATURES = [
  { icon: LogOut, title: "No Login", desc: "Nothing to sign up for. Open and share in seconds." },
  { icon: ShieldCheck, title: "Secure Temporary Storage", desc: "Snippets live only as long as they need to." },
  { icon: Trash2, title: "Auto Delete", desc: "Content vanishes after access or expiry — no history." },
  { icon: Zap, title: "Fast Sharing", desc: "Sub-second generate and retrieve, on any device." },
  { icon: KeyRound, title: "One-Time Access", desc: "Limit views to 1, 5 or 10 accesses." },
  { icon: Smartphone, title: "Responsive", desc: "Optimized for mobile, tablet and desktop." },
  { icon: Palette, title: "Theme Support", desc: "Dark, light, and seven accent colors." },
  { icon: Code2, title: "Syntax-Ready", desc: "Monospace layout tuned for code readability." },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          eyebrow="Features"
          title="Everything you need. Nothing you don't."
          subtitle="A minimal set of features, engineered so the whole flow feels effortless."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
              <div className="grid place-items-center size-10 rounded-xl mb-4" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                <f.icon className="size-5" />
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}