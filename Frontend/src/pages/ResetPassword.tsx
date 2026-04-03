import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";

import Button from "@/components/ui/Button";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";

/* ================= TYPES ================= */
type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<FormData>;

/* ================= COMPONENT ================= */
export default function ResetPassword() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // ✅ state sukses

  /* ================= INPUT HANDLER ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 🔥 Simulate reset password API request
      await new Promise((r) => setTimeout(r, 1000));

      // ❌ HAPUS navigate ke login
      // navigate("/login?reset=success");

      // ✅ Tampilkan halaman sukses
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new password for your account"
      selectedRole={null}
      onBack={() => navigate("/login")}
    >
      {isSuccess ? (
        /* ================= SUCCESS STATE ================= */
        <div className="text-center space-y-6">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />

          <h3 className="text-lg font-semibold text-white">
            Password Reset Successful
          </h3>

          <p className="text-sm text-neutral-400">
            Your password has been updated successfully.
            <br />
            Please log in using your new password.
          </p>

          <Button
            variant="gold"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </div>
      ) : (
        /* ================= FORM ================= */
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email"
            icon={Mail}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            required
          />

          <PasswordInput
            label="New Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            error={errors.password}
            required
          />

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat new password"
            error={errors.confirmPassword}
            required
          />

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Resetting password..." : "Reset Password"}
          </Button>

          <p className="text-sm text-neutral-400 text-center">
            Remember your password?{" "}
            <Link to="/login" className="text-amber-400 font-semibold">
              Back to Login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
