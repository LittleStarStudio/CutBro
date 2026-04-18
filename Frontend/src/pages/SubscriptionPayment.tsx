import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw, Shield, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import { checkoutPlan, activatePlan } from "@/services/owner.service";

/* ── Midtrans Snap type declared in src/type/midtrans.d.ts ── */

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return "Rp " + price.toLocaleString("id-ID");
}

const PLAN_PERIOD: Record<string, string> = {
  free:    "Forever",
  pro:     "/month",
  premium: "/month",
};

export default function SubscriptionPayment() {
  const navigate    = useNavigate();
  const initialized = useRef(false);

  const [status, setStatus]     = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const planId      = sessionStorage.getItem("chosen_plan_id");
  const planName    = sessionStorage.getItem("chosen_plan_name");
  const planLabel   = sessionStorage.getItem("chosen_plan_display_name") ?? planName ?? "-";
  const planPrice   = sessionStorage.getItem("chosen_plan_price") ? Number(sessionStorage.getItem("chosen_plan_price")) : null;
  const period      = PLAN_PERIOD[planName ?? ""] ?? "/month";

  useEffect(() => {
    if (!planId) navigate("/owner", { replace: true });
  }, [planId, navigate]);

  const clearPlanSession = () => {
    sessionStorage.removeItem("chosen_plan_id");
    sessionStorage.removeItem("chosen_plan_name");
    sessionStorage.removeItem("chosen_plan_display_name");
    sessionStorage.removeItem("chosen_plan_price");
  };

  const loadPayment = async () => {
    if (!planId) return;

    setStatus("loading");
    setErrorMsg(null);

    document.getElementById("midtrans-script")?.remove();

    try {
      const res = await checkoutPlan(Number(planId));

      if (!res.snap_token) {
        setErrorMsg("Failed to get payment token. Please try again.");
        setStatus("error");
        return;
      }

      const currentOrderId = res.order_id ?? "";   // ← tambah baris ini

      const script = document.createElement("script");
      script.id  = "midtrans-script";
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY);

      script.onload = () => {
        const container = document.getElementById("snap-container");
        if (container) container.innerHTML = "";

        setStatus("ready");

        if (!window.snap) {
          setErrorMsg("Payment gateway failed to load. Please refresh.");
          setStatus("error");
          return;
        }

        window.snap.embed(res.snap_token!, {
          embedId: "snap-container",
          onSuccess: async () => {
            try {
              await activatePlan(currentOrderId);
            } catch { /* webhook Midtrans sebagai fallback di production */ }
            clearPlanSession();
            navigate("/owner", { replace: true });
          },
          onError: () => {
            setErrorMsg("Payment failed. Please try again.");
            setStatus("error");
          },
          onClose: () => {
            setErrorMsg("Payment was cancelled. You can try again.");
            setStatus("error");
          },
        });
      };

      script.onerror = () => {
        setErrorMsg("Failed to load payment gateway. Please check your connection.");
        setStatus("error");
      };

      document.body.appendChild(script);

    } catch {
      setErrorMsg("Could not initiate payment. Please try again.");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (planId) loadPayment();
    return () => { document.getElementById("midtrans-script")?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!planId) return null;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">

      {/* Top bar */}
      <div className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between shrink-0">
        <span className="text-xl font-bold text-white">
          Cut<span className="text-amber-400">Bro</span>
        </span>
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Secure Payment</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full px-4 lg:pl-6 lg:pr-8 py-6 flex flex-col lg:flex-row gap-6 lg:items-start">

        {/* Left — Snap / Status */}
        <div className="w-full min-h-[680px] flex justify-center lg:block">

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center h-96 text-neutral-400">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
              <p className="text-sm">Loading payment gateway...</p>
            </div>
          )}

          {status === "error" && (
            <div className="max-w-md mx-auto mt-16 space-y-4">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/owner")}>
                  Go to Dashboard
                </Button>
                <Button variant="gold" className="flex-1" onClick={loadPayment}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </div>
            </div>
          )}

        <div
            id="snap-container"
            style={{ display: status === "ready" ? "block" : "none" }}
            className="mx-auto lg:mx-0"
          />
        </div>

        {/* Right — Order Summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sticky top-8">

            <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Plan</span>
                <span className="text-white font-semibold capitalize">{planLabel}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Duration</span>
                <span className="text-white">{period === "Forever" ? "Forever" : "1 Month"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-white">
                  {planPrice !== null ? formatPrice(planPrice) : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Tax</span>
                <span className="text-emerald-400">Rp 0</span>
              </div>
            </div>

            <div className="border-t border-neutral-700 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Total</span>
                <span className="text-amber-400 font-bold text-lg">
                  {planPrice !== null ? formatPrice(planPrice) : "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Payments are secured and encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Powered by Midtrans</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        #snap-container iframe {
          min-height: 680px !important;
          border: none !important;
          border-radius: 16px !important;
        }

        @media (min-width: 1024px) {
          #snap-container iframe {
            width: 100% !important;
            min-width: 100% !important;
          }
          #snap-container > div {
            width: 100% !important;
          }
        }
      `}</style>

    </div>
  );

}
