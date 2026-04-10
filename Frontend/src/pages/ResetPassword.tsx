import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";

import Button from "@/components/ui/Button";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";
import { resetPassword } from "@/services/auth.service";

/* ================= TYPES ================= */
type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<FormData & { general: string }>;

/* ================= COMPONENT ================= */
export default function ResetPassword() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const token        = searchParams.get("token") ?? "";
  const emailFromUrl = searchParams.get("email") ?? "";

  /* ================= STATE ================= */
  const [form, setForm] = useState<FormData>({
    email:           emailFromUrl,
    password:        "",
    confirmPassword: "",
  });

  const [errors,    setErrors]    = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /* ================= INPUT HANDLER ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }));
  };

  /* ================= VALIDATION ================= */
  const validate = (): boolean => {
    const errs: Errors = {};
    if (!form.email)              errs.email           = "Email is required";
    if (form.password.length < 6) errs.password        = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
                                  errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await resetPassword({
        token,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid or expired token. Please request a new link.";
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */
  if (!token) {
    return (
      <AuthLayout title="Reset Password" selectedRole={null}>
        <div className="text-center space-y-4">
          <p className="text-red-400 text-sm">
            This link is invalid or has expired.
            <br />
            Please request a new password reset link.
          </p>
          <Button variant="gold" className="w-full" onClick={() => navigate("/forgot-password")}>
            Request New Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
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
        <>
          <p className="text-sm text-neutral-400 text-center -mt-2 mb-2">
            Create a new password for your account
          </p>

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
            placeholder="Minimum 6 characters"
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

          {errors.general && (
            <p className="text-red-400 text-sm text-center">{errors.general}</p>
          )}

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
        </>
      )}
    </AuthLayout>
  );
}
