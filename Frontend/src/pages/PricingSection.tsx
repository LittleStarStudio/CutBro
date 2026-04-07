import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import {
  Check, ArrowRight, Sparkles, Zap, Crown,
  Users, TrendingUp, Shield, Star, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicPlans } from "@/services/owner.service";
import type { SubscriptionPlan } from "@/services/owner.service";

/* ── Constants ── */

const PLAN_ICONS: Record<string, React.ElementType> = {
  free:    Users,
  pro:     TrendingUp,
  premium: Crown,
};

const PLAN_STYLES: Record<string, {
  iconBg: string; iconColor: string;
  border: string; gradient: string;
  popular: boolean; cta: string;
}> = {
  free: {
    iconBg:    "bg-blue-500/10",
    iconColor: "text-blue-400",
    border:    "border-neutral-800",
    gradient:  "from-blue-500/5 to-transparent",
    popular:   false,
    cta:       "Start Free",
  },
  pro: {
    iconBg:    "bg-amber-500/10",
    iconColor: "text-amber-400",
    border:    "border-amber-500",
    gradient:  "from-amber-500/10 to-transparent",
    popular:   true,
    cta:       "Choose Pro",
  },
  premium: {
    iconBg:    "bg-purple-500/10",
    iconColor: "text-purple-400",
    border:    "border-purple-500/50",
    gradient:  "from-purple-500/10 to-transparent",
    popular:   false,
    cta:       "Choose Premium",
  },
};

const PLAN_FEATURES: Record<string, string[]> = {
  free:    ["1 Barber", "Online Booking", "Basic Reports", "Digital Payment Integration"],
  pro:     ["5 Barbers", "All Free Features", "Email Notifications", "Advanced Analytics"],
  premium: ["Unlimited Barbers", "All Pro Features", "Multi Branch Management", "Priority Support"],
};

const PLAN_PERIOD: Record<string, string> = {
  free:    "Forever",
  pro:     "/month",
  premium: "/month",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return "Rp " + price.toLocaleString("id-ID");
}

/* ── Main Component ── */

export default function Pricing() {
  const navigate = useNavigate();

  const [plans, setPlans]               = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [hoveredPlan, setHoveredPlan]   = useState<string | null>(null);

  /* Guard: hanya owner yang baru register */
  useEffect(() => {
    const registered = sessionStorage.getItem("registeredOwner") === "true";
    if (!registered) navigate("/register", { replace: true });
  }, [navigate]);

  /* Load plans dari API */
  useEffect(() => {
    getPublicPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const handleChoosePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selectedPlan) return;
    // Simpan pilihan plan → diproses setelah owner login
    sessionStorage.setItem("chosen_plan_id", String(selectedPlan.id));
    sessionStorage.setItem("chosen_plan_name", selectedPlan.name);
    sessionStorage.removeItem("registeredOwner");
    navigate("/login?registered=true", { replace: true });
  };

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-neutral-950">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950" />
      </div>

      <section className="relative py-24 min-h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-bold">Choose Your Perfect Plan</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Simple,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Transparent
              </span>{" "}
              Pricing
            </h1>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Start for free, upgrade as you grow. No hidden fees, cancel anytime.
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Shield className="w-4 h-4 text-emerald-400" /> Secure Payment
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Zap className="w-4 h-4 text-amber-400" /> Instant Setup
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Star className="w-4 h-4 text-purple-400" /> Cancel Anytime
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading plans...
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => {
                const style   = PLAN_STYLES[plan.name] ?? PLAN_STYLES.free;
                const Icon    = PLAN_ICONS[plan.name]  ?? Crown;
                const features = PLAN_FEATURES[plan.name] ?? [];
                const period   = PLAN_PERIOD[plan.name]   ?? "/month";
                const isHovered = hoveredPlan === plan.name;

                return (
                  <div
                    key={plan.id}
                    onMouseEnter={() => setHoveredPlan(plan.name)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    className={cn(
                      "group relative bg-gradient-to-br border rounded-3xl p-8 transition-all duration-500 animate-fade-in",
                      style.gradient,
                      style.popular
                        ? "border-amber-500 shadow-2xl shadow-amber-500/20 scale-105 md:scale-110 z-10"
                        : style.border,
                      isHovered && !style.popular && "scale-105 shadow-xl"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {style.popular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 blur-lg opacity-50" />
                          <div className="relative bg-gradient-to-r from-amber-400 to-amber-600 text-black px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                            <Crown className="w-4 h-4" /> MOST POPULAR
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500", style.iconBg, isHovered && "scale-110 rotate-6")}>
                      <Icon className={cn("w-7 h-7", style.iconColor)} />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">{plan.display_name}</h3>
                    <p className="text-sm text-neutral-400 mb-6">{plan.description}</p>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-white">{formatPrice(plan.price)}</span>
                        {period !== "Forever" && (
                          <span className="text-neutral-400 text-sm">{period}</span>
                        )}
                      </div>
                      {period === "Forever" && (
                        <span className="text-emerald-400 text-sm font-semibold">No credit card required</span>
                      )}
                    </div>

                    <ul className="space-y-4 mb-8">
                      {features.map((text, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-neutral-200">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          <span className="font-medium">{text}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn("w-full", style.popular && "shadow-lg shadow-amber-500/25")}
                      variant={style.popular ? "gold" : "default"}
                      onClick={() => handleChoosePlan(plan)}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {style.cta}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-16">
            <p className="text-neutral-500 text-sm">
              You can upgrade or change your plan anytime from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5 -z-10" />
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white text-center mb-2">Confirm Your Plan</h3>

            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-neutral-400 mb-1">Selected Plan</p>
              <p className="text-xl font-bold text-white">{selectedPlan.display_name}</p>
              <p className="text-sm text-amber-400 mt-2">
                {formatPrice(selectedPlan.price)}{" "}
                {PLAN_PERIOD[selectedPlan.name] !== "Forever" ? PLAN_PERIOD[selectedPlan.name] : "· Forever Free"}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-400">Next Step</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Please verify your email and log in. Your selected plan will be activated after login.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleConfirm}>
                <span className="flex items-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; opacity: 0; }
      `}</style>
    </>
  );
}
