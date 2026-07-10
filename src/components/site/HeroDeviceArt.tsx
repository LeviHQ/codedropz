import { Smartphone, Monitor, ArrowDown } from "lucide-react";

export function HeroDeviceArt() {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-[32px] opacity-30 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative glass rounded-3xl p-6 md:p-8 shadow-[var(--shadow-card)]">
        <DeviceCard icon={<Monitor className="size-4" />} label="Device A" badge="Sender">
          <div className="font-mono text-[11px] text-muted-foreground leading-relaxed">
            <div><span style={{ color: "var(--brand)" }}>const</span> share = <span className="text-foreground">await</span> codedrop</div>
            <div className="pl-3">.paste(code)</div>
            <div className="pl-3">.generate();</div>
          </div>
        </DeviceCard>

        <Connector />

        <div className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Share code
          </div>
          <div
            className="font-mono text-2xl md:text-3xl font-semibold tracking-[0.35em]"
            style={{ color: "var(--brand)" }}
          >
            AB72QK91
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Expires in 09:58</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: "var(--brand)" }} />
              Live
            </span>
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-travel"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--brand) 40%, transparent), transparent)",
            }}
          />
        </div>

        <Connector />

        <DeviceCard icon={<Smartphone className="size-4" />} label="Device B" badge="Receiver">
          <div className="font-mono text-[11px] text-muted-foreground leading-relaxed">
            <div>→ enter code</div>
            <div><span style={{ color: "var(--brand)" }}>✓</span> received instantly</div>
          </div>
        </DeviceCard>
      </div>
    </div>
  );
}

function DeviceCard({
  icon,
  label,
  badge,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="grid place-items-center size-7 rounded-lg bg-secondary" style={{ color: "var(--brand)" }}>
            {icon}
          </span>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 border border-border"
          style={{ color: "var(--brand)" }}
        >
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-2">
      <div className="relative flex items-center justify-center size-7 rounded-full bg-secondary">
        <ArrowDown className="size-3.5" style={{ color: "var(--brand)" }} />
        <span
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: "var(--brand)", animation: "pulse-ring 1.8s ease-out infinite" }}
        />
      </div>
    </div>
  );
}