"use client";

import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function usesEmailPasswordOnly(user: ReturnType<typeof useUser>["user"]) {
  if (!user?.passwordEnabled) {
    return false;
  }
  return user.externalAccounts.length === 0;
}

export function DashboardAccountButton({
  className,
}: {
  className?: string;
}) {
  const { user } = useUser();
  const showSignOut = usesEmailPasswordOnly(user);

  if (showSignOut) {
    return (
      <SignOutButton>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-11 shrink-0 px-3 text-xs mobile-landscape:h-9 sm:h-9 sm:text-sm",
            className
          )}
        >
          Sign out
        </Button>
      </SignOutButton>
    );
  }

  return (
    <div className={cn("shrink-0", className)}>
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-11 w-11 mobile-landscape:h-9 mobile-landscape:w-9",
          },
        }}
      />
    </div>
  );
}
