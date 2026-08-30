"use client";

import { use } from "react";
import { ChannelDetailScreen } from "@/components/screens/channel-detail-screen";

export default function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ChannelDetailScreen id={id} />;
}
