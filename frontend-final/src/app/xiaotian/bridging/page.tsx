import { Suspense } from "react";
import { BridgingScreen } from "@/components/screens/bridging-screen";

export default function BridgingPage() {
  return (
    <Suspense fallback={null}>
      <BridgingScreen />
    </Suspense>
  );
}
