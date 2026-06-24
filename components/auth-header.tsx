"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { cn } from "@/lib/utils";

export function AuthHeader() {
  const pathname = usePathname();
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <header
      data-slot="auth-header"
      className={cn(
        "flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border/50 bg-background/70 px-3 backdrop-blur-xl supports-backdrop-filter:bg-background/55 sm:h-16 sm:gap-4 sm:px-4",
        onDashboard && "max-sm:hidden mobile-landscape:hidden"
      )}
    >
      <Show when="signed-out">
        <div className="flex items-center gap-2 sm:gap-4">
          <SignInButton forceRedirectUrl="/dashboard">
            <button
              type="button"
              className="h-10 rounded-lg border border-border/80 bg-background/80 px-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-accent/60 sm:h-10 sm:px-4"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/dashboard">
            <button
              type="button"
              className="h-10 cursor-pointer rounded-lg bg-gradient-to-r from-primary via-chart-2 to-chart-3 px-4 text-sm font-semibold text-primary-foreground shadow-brand transition-transform hover:-translate-y-px sm:px-5"
            >
              Sign up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-2 sm:gap-4">
          {onDashboard ? null : (
            <Link
              href="/dashboard"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background/80 px-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-accent/60 sm:px-4"
            >
              Notes
            </Link>
          )}
          <UserButton />
        </div>
      </Show>
    </header>
  );
}
