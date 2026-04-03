// File: src/components/dashboard/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  children?: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  logo?: {
    icon: LucideIcon;
    text: string; // UserRole: "SuperAdmin" | "Owner" | "Barber" | "Customer"
  };
  onLogout?: () => void;
}

/* ================= COMPONENT ================= */

export default function Sidebar({
  isOpen,
  onClose,
  menuItems,
  logo,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const sidebarRef = useRef<HTMLElement>(null);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  // Close on outside click (mobile only — < 768px)
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        isOpen &&
        window.innerWidth < 768 &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      <style>{`
        /* ── Mobile backdrop ── */
        .sb-backdrop {
          display: none;
        }
        @media (max-width: 767px) {
          .sb-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 49;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .sb-backdrop.open {
            opacity: 1;
            pointer-events: all;
          }
        }

        /* ── Sidebar transitions ── */
        .sb-panel {
          transition:
            transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, width;
        }

        @media (max-width: 767px) {
          .sb-panel {
            width: 16rem !important;
            transform: translateX(-100%);
          }
          .sb-panel.open {
            transform: translateX(0);
          }
        }

        @media (min-width: 768px) {
          .sb-panel {
            transform: translateX(0) !important;
            width: 5rem;
          }
          .sb-panel.open {
            width: 16rem;
          }
        }

        /* ── Label fade ── */
        .sb-label {
          overflow: hidden;
          white-space: nowrap;
          opacity: 0;
          max-width: 0;
          transition:
            max-width 0.25s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.2s ease;
          display: inline-block;
        }
        @media (max-width: 767px) {
          .sb-label {
            max-width: 200px;
            opacity: 1;
          }
        }
        @media (min-width: 768px) {
          .sb-panel.open .sb-label {
            max-width: 200px;
            opacity: 1;
          }
        }
      `}</style>

      {/* Backdrop (mobile only) */}
      <div
        className={`sb-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={cn(
          "sb-panel",
          "fixed inset-y-0 left-0 z-50",
          "bg-zinc-900/95 backdrop-blur-xl",
          "border-r border-zinc-800/50",
          "shadow-2xl shadow-black/40",
          "overflow-hidden",
          isOpen && "open"
        )}
      >
        <div className="flex flex-col h-full w-64">

          {/* ── LOGO ── */}
          <div className="px-4 py-6 flex items-center justify-between border-b border-zinc-800/50 min-h-[76px]">
            <div className="flex items-center gap-3 min-w-0 cursor-default select-none">
              {logo && (
                <>
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 flex items-center justify-center shadow-lg">
                    <logo.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="sb-label flex flex-col">
                    <span className="text-[15px] font-bold leading-tight">
                      <span className="text-white">{logo.text}</span>
                      <span className="ml-1 bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                        Panel
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="md:hidden text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-2"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── NAV ── */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden">
            {menuItems.map((item) => {
              const isActive = item.href
                ? location.pathname === item.href
                : item.children?.some((child) => location.pathname === child.href);
              const isOpenMenu = openMenus.includes(item.label);

              if (item.children) {
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      title={item.label}
                      className={cn(
                        "flex items-center w-full gap-3 px-3 py-3 rounded-xl font-medium",
                        "transition-all duration-200",
                        isActive
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="sb-label flex-1 text-left text-sm">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "sb-label w-4 h-4 shrink-0 transition-transform duration-200",
                          isOpenMenu && "rotate-180"
                        )}
                      />
                    </button>

                    {isOpenMenu && isOpen && (
                      <div className="ml-9 mt-1 space-y-0.5">
                        {item.children.map((child) => {
                          const childActive = location.pathname === child.href;
                          return (
                            <Link
                              key={child.label}
                              to={child.href!}
                              onClick={() => window.innerWidth < 768 && onClose()}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                                "transition-colors",
                                childActive
                                  ? "text-amber-400 bg-amber-500/10"
                                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                              )}
                            >
                              <child.icon className="w-4 h-4 shrink-0" />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href!}
                  title={item.label}
                  onClick={() => window.innerWidth < 768 && onClose()}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl font-medium",
                    "transition-all duration-200",
                    isActive
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="sb-label text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── LOGOUT ── */}
          {onLogout && (
            <div className="p-3 border-t border-zinc-800/50">
              <button
                onClick={onLogout}
                title="Logout"
                className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="sb-label text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}