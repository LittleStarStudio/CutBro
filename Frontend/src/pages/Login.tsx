import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, AlertCircle, X } from "lucide-react";

import Button from "@/components/ui/Button";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";

import { login, getRoleDashboard, type User } from "@/lib/auth";

/* ================= DUMMY ACCOUNTS ================= */
// Akun valid untuk testing:
// ┌──────────────────────────┬─────────────┬──────────┐
// │ Email                    │ Password    │ Role     │
// ├──────────────────────────┼─────────────┼──────────┤
// │ customer@example.com     │ password123 │ customer │
// │ admin@example.com        │ password123 │ admin    │
// │ owner@example.com        │ password123 │ owner    │
// │ barber@example.com       │ password123 │ barber   │
// └──────────────────────────┴─────────────┴──────────┘

const DUMMY_ACCOUNTS: { email: string; password: string; role: User["role"] }[] = [
  { email: "customer@example.com", password: "password123", role: "customer" },
  { email: "admin@example.com",    password: "password123", role: "admin"    },
  { email: "owner@example.com",    password: "password123", role: "owner"    },
  { email: "barber@example.com",   password: "password123", role: "barber"   },
];

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

/* ================= MAIN COMPONENT ================= */
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ── 1. Validasi format ──
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email.trim());
      const isPasswordLongEnough = password.length >= 8;

      if (!isValidFormat && !isPasswordLongEnough) {
        setError("Invalid email address and password. Please check your credentials and try again.");
        return;
      }
      if (!isValidFormat) {
        setError("Invalid email address. Please enter a valid email.");
        return;
      }
      if (!isPasswordLongEnough) {
        setError("Password must be at least 8 characters.");
        return;
      }

      // ── 2. Simulasi delay network ──
      await new Promise((r) => setTimeout(r, 800));

      // ── 3. Cek dummy accounts ──
      const matched = DUMMY_ACCOUNTS.find(
        (acc) =>
          acc.email.toLowerCase() === email.trim().toLowerCase() &&
          acc.password === password
      );

      if (!matched) {
        const emailExists = DUMMY_ACCOUNTS.some(
          (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (emailExists) {
          setError("Incorrect password. Please try again.");
        } else {
          setError("No account found with this email address.");
        }
        return;
      }

      // ── 4. Login sukses ──
      const user: User = {
        name: matched.email.split("@")[0],
        email: matched.email,
        role: matched.role,
        avatar: undefined
      };

      login(user);
      navigate(getRoleDashboard(user.role), { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="" selectedRole={null} onBack={() => {}}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>

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
          placeholder="customer@example.com"
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
          {loading ? "Processing..." : "Login"}
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