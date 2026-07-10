export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="cd-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="color-mix(in oklab, var(--brand) 55%, oklch(0.85 0.15 320))" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#cd-logo-g)" />
      <path
        d="M12 11.5 8.5 15l3.5 3.5M20 11.5 23.5 15 20 18.5"
        stroke="var(--brand-foreground)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 10.5 14.5 21.5"
        stroke="var(--brand-foreground)"
        strokeOpacity="0.85"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <Logo className="size-7" />
      <span className="font-semibold tracking-tight text-[15px]">CodeDropz</span>
    </div>
  );
}