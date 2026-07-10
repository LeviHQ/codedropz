
import { Wordmark } from "./Logo";
import { ModeToggle } from "./ThemeControls";

export function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            The fastest way to securely share code or text between two devices.
            No login. No setup. Just paste, generate, share.
          </p>
        </div>

        <FooterCol title="Product" links={[
          { label: "Features", href: "#features" },
          { label: "How it Works", href: "#how-it-works" },
          { label: "Use Cases", href: "#use-cases" },
          { label: "Open App", href: "#product" },
        ]} />

        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Theme</div>
          <div className="mt-3 flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} CodeDropz. All rights reserved.</span>
          <span>Paste. Generate. Share.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-foreground/80 hover:text-foreground transition-colors">{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}