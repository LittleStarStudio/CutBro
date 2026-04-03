import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useRef } from "react";
import {
  Crown,
  Users,
  TrendingUp,
  Save,
  X,
  Check,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */

type PlanFeature = {
  text: string;
  included: boolean;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular: boolean;
  borderColor: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
};

/* ================= INITIAL DATA ================= */

const INITIAL_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    period: "Forever",
    description: "Perfect for small barbershops just getting started",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    features: [
      { text: "1 Barber", included: true },
      { text: "Online Booking", included: true },
      { text: "Basic Reports", included: true },
    ],
    popular: false,
    borderColor: "border-neutral-800",
    gradient: "from-blue-500/5 to-transparent",
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rp 299K",
    period: "/month",
    description: "For growing barbershops that need more power",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    features: [
      { text: "5 Barbers", included: true },
      { text: "All Free Features", included: true },
      { text: "Email Notifications", included: true },
      { text: "Digital Payment Integration", included: true },
      { text: "Advanced Analytics", included: true },
    ],
    popular: true,
    borderColor: "border-amber-500",
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    id: "premium",
    name: "Premium",
    price: "Rp 599K",
    period: "/month",
    description: "For large barbershops & franchises",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    features: [
      { text: "Unlimited Barbers", included: true },
      { text: "All Free Features", included: true },
      { text: "Email Notifications", included: true },
      { text: "Digital Payment Integration", included: true },
      { text: "Advanced Analytics", included: true },
    ],
    popular: false,
    borderColor: "border-purple-500/50",
    gradient: "from-purple-500/10 to-transparent",
  },
];

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Users,
  pro: TrendingUp,
  premium: Crown,
};

/* ================= SUBCOMPONENTS ================= */

function FeatureListReadOnly({ features }: { features: PlanFeature[] }) {
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
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                feature.included
                  ? "bg-emerald-500/20"
                  : "bg-neutral-800"
              )}
            >
              {feature.included ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <X className="w-3 h-3 text-neutral-600" />
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                feature.included
                  ? "text-neutral-300"
                  : "text-neutral-600 line-through"
              )}
            >
              {feature.text}
            </span>
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
  plan: Plan;
  onChange: (updated: Plan) => void;
}) {
  const Icon = PLAN_ICONS[plan.id] ?? Crown;

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br border rounded-3xl p-6 transition-all duration-300",
        plan.gradient,
        plan.popular
          ? "border-amber-500 shadow-xl shadow-amber-500/10"
          : plan.borderColor
      )}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Crown className="w-3 h-3" />
            MOST POPULAR
          </div>
        </div>
      )}

      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
          plan.iconBg
        )}
      >
        <Icon className={cn("w-6 h-6", plan.iconColor)} />
      </div>

      {/* Plan Name */}
      <div className="mb-3">
        <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1 block">
          Plan Name
        </label>
        <input
          value={plan.name}
          onChange={(e) => onChange({ ...plan, name: e.target.value })}
          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-3 py-2 text-white font-bold text-lg outline-none focus:border-amber-500/50 transition-colors"
        />
      </div>

      {/* Price + Period */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1 block">
            Price
          </label>
          <input
            value={plan.price}
            onChange={(e) => onChange({ ...plan, price: e.target.value })}
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
            value={plan.period}
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

      {/* Features — read-only */}
      <FeatureListReadOnly features={plan.features} />
    </div>
  );
}


/* ================= MAIN COMPONENT ================= */

export default function SubscribePage() {
  const toast = useToast();
  const currentUser = getUser();
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [saved, setSaved] = useState(false);

  const savedPlansRef = useRef<string>(JSON.stringify(INITIAL_PLANS));

  const plansJson = JSON.stringify(plans);
  const hasChanges = plansJson !== savedPlansRef.current;

  const updatePlan = (id: string, updated: Plan) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleSave = () => {
    if (!hasChanges) return;
    savedPlansRef.current = plansJson;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast.success("Plans Saved", "Subscription plans have been updated successfully.");
  };

  return (
    <DashboardLayout
      title="Subscription Plans"
      subtitle="Manage and edit pricing plans shown to users"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={
        currentUser ?? {
          name: "Super Admin",
          email: "admin@cutbro.com",
          role: "admin",
        }
      }
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="space-y-6">

        {/* ================= TOP BAR ================= */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              saved
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : hasChanges
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:opacity-90"
                : "bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed"
            )}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* ================= PLANS GRID ================= */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <PlanEditor
              key={plan.id}
              plan={plan}
              onChange={(updated) => updatePlan(plan.id, updated)}
            />
          ))}
        </div>

        {/* ================= HINT + UNSAVED INDICATOR ================= */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300 flex-1">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You can edit the plan <strong>name</strong>,{" "}
              <strong>price</strong>, and <strong>description</strong>. Period
              and features are locked and cannot be modified.
            </span>
          </div>

          {hasChanges && !saved && (
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