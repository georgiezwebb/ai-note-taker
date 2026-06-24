"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNavbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="font-heading text-lg font-medium tracking-tight text-foreground"
        >
          note pile
        </Link>
        <nav
          className="hidden items-center gap-8 sm:flex"
          aria-label="Primary"
        >
          <a
            href="#inside"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Inside the app
          </a>
          <a
            href="#faq"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton forceRedirectUrl="/dashboard">
              <button
                type="button"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/dashboard">
              <button
                type="button"
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className:
                    "rounded-md bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
                })}
              >
                Try it
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className:
                  "rounded-md bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
              })}
            >
              Open notes
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}
