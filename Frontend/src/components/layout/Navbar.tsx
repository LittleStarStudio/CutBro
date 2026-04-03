import { Link, useNavigate, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";
import {
  Scissors, Menu, X, Bell, ChevronDown,
  LogOut, Calendar, CalendarCheck, User, Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import ProfileModal, { type Profile } from "@/components/profile/ProfileModal";
import SettingsModal from "@/components/dashboard/SettingsModal";
import type { Role } from "@/lib/auth";

/* ================= TYPES ================= */
export interface NavbarUser {
  name: string;
  email: string;
  avatar?: string;
  role?: Role;
}

interface NavbarProps {
  user?: NavbarUser | null;
  notificationCount?: number;
  onLogout?: () => void;
}

/* ================= CONSTANTS ================= */
const NAV_LINKS_GUEST = [
  { label: "Home",         href: "#hero"         },
  { label: "Features",     href: "#features"     },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
];

const NAV_LINKS_AUTH = [
  { label: "Home",         href: "#hero"         },
  { label: "Features",     href: "#features"     },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
];

const PROFILE_MENU_ITEMS = [
  { label: "Bookings",    href: "/customer/booking",     icon: Calendar      },
  { label: "My Booking",  href: "/customer/my-bookings", icon: CalendarCheck },
];

/* ================= SMALL COMPONENTS ================= */

const Logo = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <Link to={isLoggedIn ? "/customer" : "/"} className="flex items-center gap-2 group">
    <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
      <Scissors className="w-5 h-5 text-neutral-900" />
    </div>
    <span className="text-xl font-bold text-amber-50">
      Cut<span className="font-extrabold">Bro</span>
    </span>
  </Link>
);

const NavLinkItem = ({
  label, href, onClick, className, isLoggedIn = false,
}: {
  label: string; href: string; onClick?: () => void; className?: string; isLoggedIn?: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const sectionId   = href.replace("#", "");
    const landingPath = isLoggedIn ? "/customer" : "/";
    if (location.pathname === landingPath) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(landingPath);
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
    onClick?.();
  };

  return <a href={href} onClick={handleClick} className={className}>{label}</a>;
};

const DesktopNavLinks = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const links = isLoggedIn ? NAV_LINKS_AUTH : NAV_LINKS_GUEST;
  return (
    // Tampil di >= 768px (md), selaras dengan SIDEBAR_BREAKPOINT di Header
    <div className="hidden md:flex items-center gap-8">
      {links.map((link) => (
        <NavLinkItem
          key={link.label} label={link.label} href={link.href} isLoggedIn={isLoggedIn}
          className="text-sm font-medium text-amber-200 hover:text-amber-400 transition-colors cursor-pointer"
        />
      ))}
    </div>
  );
};

const GuestAuthButtons = () => (
  <>
    <Link to="/login"><Button variant="ghost">Login</Button></Link>
    <Link to="/register">
      <Button className="bg-amber-500 text-black font-bold">Sign Up Free</Button>
    </Link>
  </>
);

