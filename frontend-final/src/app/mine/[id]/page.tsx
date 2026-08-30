"use client";

import { use } from "react";
import { MinePostDetailScreen } from "@/components/screens/mine-detail-screen";

export default function MinePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <MinePostDetailScreen id={id} />;
}
