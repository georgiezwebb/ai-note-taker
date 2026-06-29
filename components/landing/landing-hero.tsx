"use client";

import Link from "next/link";
import {
  Show,
  SignUpButton,
} from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StickyNote({
  title,
  body,
  meta,
  className,
  tone,
}: {
  title: string;
  body: string;
  meta: string;
  className?: string;
  tone: "amber" | "rose" | "sage";
}) {
  const tones = {
    amber: "bg-[#f9efb8] border-[#e8d88a]",
    rose: "bg-[#fde8e4] border-[#efc5bc]",
    sage: "bg-[#e4efe8] border-[#c5d9cc]",
  };

  return (
    <article
      className={cn(
        "landing-note-shadow relative w-[min(100%,16.5rem)] border px-4 pb-4 pt-8",
        tones[tone],
        className
      )}
    >
      <div
        className="landing-tape absolute -top-2 left-1/2 h-5 w-14 -translate-x-1/2 rounded-sm"
        aria-hidden
      />
      <h3 className="font-heading text-base font-medium leading-snug text-foreground">
        {title}
      </h3>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground/85">
        {body}
      </p>
      <p className="landing-mono mt-3 text-[0.65rem] uppercase tracking-wider text-foreground/50">
        {meta}
      </p>
    </article>
  );
}

export function LandingHero({ className }: { className?: string }) {
  return (
    <section className={cn("border-b border-border/70", className)}>
      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <div className="max-w-xl">
          <p className="landing-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Portfolio project · AI Bootcamp
          </p>
          <h1 className="mt-4 font-heading text-[2.35rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl sm:leading-[1.06]">
            A notes app with AI features.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A full-stack notes app with user authentication, database, collections, calendar filters,
            and optional AI features.
          </p>
          <div
            id="hero-cta"
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Show when="signed-out">
              <SignUpButton forceRedirectUrl="/dashboard">
                <button
                  type="button"
                  className={buttonVariants({
                    variant: "default",
                    size: "lg",
                    className:
                      "h-11 rounded-md bg-primary px-6 text-sm shadow-none hover:bg-primary/90",
                  })}
                >
                  Make an account & try it
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className={buttonVariants({
                  variant: "default",
                  size: "lg",
                  className:
                    "h-11 rounded-md bg-primary px-6 text-sm shadow-none hover:bg-primary/90",
                })}
              >
                Go to my notes
              </Link>
            </Show>
            <Link
              href="#inside"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "h-11 rounded-md border-border bg-card/60 px-6 text-sm hover:bg-card",
              })}
            >
              See what&apos;s in it
            </Link>
          </div>
          <p className="landing-mono mt-6 text-xs text-muted-foreground">
            Next.js · Clerk · Prisma · Neon · OpenAI (optional)
          </p>
        </div>

        <div className="relative mx-auto flex min-h-[22rem] w-full max-w-md items-center justify-center sm:min-h-[24rem] lg:mx-0 lg:min-h-[26rem] lg:max-w-none">
          <StickyNote
            tone="amber"
            title="Coffee shop idea"
            body="What if notes could stay messy while you write, then be tidied up when you ask?"
            meta="Pinned · Mar 12"
            className="-rotate-2 lg:absolute lg:left-0 lg:top-6"
          />
          <StickyNote
            tone="rose"
            title="Weekend collection"
            body="Recipes to try, books to read, yoga clesses to try."
            meta="Collection · 4 notes"
            className="mt-6 rotate-1 sm:mt-0 lg:absolute lg:right-0 lg:top-20"
          />
          <StickyNote
            tone="sage"
            title="Meeting scribbles"
            body="Summarise this when I'm done. Keep the decisions, lose the small talk."
            meta="AI summary ready"
            className="-rotate-1 lg:absolute lg:bottom-2 lg:left-8"
          />
        </div>
      </div>
    </section>
  );
}
