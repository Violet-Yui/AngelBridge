import { redirect } from "next/navigation";
import { getBridgeRoute } from "@/lib/tsq/bridge-route";

export default async function LegacyBridgeDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  redirect(getBridgeRoute("detail", id));
}
