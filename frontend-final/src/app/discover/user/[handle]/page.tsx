"use client";

import { use } from "react";
import { UserProfileScreen } from "@/components/screens/user-profile-screen";

export default function DiscoverUserPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  return <UserProfileScreen handle={handle} />;
}
