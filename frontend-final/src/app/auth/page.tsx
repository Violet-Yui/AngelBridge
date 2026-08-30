"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/angelbridge-session";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    clearSession();
    router.replace("/");
  }, [router]);

  return null;
}
