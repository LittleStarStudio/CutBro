// File: src/components/layout/BottomNav.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useHooks";
import { type LucideIcon, User, Settings, LogOut, Shield, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { updateProfile, uploadAvatar } from "@/services/auth.service";
import { getAppSettings, updateAppSettings, uploadAppLogo } from "@/services/appSettings.service";
import type { AppSettings } from "@/services/appSettings.service";
import { useAppSettings } from "@/components/context/AppSettingsContext";

import type { MenuItem } from "@/components/layout/SideBar";
import type { HeaderUser } from "@/components/layout/Header";

import ProfileModal, { type Profile } from "@/components/profile/ProfileModal";
import AdminProfileModal, { type AdminProfile } from "@/components/profile/AdminProfileModal";
import SettingsModal from "@/components/dashboard/SettingsModal";

interface BottomNavProps {
  menuItems: MenuItem[];
  user?: HeaderUser | null;
  onLogout?: () => void;
}

/* ================= ACTIVE HELPER ================= */
function isHrefActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  const isRoot = /^\/(admin|owner|barber|customer)$/.test(href);
  if (isRoot) return false;
  return pathname.startsWith(href + "/");
}

function isItemActive(item: MenuItem, pathname: string): boolean {
  if (item.href) return isHrefActive(item.href, pathname);
  if (item.children) {
    return item.children.some((child) =>
      child.href ? isHrefActive(child.href, pathname) : false
    );
  }
  return false;
}

