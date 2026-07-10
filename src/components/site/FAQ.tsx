import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeader } from "./WhyCodeDrop";

const QA = [
  { q: "Do I need an account?", a: "No. CodeDrop is designed to work without signup, login, or email — open the app and start sharing." },
  { q: "How long is my code stored?", a: "You choose: 10 minutes, 30 minutes, or 1 hour. It's also deleted immediately once the access limit is reached." },
  { q: "Is my code encrypted?", a: "This MVP stores shares in your browser's local storage. The architecture is ready for end-to-end encryption when a real backend is connected." },
  { q: "Can I use it on mobile?", a: "Yes. CodeDrop is fully responsive and touch-friendly on phones and tablets." },
  { q: "Can I share plain text?", a: "Absolutely — code, notes, URLs, tokens, anything text-based." },
  { q: "Does it work for any programming language?", a: "Yes. Snippets are stored as text so any language works. Syntax highlighting is on the roadmap." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader
          eyebrow="FAQ"
          title="Frequently asked questions"
          subtitle="Everything you might want to know before your first share."
        />
        <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border bg-card divide-y divide-border">
          {QA.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="px-5">
              <AccordionTrigger className="text-left text-base font-medium py-5">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-5">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}