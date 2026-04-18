// File: src/components/layout/Header.tsx
import { User, Bell, ChevronDown, Settings, LogOut, Shield, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/context/AuthContext";
import { updateProfile, uploadAvatar } from "@/services/auth.service";
import { getAppSettings, updateAppSettings, uploadAppLogo } from "@/services/appSettings.service";
import type { AppSettings } from "@/services/appSettings.service";
import { useAppSettings } from "@/components/context/AppSettingsContext";

import ProfileModal, { type Profile } from "@/components/profile/ProfileModal";
import AdminProfileModal, { type AdminProfile } from "@/components/profile/AdminProfileModal";
import SettingsModal from "@/components/dashboard/SettingsModal";

export interface HeaderUser {
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  user?: HeaderUser;
  notificationCount?: number;
  onProfileClick?: () => void;
  onLogout?: () => void;
  appLogo?: string;
  appName?: string;
  themeColor?: string;
  onAppSettingsSave?: (data: AdminProfile) => void;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

const SIDEBAR_COLLAPSED_W = 80;  // 5rem
const SIDEBAR_EXPANDED_W  = 256; // 16rem

// Selaras dengan useIsMobile & BottomNav (md:hidden = 768px)
const SIDEBAR_BREAKPOINT = 768;

export default function Header({
  title = "Dashboard",
  subtitle,
  user,
  notificationCount = 0,
  onProfileClick,
  onLogout,
  appLogo,
  appName,
  onAppSettingsSave,
  sidebarOpen = false,
  onSidebarToggle,
}: HeaderProps) {
  const [showDropdown,      setShowDropdown]      = useState(false);
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notifPulse,        setNotifPulse]        = useState(false);
  const dropdownRef                               = useRef<HTMLDivElement>(null);
  const navigate                                  = useNavigate();
  const { user: authUser, setUser }               = useAuth();
  const displayUser                               = authUser ?? user;
  const [appSettings, setAppSettings]             = useState<AppSettings | null>(null);
  const { refresh: refreshBranding }              = useAppSettings();

  // hasSidebar: true saat layar >= 768px (sidebar aktif, BottomNav hilang)
  const [hasSidebar, setHasSidebar] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= SIDEBAR_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setHasSidebar(e.matches);
    mq.addEventListener("change", handler);
    setHasSidebar(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isAdmin = displayUser?.role === "admin";

  const profileData: Profile | undefined = displayUser
    ? { name: displayUser.name, email: displayUser.email, photoPreview: displayUser.avatar ?? "" }
    : undefined;

  const adminProfileData: AdminProfile | undefined = displayUser
    ? {
        name: displayUser.name,
        email: displayUser.email,
        photoPreview: displayUser.avatar ?? "",
        appName: appSettings?.app_name ?? "",
        appWebsite: appSettings?.app_website ?? "",
        appLogo: appSettings?.app_logo_url ?? "",
      }
    : undefined;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (notificationCount > 0) setNotifPulse(true);
  }, [notificationCount]);

  const initials = displayUser?.name
    ? displayUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleProfileSave = async (updated: Profile): Promise<void> => {
    let newAvatarUrl: string | undefined;
    if (updated.photoFile) {
      const result = await uploadAvatar(updated.photoFile);
      newAvatarUrl = result.avatar_url;
    }
    if (updated.name !== displayUser?.name || updated.password) {
      await updateProfile({
        name: updated.name,
        ...(updated.password ? { password: updated.password } : {}),
      });
    }
    if (authUser) {
      setUser({
        ...authUser,
        name: updated.name,
        ...(newAvatarUrl ? { avatar: newAvatarUrl, avatar_url: newAvatarUrl } : {}),
      });
    }
  };

  const handleAdminSave = async (updated: AdminProfile): Promise<void> => {
    // 1. Upload avatar jika ada
    let newAvatarUrl: string | undefined;
    if (updated.photoFile) {
      const result = await uploadAvatar(updated.photoFile);
      newAvatarUrl = result.avatar_url;
    }

    // 2. Update profile (name/password)
    if (updated.name !== displayUser?.name || updated.password) {
      await updateProfile({
        name: updated.name,
        ...(updated.password ? { password: updated.password } : {}),
      });
    }

    // 3. Upload logo jika ada
    if (updated.logoFileObj) {
      await uploadAppLogo(updated.logoFileObj);
    }

    // 4. Update app name/website jika berubah
    const appChanged =
      updated.appName !== appSettings?.app_name ||
      updated.appWebsite !== (appSettings?.app_website ?? "");
    if (appChanged) {
      await updateAppSettings({
        ...(updated.appName ? { app_name: updated.appName } : {}),
        ...(updated.appWebsite !== undefined ? { app_website: updated.appWebsite || null } : {}),
      });
    }

    // 5. Update context user
    if (authUser) {
      setUser({
        ...authUser,
        name: updated.name,
        ...(newAvatarUrl ? { avatar: newAvatarUrl, avatar_url: newAvatarUrl } : {}),
      });

      refreshBranding();
    }
  };

  const openProfileModal = async () => {
    setShowDropdown(false);
    onProfileClick?.();
    if (isAdmin) {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch {}
    }
    setTimeout(() => setShowProfileModal(true), 10);
  };
  const openSettingsModal = () => { setShowDropdown(false); setTimeout(() => setShowSettingsModal(true), 10); };

  /*
    left offset:
    - Mobile (< 768px) : 0 → header full width, tidak ada sidebar
    - Desktop (>= 768px): ikuti lebar sidebar (collapsed/expanded)
    Menggunakan hasSidebar (JS) bukan Tailwind class agar nilai px-nya dinamis.
  */
  const leftOffset = hasSidebar
    ? (sidebarOpen ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .hdr { font-family: 'DM Sans', sans-serif; }
        .hdr-title { font-family: 'Syne', sans-serif; }

        @keyframes ping-ring {
          0%   { transform: scale(1); opacity: 0.8; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .ping-ring { animation: ping-ring 1.6s ease-out 3; }

        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-in { animation: dropdown-in 0.18s cubic-bezier(.22,1,.36,1) both; }

        .header-border {
          background: linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.4) 30%, rgba(245,158,11,0.4) 70%, transparent 100%);
          height: 1px;
        }
        .avatar-ring-admin {
          background: conic-gradient(#a855f7 0deg, #6366f1 120deg, #f59e0b 240deg, #a855f7 360deg);
          padding: 2px; border-radius: 9999px;
        }
        .avatar-ring-user {
          background: conic-gradient(#f59e0b 0deg, #fb923c 180deg, #f59e0b 360deg);
          padding: 2px; border-radius: 9999px;
        }
        .dd-item { transition: background 0.15s; }
        .dd-item:hover { background: rgba(255,255,255,0.05); }

        .sidebar-toggle-btn {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          color: #71717a; background: transparent; border: none;
          cursor: pointer; transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .sidebar-toggle-btn:hover { background: rgba(255,255,255,0.06); color: #e4e4e7; }
        .sidebar-toggle-btn.is-open { background: rgba(168,85,247,0.1); color: #c084fc; }
        .sidebar-toggle-btn .icon-enter { position: absolute; transition: opacity 0.2s, transform 0.2s; }
        .sidebar-toggle-btn .icon-open  { opacity: 0; transform: translateX(-4px); }
        .sidebar-toggle-btn .icon-close { opacity: 1; transform: translateX(0); }
        .sidebar-toggle-btn.is-open .icon-open  { opacity: 1; transform: translateX(0); }
        .sidebar-toggle-btn.is-open .icon-close { opacity: 0; transform: translateX(4px); }

        .hdr-bar {
          transition: left 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>

      <header
        className="hdr hdr-bar bg-zinc-950 fixed top-0 right-0 z-40"
        style={{ left: leftOffset }}
      >
        <div className="flex items-center justify-between px-4 py-3 gap-4">

          {/* Left — Sidebar Toggle + Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar toggle hanya muncul saat hasSidebar (>= 768px) */}
            {hasSidebar && (
              <button
                onClick={onSidebarToggle}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                className={`sidebar-toggle-btn ${sidebarOpen ? "is-open" : ""}`}
              >
                <span className="icon-enter icon-open"><PanelLeftClose size={18} strokeWidth={1.8} /></span>
                <span className="icon-enter icon-close"><PanelLeftOpen  size={18} strokeWidth={1.8} /></span>
              </button>
            )}

            <div className="min-w-0">
              <h1 className="hdr-title text-lg font-bold text-white tracking-tight leading-none truncate">{title}</h1>
              {subtitle && <p className="text-xs text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Notification Bell — selalu tampil */}
            <button
              onClick={() => { setNotifPulse(false); navigate("/notifications"); }}
              aria-label="Notifications"
              className="relative p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Bell size={19} strokeWidth={1.8} />
              {notificationCount > 0 && (
                <>
                  {notifPulse && <span className="ping-ring absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 opacity-75" />}
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-lg shadow-rose-500/40">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                </>
              )}
            </button>

            {/* Profile Dropdown — hanya >= 768px, di bawahnya pakai BottomNav */}
            {hasSidebar && (
              <>
                <div className="w-px h-6 bg-zinc-800 mx-1" />

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown((v) => !v)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200"
                  >
                    <span className={isAdmin ? "avatar-ring-admin shrink-0" : "avatar-ring-user shrink-0"}>
                      {displayUser?.avatar ? (
                        <img src={displayUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover block" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none ${isAdmin ? "bg-purple-600" : "bg-amber-500"}`}>
                          {initials}
                        </div>
                      )}
                    </span>

                    <div className="hidden sm:flex flex-col items-start text-left">
                      <span className="text-sm font-medium text-white leading-none">{displayUser?.name || "User"}</span>
                      <span className={`text-[11px] mt-0.5 leading-none font-medium ${isAdmin ? "text-purple-400" : "text-zinc-500"}`}>
                        {isAdmin ? "Administrator" : (displayUser?.role ?? "Member")}
                      </span>
                    </div>

                    <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showDropdown && (
                    <div className="dropdown-in absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                      <div className="px-4 py-3.5 border-b border-zinc-800/80">
                        <div className="flex items-center gap-3">
                          <span className={isAdmin ? "avatar-ring-admin shrink-0" : "avatar-ring-user shrink-0"}>
                            {displayUser?.avatar ? (
                              <img src={displayUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover block" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${isAdmin ? "bg-purple-600" : "bg-amber-500"}`}>
                                {initials}
                              </div>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{displayUser?.name || "User"}</p>
                            <p className="text-xs text-zinc-500 truncate">{displayUser?.email || ""}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="mt-2.5 flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2.5 py-1.5">
                            <Shield size={12} className="text-purple-400 shrink-0" />
                            <span className="text-xs text-purple-300 font-medium">Admin Access</span>
                          </div>
                        )}
                      </div>

                      <div className="p-1.5">
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={openProfileModal} className="dd-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white text-sm">
                          <User size={15} className="text-zinc-500 shrink-0" />
                          {isAdmin ? "Profile & App Settings" : "View Profile"}
                        </button>
                        {!isAdmin && (
                          <button onClick={openSettingsModal} className="dd-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white text-sm">
                            <Settings size={15} className="text-zinc-500 shrink-0" />
                            Settings
                          </button>
                        )}
                      </div>

                      <div className="p-1.5 border-t border-zinc-800/80">
                        <button
                          onClick={() => { setShowDropdown(false); onLogout?.(); }}
                          className="dd-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-sm transition-colors"
                        >
                          <LogOut size={15} className="shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="header-border" />
      </header>

      {hasSidebar && isAdmin && adminProfileData && (
        <AdminProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} data={adminProfileData} onSave={handleAdminSave} />
      )}
      {hasSidebar && !isAdmin && profileData && (
        <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} data={profileData} onSave={handleProfileSave} />
      )}
      {hasSidebar && (
        <SettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} isAdmin={isAdmin} />
      )}
    </>
  );
}