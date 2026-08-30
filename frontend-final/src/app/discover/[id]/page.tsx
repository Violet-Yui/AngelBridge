"use client";

import { use } from "react";
import { PostDetailScreen } from "@/components/screens/post-detail-screen";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PostDetailScreen id={id} />;
}
