import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";

export async function getOrCreateDbUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) {
    return existing;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return null;
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    null;

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name,
    },
  });
}
