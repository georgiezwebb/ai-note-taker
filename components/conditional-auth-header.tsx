"use client";

import { usePathname } from "next/navigation";

import { AuthHeader } from "@/components/auth-header";

export function ConditionalAuthHeader() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }
  return <AuthHeader />;
}
