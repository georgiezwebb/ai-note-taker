import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Do I need an OpenAI key?",
    a: "Only for AI features like summaries. Everything else works without one. Keys are stored encrypted per user, not hard-coded in the repo.",
  },
  {
    q: "Why build another notes app?",
    a: "It was the right scope to practice auth, CRUD, relational data, and optional AI integration in one cohesive thing I'd actually use.",
  },
  {
    q: "Can I poke around the code?",
    a: "You can visit my GitHub repository to see the code and fork the repo if you want to.",
  },
];

export function LandingFaq({ className }: { className?: string }) {
  return (
    <section
      id="faq"
      className={cn("scroll-mt-16 py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="landing-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            FAQ
          </p>
          <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Stuff people ask
          </h2>
        </div>

        <div className="mt-10 max-w-2xl border border-border/80 bg-card/50">
          <Accordion defaultValue={["faq-0"]} className="w-full px-1">
            {faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="px-3">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
