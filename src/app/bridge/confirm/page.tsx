import { redirect } from "next/navigation";
import { getBridgeRoute } from "@/lib/tsq/bridge-route";

export default async function LegacyBridgeConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  redirect(getBridgeRoute("confirm", id));
}
