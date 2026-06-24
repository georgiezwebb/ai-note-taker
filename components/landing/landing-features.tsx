import { cn } from "@/lib/utils";

const items = [
  {
    num: "01",
    title: "Write and organise your notes",
    description:
      "Easy to create notes, pin important ones, search using the search bar or the calendar filter and group notes into collections.",
  },
  {
    num: "02",
    title: "Organise notes and group them together",
    description:
      "Group notes into collections from the sidebar, from a note itself, or straight from a multi-date calendar filter.",
  },
  {
    num: "03",
    title: "AI (if you want it)",
    description:
      "Polish drafts, summarise a note, or summarise a whole collection using your own OpenAI key (no need to sign up or enter credit card details).",
  },
] as const;

export function LandingFeatures({ className }: { className?: string }) {
  return (
    <section
      id="inside"
      className={cn("scroll-mt-16 border-b border-border/70 py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="landing-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            What&apos;s inside
          </p>
          <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Features
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed sm:text-lg">
            You can use the app after signing in. This is a showcase of a full-stack app I built to practice my skills.
          </p>
        </div>

        <ol className="mt-14 space-y-0 divide-y divide-border/80 border-y border-border/80">
          {items.map(({ num, title, description }) => (
            <li
              key={num}
              className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr] sm:gap-8 sm:py-10"
            >
              <p className="landing-mono text-sm text-primary">{num}</p>
              <div>
                <h3 className="font-heading text-xl font-medium text-foreground sm:text-2xl">
                  {title}
                </h3>
                <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
