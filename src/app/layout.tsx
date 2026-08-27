import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { LocaleSyncEffect } from "@/components/i18n/locale-sync-effect";
import { getServerLocale } from "@/lib/i18n/server-preference";
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { title: "天使桥", description: "以生命树为隐喻的资源互换社区，连接人与人、人与资源。", icons: { icon: "/vercel.svg" }, openGraph: { type: "website", siteName: "天使桥", title: "天使桥", description: "连接人与人、人与资源。" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { const locale = await getServerLocale(); return <html lang={locale} suppressHydrationWarning className={cn("h-full antialiased", "font-sans", geist.variable)}><body className="h-full flex flex-col"><I18nProvider><LocaleSyncEffect />{children}<Toaster /></I18nProvider></body></html>; }
