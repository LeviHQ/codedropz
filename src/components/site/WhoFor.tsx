import { GraduationCap, Code2, Bug, BookOpen, FlaskConical, MessagesSquare, Briefcase, Users } from "lucide-react";
import { SectionHeader } from "./WhyCodeDrop";

const WHO = [
  { icon: GraduationCap, label: "Students", copy: "Hand in snippets without email chains." },
  { icon: Code2, label: "Developers", copy: "Move code between laptop, phone, VM." },
  { icon: Bug, label: "QA Engineers", copy: "Share failing snippets with the team fast." },
  { icon: BookOpen, label: "Teachers", copy: "Give students code without a portal." },
  { icon: FlaskConical, label: "Programming Labs", copy: "Distribute exercises in one code." },
  { icon: MessagesSquare, label: "Coding Interviews", copy: "Send prompts, receive solutions." },
  { icon: Briefcase, label: "Office Teams", copy: "Zero-friction internal snippets." },
  { icon: Users, label: "Friends", copy: "Because Discord isn't for code." },
];

export function WhoFor() {
  return (
    <section id="use-cases" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          eyebrow="Use Cases"
          title="Built for anyone who moves code."
          subtitle="If you've ever emailed yourself a snippet, CodeDropz was made for you."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHO.map((w) => (
            <div key={w.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center size-9 rounded-lg" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  <w.icon className="size-4" />
                </div>
                <div className="font-medium">{w.label}</div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{w.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}