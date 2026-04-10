import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, MailCheck, Scissors } from "lucide-react";
import Button from "@/components/ui/Button";

type Status = "success" | "already_verified" | "invalid" | null;

const CONFIG: Record<
  NonNullable<Status>,
  { icon: React.ReactNode; title: string; desc: string; color: string }
> = {
  success: {
    icon: <CheckCircle className="w-14 h-14 text-green-500" />,
    title: "Email Verified!",
    desc: "Your email has been verified successfully. You can now log in to your account.",
    color: "text-green-400",
  },
  already_verified: {
    icon: <MailCheck className="w-14 h-14 text-amber-400" />,
    title: "Already Verified",
    desc: "Your email was already verified before. You can log in directly.",
    color: "text-amber-400",
  },
  invalid: {
    icon: <XCircle className="w-14 h-14 text-red-500" />,
    title: "Invalid Link",
    desc: "This verification link is invalid or has expired. Please register again or contact support.",
    color: "text-red-400",
  },
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const status = searchParams.get("status") as Status;
  const cfg    = status ? CONFIG[status] : null;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">CutBro</h2>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6">

          {cfg ? (
            <>
              <div className="flex justify-center">{cfg.icon}</div>

              <div className="space-y-2">
                <h3 className={`text-xl font-bold ${cfg.color}`}>{cfg.title}</h3>
                <p className="text-sm text-neutral-400">{cfg.desc}</p>
              </div>

              <Button
                variant="gold"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </>
          ) : (
            /* Status tidak dikenal / akses langsung tanpa param */
            <>
              <XCircle className="w-14 h-14 text-neutral-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-300">Nothing to show</h3>
                <p className="text-sm text-neutral-400">
                  This page is only accessible via an email verification link.
                </p>
              </div>
              <Button
                variant="gold"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