const NotificationButton = ({ count, onClick }: { count: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="relative p-2.5 text-amber-300 hover:text-amber-50 hover:bg-[#2a1f1a]/50 rounded-xl transition-all duration-300 group"
  >
    <Bell className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
    {count > 0 && (
      <>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-lg shadow-amber-500/50" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
      </>
    )}
  </button>
);

const UserAvatar = ({ user, size = "md" }: { user: NavbarUser; size?: "sm" | "md" }) => {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  if (user.avatar) {
    return (
      <div className="relative">
        <img src={user.avatar} alt={user.name} className={`${sizeClasses} rounded-xl object-cover ring-2 ring-[#3a2e25] group-hover:ring-amber-500/50 transition-all duration-300`} />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    );
  }
  return (
    <div className={`relative ${sizeClasses} rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300 group-hover:scale-105`}>
      <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
};

const DesktopProfileDropdown = ({
  user, isOpen, onToggle, onLogout, onOpenProfile, onOpenSettings, dropdownRef,
}: {
  user: NavbarUser; isOpen: boolean; onToggle: () => void;
  onLogout?: () => void; onOpenProfile: () => void; onOpenSettings: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) => (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={onToggle}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#2a1f1a]/50 transition-all duration-300 cursor-pointer group"
    >
      <div className="hidden sm:block text-right">
        <p className="text-sm font-semibold text-amber-50 tracking-wide">{user.name}</p>
        <p className="text-xs text-amber-200/60 tracking-wider">{user.email}</p>
      </div>
      <UserAvatar user={user} />
      <ChevronDown className="w-4 h-4 text-amber-300 group-hover:text-amber-400 transition-all duration-300 group-hover:translate-y-0.5" />
    </button>

    {isOpen && (
      <div className="absolute right-0 mt-2 w-52 bg-[#221a15] border border-[#3a2e25] rounded-xl shadow-xl overflow-hidden">
        <button onClick={() => { onToggle(); onOpenProfile(); }} className="w-full flex items-center gap-2 px-4 py-3 text-amber-100 hover:bg-[#2f241d] hover:text-amber-50 transition-colors">
          <User size={16} /> My Profile
        </button>
        <button onClick={() => { onToggle(); onOpenSettings(); }} className="w-full flex items-center gap-2 px-4 py-3 text-amber-100 hover:bg-[#2f241d] hover:text-amber-50 transition-colors">
          <Settings size={16} /> Settings
        </button>
        <div className="border-t border-[#3a2e25]" />
        {PROFILE_MENU_ITEMS.map((item) => (
          <Link key={item.href} to={item.href} onClick={onToggle} className="flex items-center gap-2 px-4 py-3 text-amber-100 hover:bg-[#2f241d] hover:text-amber-50 transition-colors">
            <item.icon size={16} /> {item.label}
          </Link>
        ))}
        <div className="border-t border-[#3a2e25]" />
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-[#2f241d] hover:text-red-300 transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    )}
  </div>
);

/* ================= MAIN COMPONENT ================= */
export default function NavbarLayout({ user, notificationCount = 0, onLogout }: NavbarProps) {
  const [isMenuOpen,         setIsMenuOpen]         = useState(false);
  const [desktopProfileOpen, setDesktopProfileOpen] = useState(false);
  const [showProfileModal,   setShowProfileModal]   = useState(false);
  const [showSettingsModal,  setShowSettingsModal]  = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const navigate   = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDesktopProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavClick      = () => setIsMenuOpen(false);
  const handleNavigateNotif = () => { setIsMenuOpen(false); navigate("/notifications"); };

  const openProfileModal = () => {
    setDesktopProfileOpen(false);
    setIsMenuOpen(false);
    setTimeout(() => setShowProfileModal(true), 10);
  };

  const openSettingsModal = () => {
    setDesktopProfileOpen(false);
    setIsMenuOpen(false);
    setTimeout(() => setShowSettingsModal(true), 10);
  };

  const profileData: Profile | undefined = user
    ? { name: user.name, email: user.email, photoPreview: user.avatar ?? "" }
    : undefined;

  const mobileNavLinks = user ? NAV_LINKS_AUTH : NAV_LINKS_GUEST;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a1410]/95 via-[#2a1f1a]/95 to-[#1a1410]/95 backdrop-blur-lg border-b border-[#3a2e25]">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Logo isLoggedIn={!!user} />

            {/* ── DESKTOP (≥ 768px): NavLinks tengah ── */}
            <DesktopNavLinks isLoggedIn={!!user} />

            {/* ── DESKTOP (≥ 768px): Right side ── */}
            <div className="hidden md:flex items-center gap-4">
              {!user ? (
                <GuestAuthButtons />
              ) : (
                <>
                  <NotificationButton count={notificationCount} onClick={handleNavigateNotif} />
                  <DesktopProfileDropdown
                    user={user} isOpen={desktopProfileOpen}
                    onToggle={() => setDesktopProfileOpen((p) => !p)}
                    onLogout={onLogout} onOpenProfile={openProfileModal}
                    onOpenSettings={openSettingsModal} dropdownRef={profileRef}
                  />
                </>
              )}
            </div>

            {/* ── MOBILE (< 768px): Hamburger ── */}
            <button
              aria-label="Toggle menu"
              className="md:hidden p-2 text-amber-400"
              onClick={() => setIsMenuOpen((p) => !p)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* ── MOBILE MENU (< 768px) ── */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-[#3a2e25] bg-[#1a1410]/98 backdrop-blur-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="py-4 space-y-1">

                {/* Nav links */}
                {mobileNavLinks.map((link) => (
                  <NavLinkItem
                    key={link.label} label={link.label} href={link.href}
                    onClick={handleNavClick} isLoggedIn={!!user}
                    className="block text-amber-200 hover:text-amber-400 hover:bg-[#2a1f1a]/50 px-4 py-3 rounded-lg transition-colors"
                  />
                ))}

                <div className="border-t border-[#3a2e25] mt-4 pt-4 px-4 space-y-1">
                  {!user ? (
                    <GuestAuthButtons />
                  ) : (
                    <button
                      onClick={handleNavigateNotif}
                      className="w-full flex items-center gap-3 px-4 py-3 text-amber-200 hover:text-amber-400 hover:bg-[#2a1f1a]/50 rounded-lg transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                      {notificationCount > 0 && (
                        <span className="ml-auto text-xs bg-amber-500 text-black rounded-full px-2 py-0.5 font-semibold">
                          {notificationCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Spacer */}
      <div className="h-16 md:h-20" />

      {profileData && (
        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          data={profileData}
          onSave={(updated) => { console.log("Profile updated:", updated); setShowProfileModal(false); }}
        />
      )}

      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}