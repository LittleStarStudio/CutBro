import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useRef, useEffect } from "react";
import {
  Crown, Users, TrendingUp,
  Save, X, Check, Shield, Lock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import * as adminService from "@/services/admin.service";
import type { SubscriptionPlan } from "@/services/admin.service";

/* ── Helpers ── */

const PLAN_ICONS: Record<string, React.ElementType> = {
  free:    Users,
  pro:     TrendingUp,
  premium: Crown,
};

const PLAN_STYLES: Record<string, { border: string; gradient: string; iconBg: string; iconColor: string; popular: boolean }> = {
  free: {
    border:    "border-neutral-800",
    gradient:  "from-blue-500/5 to-transparent",
    iconBg:    "bg-blue-500/10",
    iconColor: "text-blue-400",
    popular:   false,
  },
  pro: {
    border:    "border-amber-500",
    gradient:  "from-amber-500/10 to-transparent",
    iconBg:    "bg-amber-500/10",
    iconColor: "text-amber-400",
    popular:   true,
  },
  premium: {
    border:    "border-purple-500/50",
    gradient:  "from-purple-500/10 to-transparent",
    iconBg:    "bg-purple-500/10",
    iconColor: "text-purple-400",
    popular:   false,
  },
};

const PLAN_FEATURES: Record<string, string[]> = {
  free:    ["1 Barber", "Online Booking", "Digital Payment Integration"],
  pro:     ["5 Barbers", "All Free Features", "Email Notifications", "Advanced Analytics and Reporting"],
  premium: ["Unlimited Barbers", "All Free Features", "Email Notifications", "Advanced Analytics and Reporting"],
};

const PLAN_PERIOD: Record<string, string> = {
  free:    "Forever",
  pro:     "/month",
  premium: "/month",
};

function formatRupiah(value: number): string {
  if (value === 0) return "0";
  return value.toLocaleString("id-ID");
}

/* ── Subcomponents ── */

function FeatureList({ features }: { features: string[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
          Features
        </label>
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <Lock className="w-3 h-3" />
          <span>Locked</span>
        </div>
      </div>
      <div className="space-y-2 px-3 py-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl">
        {features.map((text, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20">
              <Check className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-sm text-neutral-300">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanEditor({
  plan,
  onChange,
}: {
  plan: SubscriptionPlan;
  onChange: (updated: SubscriptionPlan) => void;
}) {
  const Icon    = PLAN_ICONS[plan.name]    ?? Crown;
  const style   = PLAN_STYLES[plan.name]   ?? PLAN_STYLES.free;
  const features = PLAN_FEATURES[plan.name] ?? [];

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br border rounded-3xl p-6 transition-all duration-300",
        style.gradient,
        style.popular ? "border-amber-500 shadow-xl shadow-amber-500/10" : style.border
      )}
    >
      {style.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Crown className="w-3 h-3" />
            MOST POPULAR
          </div>
        </div>
      )}

      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", style.iconBg)}>
        <Icon className={cn("w-6 h-6", style.iconColor)} />
      </div>

      {/* Display Name */}
      <div className="mb-3">
        <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1 block">
          Plan Name
        </label>
        <input
          value={plan.display_name}
          onChange={(e) => onChange({ ...plan, display_name: e.target.value })}
          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-3 py-2 text-white font-bold text-lg outline-none focus:border-amber-500/50 transition-colors"
        />
      </div>

      {/* Price + Period */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1 block">
            Price (Rp)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatRupiah(plan.price)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
              onChange({ ...plan, price: raw === "" ? 0 : Number(raw) });
            }}
            className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
              Period
            </label>
            <div className="flex items-center gap-1 text-xs text-neutral-600">
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </div>
          </div>
          <input
            value={PLAN_PERIOD[plan.name] ?? "-"}
            disabled
            className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-600 cursor-not-allowed"
          />
        </div>
      </div>


      {/* Description */}
      <div className="mb-4">
        <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1 block">
          Description
        </label>
        <textarea
          value={plan.description}
          onChange={(e) => onChange({ ...plan, description: e.target.value })}
          rows={2}
          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-300 text-sm outline-none focus:border-amber-500/50 transition-colors resize-none"
        />
      </div>

      <FeatureList features={features} />
    </div>
  );
}

/* ── Main Component ── */

export default function SubscribePage() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [plans, setPlans]       = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const savedRef = useRef<string>("");

  const hasChanges = JSON.stringify(plans) !== savedRef.current;

  useEffect(() => {
    adminService.getSubscriptionPlans().then((data) => {
      setPlans(data);
      savedRef.current = JSON.stringify(data);
    }).finally(() => setLoading(false));
  }, []);

  const updatePlan = (id: number, updated: SubscriptionPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        plans.map((p) =>
          adminService.updateSubscriptionPlan(p.id, {
            display_name: p.display_name,
            price:        p.price,
            description:  p.description,
          })
        )
      );
      savedRef.current = JSON.stringify(plans);
      toast.success("Plans Saved", "Subscription plans have been updated successfully.");
    } catch {
      toast.error("Save Failed", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Subscription Plans"
      subtitle="Manage and edit pricing plans shown to users"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={user ?? { name: "Super Admin", email: "admin@cutbro.com", role: "admin" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="space-y-6">

        {/* Top Bar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              saving
                ? "bg-neutral-800 border border-neutral-700 text-neutral-400 cursor-wait"
                : hasChanges
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:opacity-90"
                : "bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed"
            )}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading plans...
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <PlanEditor
                key={plan.id}
                plan={plan}
                onChange={(updated) => updatePlan(plan.id, updated)}
              />
            ))}
          </div>
        )}

        {/* Hint */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300 flex-1">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You can edit the plan <strong>name</strong>,{" "}
              <strong>price</strong>, and <strong>description</strong>. Features are locked and cannot be modified.
            </span>
          </div>
          {hasChanges && !saving && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
