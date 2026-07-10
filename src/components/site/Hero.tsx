import { ArrowRight, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroDeviceArt } from "./HeroDeviceArt";

const PILLS = ["No Login", "One-Time Share", "Auto Delete", "Fast", "Secure", "Mobile Friendly"];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "var(--gradient-brand)" }}
      />

      <div className="mx-auto max-w-6xl px-4 relative">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground animate-fade-in">
              <Zap className="size-3.5" style={{ color: "var(--brand)" }} />
              No Login Required
            </div>

            <h1 className="mt-6 text-4xl md:text-6xl lg:text-[64px] font-semibold tracking-tight leading-[1.05]">
              <span className="text-gradient">The Fastest Way to</span>
              <br />
              <span className="text-brand-gradient">Share Code</span>{" "}
              <span className="text-gradient">Between Devices</span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl">
              Share code or text instantly with a secure temporary code.
              No accounts. No email. No setup. No installation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full h-12 px-6 bg-primary text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
                <a href="#product">Start Sharing <ArrowRight className="size-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 bg-transparent">
                <a href="#how-it-works">How it Works</a>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2">
              {PILLS.map((p) => (
                <li key={p} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                  <Check className="size-3.5" style={{ color: "var(--brand)" }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <HeroDeviceArt />
        </div>
      </div>
    </section>
  );
}