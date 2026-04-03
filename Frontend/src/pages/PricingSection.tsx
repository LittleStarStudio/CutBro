import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Crown, 
  Users, 
  TrendingUp,
  Shield,
  Star,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= DATA ================= */
const plans = [
  {
    name: "Free",
    price: "Free",
    period: "Forever",
    description: "Perfect for small barbershops just getting started",
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    features: [
      { text: "1 Barber", included: true },
      { text: "Online Booking", included: true },
      { text: "Basic Reports", included: true },
      { text: "Email Notifications", included: true },
      { text: "WhatsApp Notifications", included: false },
      { text: "Priority Support", included: false },
    ],
    cta: "Start Free",
    popular: false,
    borderColor: "border-neutral-800",
    gradient: "from-blue-500/5 to-transparent",
  },
  {
    name: "Pro",
    price: "Rp 299K",
    period: "/month",
    description: "For growing barbershops that need more power",
    icon: TrendingUp,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    features: [
      { text: "5 Barbers", included: true },
      { text: "All Free Features", included: true },
      { text: "WhatsApp Notifications", included: true },
      { text: "Digital Payment Integration", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Priority Support", included: true },
    ],
    cta: "Choose Pro",
    popular: true,
    borderColor: "border-amber-500",
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    name: "Premium",
    price: "Rp 599K",
    period: "/month",
    description: "For large barbershops & franchises",
    icon: Crown,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    features: [
      { text: "Unlimited Barbers", included: true },
      { text: "All Pro Features", included: true },
      { text: "Multi Branch Management", included: true },
      { text: "API Access", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "Custom Integrations", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
    borderColor: "border-purple-500/50",
    gradient: "from-purple-500/10 to-transparent",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  /* ================= GUARD ================= */
  useEffect(() => {
    const role = sessionStorage.getItem("selectedRole");
    const registered = sessionStorage.getItem("registeredOwner") === "true";

    if (role !== "owner" || !registered) {
      navigate("/register", { replace: true });
    }
  }, [navigate]);

  /* ================= HANDLERS ================= */
  const handleChoosePlan = (plan: string) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePay = () => {
    if (!selectedPlan) return;

    sessionStorage.setItem("selectedPlan", selectedPlan);
    sessionStorage.setItem("paymentSuccess", "true");

    navigate("/login", { replace: true });
  };

  /* ================= UI ================= */
  return (
    <>
      {/* Background with gradient mesh */}
      <div className="fixed inset-0 -z-10 bg-neutral-950">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950" />
      </div>

      <section className="relative py-24 min-h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-16 space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-bold">
                Choose Your Perfect Plan
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Simple,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Transparent
              </span>{" "}
              Pricing
            </h1>

            {/* Subtitle */}
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Start for free, upgrade as you grow. No hidden fees, cancel anytime.
            </p>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Star className="w-4 h-4 text-purple-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>

          {/* ================= PRICING CARDS ================= */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isHovered = hoveredPlan === plan.name;

              return (
                <div
                  key={plan.name}
                  onMouseEnter={() => setHoveredPlan(plan.name)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className={cn(
                    "group relative bg-gradient-to-br border rounded-3xl p-8 transition-all duration-500",
                    plan.gradient,
                    plan.popular
                      ? "border-amber-500 shadow-2xl shadow-amber-500/20 scale-105 md:scale-110 z-10"
                      : plan.borderColor,
                    isHovered && !plan.popular && "scale-105 shadow-xl",
                    "animate-fade-in"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 blur-lg opacity-50" />
                        <div className="relative bg-gradient-to-r from-amber-400 to-amber-600 text-black px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                          <Crown className="w-4 h-4" />
                          MOST POPULAR
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Glow effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10",
                    plan.popular 
                      ? "bg-gradient-to-br from-amber-500/10 to-transparent blur-xl" 
                      : "bg-gradient-to-br from-neutral-700/10 to-transparent blur-xl"
                  )} />

                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500",
                    plan.iconBg,
                    isHovered && "scale-110 rotate-6"
                  )}>
                    <Icon className={cn("w-7 h-7", plan.iconColor)} />
                  </div>

                  {/* Plan name */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-neutral-400 mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white">
                        {plan.price}
                      </span>
                      {plan.period !== "Forever" && (
                        <span className="text-neutral-400 text-sm">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    {plan.period === "Forever" && (
                      <span className="text-emerald-400 text-sm font-semibold">
                        No credit card required
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          "flex items-start gap-3 text-sm transition-all duration-300",
                          feature.included 
                            ? "text-neutral-200" 
                            : "text-neutral-600"
                        )}
                        style={{
                          animationDelay: `${(index * 100) + (idx * 50)}ms`,
                        }}
                      >
                        {feature.included ? (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center">
                            <X className="w-3 h-3 text-neutral-600" />
                          </div>
                        )}
                        <span className={feature.included ? "font-medium" : "line-through"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      "w-full group/btn relative overflow-hidden transition-all duration-300",
                      plan.popular && "shadow-lg shadow-amber-500/25"
                    )}
                    variant={plan.popular ? "gold" : "default"}
                    onClick={() => handleChoosePlan(plan.name)}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </span>
                    
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* ================= FOOTER NOTE ================= */}
          <div className="text-center mt-16 space-y-3">
            <p className="text-neutral-500 text-sm">
              All plans include 14-day free trial • No credit card required
            </p>
            <p className="text-neutral-600 text-xs">
              Need a custom plan?{" "}
              <button className="text-amber-400 hover:underline">
                Contact our sales team
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* ================= PAYMENT MODAL ================= */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl animate-scale-in">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5 -z-10" />
            
            {/* Close button */}
            <button
              onClick={() => setShowPayment(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              Confirm Your Plan
            </h3>

            {/* Selected plan */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-neutral-400 mb-1">Selected Plan</p>
              <p className="text-xl font-bold text-white">{selectedPlan}</p>
              <p className="text-sm text-amber-400 mt-2">
                {plans.find((p) => p.name === selectedPlan)?.price}{" "}
                {plans.find((p) => p.name === selectedPlan)?.period}
              </p>
            </div>

            {/* Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-400">
                    Demo Payment
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    This is a simulated payment. No real transaction will occur.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPayment(false)}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1 shadow-lg shadow-amber-500/25"
                onClick={handlePay}
              >
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CUSTOM ANIMATIONS ================= */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}