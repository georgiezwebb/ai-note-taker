import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { NotesDashboard } from "@/components/dashboard/notes-dashboard";
import { getOrCreateDbUser } from "@/lib/auth-db";
import { mapNoteToDTO, noteCollectionsInclude } from "@/lib/collections-db";
import type { NoteDTO } from "@/lib/note-types";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const user = await getOrCreateDbUser();
  if (!user) {
    redirect("/");
  }

  const rows = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: noteCollectionsInclude,
  });

  const initialNotes: NoteDTO[] = rows.map(mapNoteToDTO);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-8 -right-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,var(--mesh-glow-2),transparent_70%)] blur-3xl opacity-80 sm:-right-24 sm:h-72 sm:w-[28rem]" />
        <div className="absolute top-1/3 -left-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--mesh-glow-3),transparent_70%)] blur-3xl opacity-60 sm:-left-32 sm:h-64 sm:w-80" />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <NotesDashboard initialNotes={initialNotes} />
      </div>
    </div>
  );
}
