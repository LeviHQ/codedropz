import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "./Logo";
import { ModeToggle, AccentPicker } from "./ThemeControls";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#product", label: "Product" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl px-4 h-14 transition-all duration-300",
            scrolled ? "glass" : "bg-transparent border border-transparent",
          )}
        >
          <a href="#top" className="shrink-0">
            <Wordmark />
          </a>

          <div className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map((i) => (
              <a
                key={i.href}
                href={i.href}
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {i.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-1">
              <ModeToggle />
              <AccentPicker />
            </div>
            <Button
              asChild
              size="sm"
              className="rounded-full h-9 px-4 ml-1 bg-primary text-primary-foreground hover:opacity-90"
            >
              <a href="#product">Open Product</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full h-9 w-9"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </nav>

        {open && (
          <div className="md:hidden mt-2 glass rounded-2xl p-3 flex flex-col animate-fade-in">
            {NAV.map((i) => (
              <a
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm hover:bg-accent"
              >
                {i.label}
              </a>
            ))}
            <div className="flex items-center gap-2 px-2 pt-2 border-t border-border mt-2">
              <ModeToggle />
              <AccentPicker />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}