"use client";

import Link from "next/link";
import {
  Show,
  SignUpButton,
} from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border/70 bg-card/40 py-14 sm:py-16",
        className
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="max-w-md">
          <p className="font-heading text-2xl font-medium text-foreground">
            note pile
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A portfolio piece: full-stack notes with useful AI features.
          </p>
          <Show when="signed-out">
            <SignUpButton forceRedirectUrl="/dashboard">
              <button
                type="button"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-6 rounded-md border-border bg-background",
                })}
              >
                Try the live demo
              </button>
            </SignUpButton>
          </Show>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:text-right">
          <Link
            href="#inside"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            What&apos;s inside
          </Link>
          <Link
            href="#faq"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            FAQ
          </Link>
          <Link
            href="/dashboard"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Dashboard
          </Link>
          <p className="landing-mono mt-4 text-xs">
            © {year} · built for a portfolio
          </p>
        </div>
      </div>
    </footer>
  );
}
