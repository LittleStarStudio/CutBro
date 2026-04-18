// File: src/components/layout/DashboardLayout.tsx

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/layout/SideBar";
import { useAppSettings } from "@/components/context/AppSettingsContext";
import type { MenuItem } from "@/components/layout/SideBar";

import Header from "@/components/layout/Header";
import type { HeaderUser } from "@/components/layout/Header";
import type { AdminProfile } from "@/components/profile/AdminProfileModal";

import BottomNav from "@/components/layout/BottomNav";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserProfile = HeaderUser;

/*
  Satu breakpoint tunggal untuk semua komponen:
  - useIsMobile()             → < 768px  (BottomNav aktif)
  - Header SIDEBAR_BREAKPOINT → >= 768px (profile dropdown muncul)
  - Sidebar CSS @media        → >= 768px (collapse/expand mode)
  - BottomNav md:hidden       → >= 768px (BottomNav hilang)
*/
const BREAKPOINT = 768;

interface LayoutProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  menuItems?: MenuItem[];
  logo?: { icon: LucideIcon; text: string; highlight?: string };
  userProfile?: UserProfile;
  onLogout?: () => void;
  showNotification?: boolean;
  notificationCount?: number;
  appLogo?: string;
  appName?: string;
  themeColor?: string;
  onAppSettingsSave?: (data: AdminProfile) => void;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  menuItems = [],
  logo,
  userProfile,
  onLogout,
  showNotification = true,
  notificationCount = 0,
  appLogo,
  appName,
  themeColor,
  onAppSettingsSave,
}: LayoutProps) {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= BREAKPOINT
  );

  const { appLogoUrl } = useAppSettings();

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const pageVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -6 },
  };

  const contentPaddingLeft = !isMobile && showSidebar
    ? (sidebarOpen ? "pl-64" : "pl-20")
    : "pl-0";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">

      {/* ── SIDEBAR ──
          Hanya dirender di >= 768px.
          Di < 768px tidak ada sidebar — navigasi pakai BottomNav.
      */}
      {!isMobile && showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          menuItems={menuItems}
          logo={logo ? { ...logo, imageUrl: appLogoUrl ?? undefined } : undefined}
          onLogout={onLogout}
        />
      )}

      {/* ── MAIN AREA ── */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 w-full",
          "transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          contentPaddingLeft
        )}
      >
        <Header
          title={title}
          subtitle={subtitle}
          user={userProfile}
          notificationCount={showNotification ? notificationCount : 0}
          onLogout={onLogout}
          appLogo={appLogo}
          appName={appName}
          themeColor={themeColor}
          onAppSettingsSave={onAppSettingsSave}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((v) => !v)}
        />

        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "px-4 sm:px-6 lg:px-8",
          "pt-[57px]",           
          isMobile ? "pb-24" : "pb-6", 
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-full pt-4 sm:pt-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── BOTTOM NAV ──
          Hanya dirender di < 768px (isMobile).
          BottomNav sendiri juga punya md:hidden sebagai CSS fallback.
      */}
      {isMobile && showSidebar && menuItems.length > 0 && (
        <BottomNav
          menuItems={menuItems}
          user={userProfile}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}