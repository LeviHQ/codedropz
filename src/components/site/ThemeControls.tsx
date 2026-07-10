import { Moon, Sun, Palette } from "lucide-react";
import { ACCENTS, useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      className="rounded-full h-9 w-9"
    >
      {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function AccentPicker() {
  const { accent, setAccent } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 relative"
          aria-label="Change accent color"
        >
          <Palette className="size-4" />
          <span
            className="absolute bottom-1.5 right-1.5 size-2 rounded-full ring-2 ring-background"
            style={{ background: "var(--brand)" }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Accent color</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACCENTS.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onClick={() => setAccent(a.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span
              className="size-4 rounded-full border border-border"
              style={{ background: a.swatch }}
            />
            <span className="flex-1">{a.label}</span>
            {accent === a.id && (
              <span className="text-xs text-muted-foreground">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}