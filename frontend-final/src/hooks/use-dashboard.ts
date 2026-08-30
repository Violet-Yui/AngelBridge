"use client";

import { useCallback, useEffect, useState } from "react";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { Dashboard } from "@/lib/angelbridge-types";
import { getToken } from "@/lib/angelbridge-session";

let cachedDashboard: Dashboard | null = null;
let cachedToken = "";
let pendingDashboard: Promise<Dashboard> | null = null;

function loadDashboard(force = false) {
  const token = getToken();
  if (cachedToken !== token) {
    cachedDashboard = null;
    pendingDashboard = null;
    cachedToken = token;
  }
  if (pendingDashboard) return pendingDashboard;
  if (!force && cachedDashboard) return Promise.resolve(cachedDashboard);
  pendingDashboard = angelbridgeApi.getDashboard().then((dashboard) => {
    cachedDashboard = dashboard;
    pendingDashboard = null;
    return dashboard;
  }, (error) => {
    pendingDashboard = null;
    throw error;
  });
  return pendingDashboard;
}

export function clearDashboardCache() {
  cachedDashboard = null;
  cachedToken = "";
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(cachedDashboard);
  const [loading, setLoading] = useState(!cachedDashboard);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await loadDashboard(true);
    setDashboard(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    const applyDashboard = (force = false) => loadDashboard(force).then((next) => {
      if (active) setDashboard(next);
    });
    applyDashboard().finally(() => {
      if (active) setLoading(false);
    });
    const refreshWhenReturning = () => {
      if (document.visibilityState === "visible") void applyDashboard(true);
    };
    window.addEventListener("focus", refreshWhenReturning);
    document.addEventListener("visibilitychange", refreshWhenReturning);
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void applyDashboard(true);
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshWhenReturning);
      document.removeEventListener("visibilitychange", refreshWhenReturning);
    };
  }, []);

  return { dashboard, loading, refresh };
}
