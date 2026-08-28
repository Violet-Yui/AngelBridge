"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getSession, logout as logoutRequest, type AuthUser } from "@/lib/api/auth";
const SessionContext = createContext<{ user: AuthUser | null; loading: boolean; logout: () => Promise<void> }>({ user: null, loading: true, logout: async () => {} });
export function SessionProvider({ children }: { children: React.ReactNode }) { const [user, setUser] = useState<AuthUser | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { getSession().then(setUser).finally(() => setLoading(false)); }, []); async function logout() { await logoutRequest(); setUser(null); } return <SessionContext.Provider value={{ user, loading, logout }}>{children}</SessionContext.Provider>; }
export function useSession() { return useContext(SessionContext); }