/* ════════════════════════════════════════════════
   CUSTOMER BottomNav
════════════════════════════════════════════════ */
function CustomerBottomNav({ menuItems, user, onLogout }: BottomNavProps) {
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  const [showDropup,        setShowDropup]        = useState(false);
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropupRef.current && !dropupRef.current.contains(e.target as Node)) {
        setShowDropup(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => { setShowDropup(false); }, [pathname]);

  const navItems = menuItems
    .filter((item) => !item.href?.includes("profile"))
    .slice(0, 4);

    const { user: authUser, setUser } = useAuth();
    const displayUser = authUser ?? user;

    const initials = displayUser?.name
      ? displayUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";

    const handleProfileSave = async (updated: Profile): Promise<void> => {
      let newAvatarUrl: string | undefined;
      if (updated.photoFile) {
        const result = await uploadAvatar(updated.photoFile);
        newAvatarUrl = result.avatar_url;
      }
      if (updated.name !== (authUser?.name ?? user?.name) || updated.password) {
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

  const profileData: Profile | undefined = displayUser
    ? { name: displayUser.name, email: displayUser.email, photoPreview: displayUser.avatar ?? "" }
    : undefined;

  return (
    <>
      {/* md:hidden — aktif di < 768px, selaras dengan SIDEBAR_BREAKPOINT di Header */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">

          {navItems.map((item) => {
            const Icon   = item.icon as LucideIcon;
            const active = isItemActive(item, pathname);
            return (
              <button
                key={item.href ?? item.label}
                onClick={() => item.href && navigate(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1",
                  "py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none",
                  active ? "text-[#D4AF37]" : "text-zinc-500 hover:text-zinc-300"
                )}
                aria-label={item.label}
              >
                <div className="relative">
                  {active && <span className="absolute inset-0 rounded-lg bg-[#D4AF37]/10 scale-150" aria-hidden="true" />}
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} className="relative z-10" />
                  {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4AF37]" aria-hidden="true" />}
                </div>
                <span className={cn("text-[10px] font-medium leading-tight truncate w-full text-center", active ? "text-[#D4AF37]" : "text-zinc-500")}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Profile slot */}
          <div className="relative flex-1" ref={dropupRef}>
            {showDropup && (
              <div className="absolute bottom-full right-0 mb-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-[dropupIn_0.2s_cubic-bezier(.22,1,.36,1)_both]">
                {displayUser && (
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm font-semibold text-white truncate">{displayUser.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{displayUser.email}</p>
                  </div>
                )}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setShowDropup(false); setTimeout(() => setShowProfileModal(true), 10); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                  >
                    <User size={15} className="text-zinc-500 shrink-0" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setShowDropup(false); setTimeout(() => setShowSettingsModal(true), 10); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                  >
                    <Settings size={15} className="text-zinc-500 shrink-0" />
                    Settings
                  </button>
                </div>
                <div className="p-1.5 border-t border-zinc-800">
                  <button
                    onClick={() => { setShowDropup(false); onLogout?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
                  >
                    <LogOut size={15} className="shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDropup((v) => !v)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none",
                showDropup ? "text-[#D4AF37]" : "text-zinc-500 hover:text-zinc-300"
              )}
              aria-label="Profile"
            >
              <div className="relative">
                {showDropup && <span className="absolute inset-0 rounded-lg bg-[#D4AF37]/10 scale-150" aria-hidden="true" />}
                {displayUser?.avatar ? (
                  <img src={displayUser.avatar} alt="" className="relative z-10 w-[22px] h-[22px] rounded-full object-cover ring-1 ring-[#D4AF37]/40" />
                ) : (
                  <div className={cn("relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white", showDropup ? "bg-[#D4AF37]" : "bg-zinc-600")}>
                    {initials}
                  </div>
                )}
              </div>
              <span className={cn("text-[10px] font-medium leading-tight", showDropup ? "text-[#D4AF37]" : "text-zinc-500")}>
                Profile
              </span>
            </button>
          </div>
        </div>
      </nav>

      {profileData && (
        <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} data={profileData} onSave={handleProfileSave} />
      )}
      <SettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  );
}

/* ════════════════════════════════════════════════
   ADMIN/OWNER/BARBER BottomNav
════════════════════════════════════════════════ */
function StaffBottomNav({ menuItems, user, onLogout }: BottomNavProps) {
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  const [openDropup,        setOpenDropup]        = useState<"menu" | "profile" | null>(null);
  const [expandedMenus,     setExpandedMenus]     = useState<string[]>([]);
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const containerRef                              = useRef<HTMLDivElement>(null);
  const [appSettings, setAppSettings]             = useState<AppSettings | null>(null);


  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropup(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => { setOpenDropup(null); }, [pathname]);

  const { user: authUser, setUser } = useAuth();
  const displayUser = authUser ?? user; 
  const { refresh: refreshBranding } = useAppSettings();

  const isAdmin  = displayUser?.role === "admin";
  const initials = displayUser?.name
    ? displayUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

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

  const toggleExpanded = (label: string) =>
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const handleProfileSave = async (updated: Profile): Promise<void> => {
      let newAvatarUrl: string | undefined;
      if (updated.photoFile) {
        const result = await uploadAvatar(updated.photoFile);
        newAvatarUrl = result.avatar_url;
      }
      if (updated.name !== (authUser?.name ?? user?.name) || updated.password) {
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
    let newAvatarUrl: string | undefined;
    if (updated.photoFile) {
      const result = await uploadAvatar(updated.photoFile);
      newAvatarUrl = result.avatar_url;
    }
    if (updated.name !== (authUser?.name ?? user?.name) || updated.password) {
      await updateProfile({
        name: updated.name,
        ...(updated.password ? { password: updated.password } : {}),
      });
    }
    if (updated.logoFileObj) {
      await uploadAppLogo(updated.logoFileObj);
    }
    const appChanged =
      updated.appName !== appSettings?.app_name ||
      updated.appWebsite !== (appSettings?.app_website ?? "");
    if (appChanged) {
      await updateAppSettings({
        ...(updated.appName ? { app_name: updated.appName } : {}),
        ...(updated.appWebsite !== undefined ? { app_website: updated.appWebsite || null } : {}),
      });
    }
    if (authUser) {
      setUser({
        ...authUser,
        name: updated.name,
        ...(newAvatarUrl ? { avatar: newAvatarUrl, avatar_url: newAvatarUrl } : {}),
      });

      refreshBranding();
    }
  };

  const openAdminProfileModal = async () => {
    setOpenDropup(null);
    if (isAdmin) {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch {}
    }
    setTimeout(() => setShowProfileModal(true), 10);
  };

  const handleNavItem = (href?: string) => {
    if (href) { setOpenDropup(null); navigate(href); }
  };

  return (
    <>
      <style>{`
        @keyframes dropupIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropup-in { animation: dropupIn 0.2s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* md:hidden — aktif di < 768px, selaras dengan SIDEBAR_BREAKPOINT di Header */}
      <nav
        ref={containerRef}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">

          {/* ── MENU button ── */}
          <div className="relative flex-1">
            {openDropup === "menu" && (
              <div className="dropup-in absolute bottom-full left-0 mb-3 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
                <div className="px-4 py-2.5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Navigation</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {menuItems.map((item) => {
                    const Icon        = item.icon as LucideIcon;
                    const active      = isItemActive(item, pathname);
                    const isExpanded  = expandedMenus.includes(item.label);
                    const hasChildren = item.children && item.children.length > 0;

                    if (hasChildren) {
                      return (
                        <div key={item.label}>
                          <button
                            onClick={() => toggleExpanded(item.label)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                              active ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                            )}
                          >
                            <Icon size={16} className="shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown size={14} className={cn("shrink-0 text-zinc-500 transition-transform duration-200", isExpanded && "rotate-180")} />
                          </button>
                          {isExpanded && (
                            <div className="ml-8 mt-0.5 space-y-0.5 pb-1">
                              {item.children!.map((child) => {
                                const ChildIcon   = child.icon as LucideIcon;
                                const childActive = child.href
                                  ? isHrefActive(child.href, pathname)
                                  : false;
                                return (
                                  <button
                                    key={child.label}
                                    onClick={() => handleNavItem(child.href)}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                      childActive ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                    )}
                                  >
                                    <ChildIcon size={14} className="shrink-0" />
                                    {child.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNavItem(item.href)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                          active ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                        )}
                      >
                        <Icon size={16} className="shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setOpenDropup((p) => p === "menu" ? null : "menu")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none",
                openDropup === "menu" ? "text-[#D4AF37]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div className="relative">
                {openDropup === "menu" && <span className="absolute inset-0 rounded-lg bg-[#D4AF37]/10 scale-150" aria-hidden="true" />}
                <Menu size={22} strokeWidth={openDropup === "menu" ? 2.2 : 1.8} className="relative z-10" />
              </div>
              <span className={cn("text-[10px] font-medium", openDropup === "menu" ? "text-[#D4AF37]" : "text-zinc-500")}>Menu</span>
            </button>
          </div>

          {/* ── PROFILE slot ── */}
          <div className="relative flex-1">
            {openDropup === "profile" && (
              <div className="dropup-in absolute bottom-full right-0 mb-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                {displayUser && (
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", isAdmin ? "bg-purple-600" : "bg-amber-500")}>
                        {displayUser.avatar ? <img src={displayUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{displayUser.name}</p>
                        <p className={cn("text-xs truncate", isAdmin ? "text-purple-400" : "text-zinc-500")}>
                          {isAdmin ? "Administrator" : (displayUser.role ?? "Member")}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="mt-2 flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
                        <Shield size={11} className="text-purple-400 shrink-0" />
                        <span className="text-xs text-purple-300 font-medium">Admin Access</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-1.5 space-y-0.5">
                  <button onClick={openAdminProfileModal} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm">
                    <User size={15} className="text-zinc-500 shrink-0" />
                    {isAdmin ? "Profile & App Settings" : "My Profile"}
                  </button>
                  {!isAdmin && (
                    <button onClick={() => { setOpenDropup(null); setTimeout(() => setShowSettingsModal(true), 10); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm">
                      <Settings size={15} className="text-zinc-500 shrink-0" />
                      Settings
                    </button>
                  )}
                </div>
                <div className="p-1.5 border-t border-zinc-800">
                  <button onClick={() => { setOpenDropup(null); onLogout?.(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm">
                    <LogOut size={15} className="shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setOpenDropup((p) => p === "profile" ? null : "profile")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none",
                openDropup === "profile" ? "text-[#D4AF37]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div className="relative">
                {openDropup === "profile" && <span className="absolute inset-0 rounded-lg bg-[#D4AF37]/10 scale-150" aria-hidden="true" />}
                {displayUser?.avatar ? (
                  <img src={displayUser.avatar} alt="" className="relative z-10 w-[22px] h-[22px] rounded-full object-cover ring-1 ring-[#D4AF37]/40" />
                ) : (
                  <div className={cn("relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white", openDropup === "profile" ? (isAdmin ? "bg-purple-500" : "bg-[#D4AF37]") : (isAdmin ? "bg-purple-600/70" : "bg-zinc-600"))}>
                    {initials}
                  </div>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", openDropup === "profile" ? "text-[#D4AF37]" : "text-zinc-500")}>Profile</span>
            </button>
          </div>

        </div>
      </nav>

      {isAdmin && adminProfileData ? (
        <AdminProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} data={adminProfileData} onSave={handleAdminSave} />
      ) : profileData ? (
        <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} data={profileData} onSave={handleProfileSave} />
      ) : null}
      <SettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} isAdmin={isAdmin} />
    </>
  );
}

/* ════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════ */
export default function BottomNav(props: BottomNavProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  const isCustomer = props.user?.role === "customer" || !props.user?.role;

  return isCustomer
    ? <CustomerBottomNav {...props} />
    : <StaffBottomNav {...props} />;
}