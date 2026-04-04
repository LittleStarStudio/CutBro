import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, AlertCircle, X, MailCheck } from "lucide-react";
import axios from "axios";

import Button from "@/components/ui/Button";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";

import { login as apiLogin } from "@/services/auth.service";
import { useAuth } from "@/components/context/AuthContext";
import { getRoleDashboard } from "@/lib/auth";

/* ================= ERROR BANNER ================= */
function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="text-red-400/60 hover:text-red-400 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ================= INFO BANNER ================= */
function InfoBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-in fade-in slide-in-from-top-2 duration-300">
      <MailCheck className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="text-amber-400/60 hover:text-amber-400 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    searchParams.get("registered") === "true"
      ? "Registration successful! Please check your email and verify your account before logging in."
      : null
  );

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await apiLogin({ email: email.trim(), password });
      setUser(user);
      navigate(getRoleDashboard(user.role), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (!err.response) {
          setError("Cannot connect to server. Please check your connection.");
        } else if (status === 401) {
          setError("Email or password is incorrect.");
        } else if (status === 403) {
          setError(message ?? "Your account is not allowed to login.");
        } else if (status === 423) {
          setError(message ?? "Your account is temporarily locked. Please try again later.");
        } else if (status === 422) {
          const errors = err.response?.data?.errors;
          const first = errors ? Object.values(errors).flat()[0] : message;
          setError(typeof first === "string" ? first : "Please check your input.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="" selectedRole={null} onBack={() => {}}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>

        {/* Info Banner — verifikasi email setelah register */}
        {info && (
          <InfoBanner message={info} onClose={() => setInfo(null)} />
        )}

        {/* Error Banner */}
        {error && (
          <ErrorBanner message={error} onClose={() => setError(null)} />
        )}

        <FormInput
          label="Email"
          icon={Mail}
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
        />

        <div className="space-y-2">
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
          />

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-amber-400 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>

        <p className="text-center text-sm text-neutral-400">
          Don't have an account?{" "}
          <Link to="/roleselect" className="text-amber-400 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
