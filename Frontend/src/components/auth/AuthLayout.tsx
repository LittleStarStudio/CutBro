import type { ReactNode } from "react";
import { ArrowLeft, Scissors } from "lucide-react";
import type { Role } from "@/lib/auth";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;

  /* 🔥 OPTIONAL (untuk register saja) */
  subtitle?: string;
  selectedRole?: Role | null;
  onBack?: () => void;
}

/* ================= ROLE CONFIG ================= */
const ROLE_CONFIG: Record<Role, { title: string; color: string }> = {
  customer: { title: "Customer", color: "text-blue-400" },
  owner: { title: "Owner", color: "text-purple-400" },
  barber: { title: "Barber", color: "text-amber-400" },
  admin: { title: "Admin", color: "text-red-400" },
};

export default function AuthLayout({
  children,
  title,
  subtitle,
  selectedRole,
  onBack,
}: AuthLayoutProps) {
  const hasRole = !!selectedRole;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* ================= BACK BUTTON (role only) ================= */}
        {hasRole && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Change role</span>
          </button>
        )}

        {/* ================= HEADER ================= */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white">{title}</h2>

          {/* subtitle hanya kalau ada role */}
          {hasRole && subtitle && (
            <p className="text-neutral-400 text-sm mt-2">
              {subtitle}{" "}
              <span
                className={`font-semibold ${ROLE_CONFIG[selectedRole!].color}`}
              >
                {ROLE_CONFIG[selectedRole!].title}
              </span>
            </p>
          )}
        </div>

        {/* ================= CONTENT ================= */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
