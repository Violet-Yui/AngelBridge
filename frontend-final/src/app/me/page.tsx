"use client";

import { AppShell } from "@/components/tsq/app-shell";
import { ProfileHeader } from "@/components/tsq/profile-header";
import { MeProfileSections } from "@/components/tsq/me-profile-sections";

export default function MePage() {
  return (
    <AppShell>
      <div className="min-h-dvh bg-[linear-gradient(180deg,#f1ffe7_0%,#f7fbf1_42%,#ffffff_100%)]">
        <ProfileHeader />
        <MeProfileSections />
      </div>
    </AppShell>
  );
}
