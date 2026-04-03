import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "@/lib/auth";
import Button from "@/components/ui/Button";
import {
  Crown,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCw,
  ChevronUp,
  X,
  Calendar,
  Receipt,
  Zap,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */
interface PaymentHistory {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: "success" | "failed" | "pending";
}

/* ================= MOCK DATA ================= */
const currentPlanData = {
  name: "Pro",
  price: "Rp 299K",
  period: "/month",
  expiredDate: "2025-04-10",
  daysLeft: 7,
  features: [
    "5 Barbers",
    "Online Booking",
    "WhatsApp Notifications",
    "Digital Payment Integration",
    "Advanced Analytics",
    "Priority Support",
  ],
};

const upgradePlans = [
  {
    name: "Free",
    price: "Free",
    period: "Forever",
    description: "For small barbershops just getting started",
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    borderColor: "border-neutral-700",
    gradient: "from-blue-500/5 to-transparent",
    cta: "Downgrade",
    isDowngrade: true,
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 299K",
    period: "/month",
    description: "Your current active plan",
    icon: TrendingUp,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500",
    gradient: "from-amber-500/10 to-transparent",
    cta: "Renew",
    isDowngrade: false,
    highlight: true,
  },
  {
    name: "Premium",
    price: "Rp 599K",
    period: "/month",
    description: "For large barbershops & franchises",
    icon: Crown,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/50",
    gradient: "from-purple-500/10 to-transparent",
    cta: "Upgrade",
    isDowngrade: false,
    highlight: false,
  },
];

const paymentHistory: PaymentHistory[] = [
  { id: "INV-2025-003", date: "10 Mar 2025", plan: "Pro",  amount: "Rp 299.000", status: "success" },
  { id: "INV-2025-002", date: "10 Feb 2025", plan: "Pro",  amount: "Rp 299.000", status: "success" },
  { id: "INV-2025-001", date: "10 Jan 2025", plan: "Pro",  amount: "Rp 299.000", status: "success" },
  { id: "INV-2024-012", date: "10 Dec 2024", plan: "Free", amount: "Rp 0",       status: "success" },
  { id: "INV-2024-011", date: "10 Nov 2024", plan: "Free", amount: "Rp 0",       status: "success" },
];

/* ================= HELPERS ================= */
const statusConfig = {
  success: {
    label: "Success",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
    icon: X,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    icon: Clock,
  },
};

export default function Billing() {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  /* ================= GUARD ================= */
  useEffect(() => {
    const user = getUser();
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ================= DERIVED ================= */
  const daysLeft = currentPlanData.daysLeft;
  const isExpiringSoon = daysLeft <= 7;
  const isExpired = daysLeft <= 0;
  const displayedHistory = showAllHistory ? paymentHistory : paymentHistory.slice(0, 3);

  /* ================= HANDLERS ================= */
  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (!selectedPlan) return;
    sessionStorage.setItem("selectedPlan", selectedPlan);
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/owner", { replace: true });
  };

  /* ================= UI ================= */
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-neutral-950">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950" />
      </div>

      <section className="relative py-12 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 space-y-10">

          {/* ================= HEADER ================= */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 backdrop-blur-sm mb-4">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-bold">Manage Subscription</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Billing &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Plans
              </span>
            </h1>
            <p className="text-neutral-400 mt-2">
              Manage your subscription plan and payment history here.
            </p>
          </div>

          {/* ================= EXPIRY WARNING BANNER ================= */}
          {isExpiringSoon && (
            <div
              className={cn(
                "flex items-start gap-4 p-5 rounded-2xl border animate-fade-in",
                isExpired ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/10 border-amber-500/30"
              )}
              style={{ animationDelay: "100ms" }}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isExpired ? "bg-red-500/20" : "bg-amber-500/20")}>
                <AlertTriangle className={cn("w-5 h-5", isExpired ? "text-red-400" : "text-amber-400 animate-pulse")} />
              </div>
              <div className="flex-1">
                <p className={cn("font-semibold", isExpired ? "text-red-400" : "text-amber-400")}>
                  {isExpired ? "Your plan has expired!" : `Your plan expires in ${daysLeft} days!`}
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  {isExpired
                    ? "Renew now to restore full access to your features."
                    : "Renew soon to avoid any interruption to your service."}
                </p>
              </div>
              <Button
                variant="gold"
                className="flex-shrink-0 shadow-lg shadow-amber-500/25"
                onClick={() => handleSelectPlan(currentPlanData.name)}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Renew Now
                </span>
              </Button>
            </div>
          )}

          {/* ================= CURRENT PLAN ================= */}
          <div
            className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-3xl p-8 animate-fade-in"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    ACTIVE PLAN
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">{currentPlanData.name}</h2>
                  <p className="text-amber-400 font-semibold">
                    {currentPlanData.price}
                    <span className="text-neutral-400 font-normal text-sm">{currentPlanData.period}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Calendar className="w-4 h-4" />
                  <span>Expires on <span className="text-white font-medium">{currentPlanData.expiredDate}</span></span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full",
                  isExpired ? "bg-red-500/10 text-red-400" : isExpiringSoon ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  {isExpired ? "Expired" : `${daysLeft} days remaining`}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-3">Active Features</p>
              <div className="flex flex-wrap gap-2">
                {currentPlanData.features.map((f) => (
                  <span key={f} className="text-xs text-neutral-300 bg-neutral-800 border border-neutral-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ================= CHANGE PLAN ================= */}
          <div style={{ animationDelay: "200ms" }} className="animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-2">Change Plan</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Renew your current plan or switch to one that better fits your needs.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {upgradePlans.map((plan, index) => {
                const Icon = plan.icon;
                const isCurrent = plan.name === currentPlanData.name;
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      "relative bg-gradient-to-br border rounded-2xl p-6 transition-all duration-300 hover:scale-105",
                      plan.gradient, plan.borderColor,
                      isCurrent && "ring-2 ring-amber-500/50"
                    )}
                    style={{ animationDelay: `${200 + index * 80}ms` }}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-bold px-3 py-1 rounded-full">
                          ACTIVE
                        </span>
                      </div>
                    )}
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", plan.iconBg)}>
                      <Icon className={cn("w-6 h-6", plan.iconColor)} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-neutral-400 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period !== "Forever" && (
                        <span className="text-neutral-400 text-sm ml-1">{plan.period}</span>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      variant={plan.highlight ? "gold" : "default"}
                      onClick={() => handleSelectPlan(plan.name)}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isCurrent && <RefreshCw className="w-4 h-4" />}
                        {!isCurrent && !plan.isDowngrade && <ChevronUp className="w-4 h-4" />}
                        {plan.cta}
                        {!isCurrent && <ArrowRight className="w-4 h-4" />}
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= PAYMENT HISTORY ================= */}
          <div style={{ animationDelay: "300ms" }} className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Payment History</h2>
                <p className="text-sm text-neutral-400">All your subscription transactions</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-neutral-400" />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 px-6 py-3 bg-neutral-800/50 border-b border-neutral-800">
                {["Invoice", "Date", "Plan & Amount", "Status"].map((h) => (
                  <span key={h} className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {displayedHistory.map((item, index) => {
                const status = statusConfig[item.status];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 px-6 py-4 border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors items-center"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <span className="text-sm text-neutral-300 font-mono">{item.id}</span>
                    <span className="text-sm text-neutral-400">{item.date}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.plan}</p>
                      <p className="text-xs text-neutral-500">{item.amount}</p>
                    </div>
                    <div>
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", status.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              {paymentHistory.length > 3 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full py-4 text-sm text-neutral-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  {showAllHistory
                    ? (<>Show less <ChevronUp className="w-4 h-4" /></>)
                    : (<>View all ({paymentHistory.length} transactions) <ArrowRight className="w-4 h-4" /></>)
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONFIRM MODAL ================= */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5 -z-10" />
            <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {selectedPlan === currentPlanData.name
                ? "Renew Plan"
                : `${selectedPlan === "Free" ? "Downgrade" : "Upgrade"} to ${selectedPlan}`}
            </h3>
            <p className="text-neutral-400 text-sm text-center mb-6">
              {selectedPlan === currentPlanData.name
                ? "Your plan will be extended by 1 month."
                : `Your plan will be changed to ${selectedPlan}.`}
            </p>
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-neutral-400">Selected plan</p>
                  <p className="text-xl font-bold text-white">{selectedPlan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-400">Total</p>
                  <p className="text-xl font-bold text-amber-400">
                    {upgradePlans.find((p) => p.name === selectedPlan)?.price}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-400">Demo Payment</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    This is a simulated payment. No real transaction will occur.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1 shadow-lg shadow-amber-500/25" onClick={handleConfirm}>
                <span className="flex items-center gap-2">Confirm <ArrowRight className="w-4 h-4" /></span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccessModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl animate-scale-in text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent -z-10" />

            {/* Animated check icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="w-5 h-5 text-amber-400" />
              <h3 className="text-2xl font-bold text-white">Payment Successful!</h3>
              <PartyPopper className="w-5 h-5 text-amber-400 scale-x-[-1]" />
            </div>

            <p className="text-neutral-400 text-sm mb-6">
              {selectedPlan === currentPlanData.name
                ? `Your ${selectedPlan} plan has been successfully renewed for another month.`
                : `You have successfully switched to the ${selectedPlan} plan.`}
            </p>

            {/* Transaction summary */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Transaction Summary</span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Paid
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Plan</span>
                  <span className="text-white font-semibold">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Amount</span>
                  <span className="text-amber-400 font-bold">
                    {upgradePlans.find((p) => p.name === selectedPlan)?.price}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Valid until</span>
                  <span className="text-white font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Button variant="gold" className="w-full shadow-lg shadow-amber-500/25" onClick={handleSuccessClose}>
              <span className="flex items-center justify-center gap-2">
                Back to Dashboard
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* ================= ANIMATIONS ================= */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
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