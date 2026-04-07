import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Store, AlertCircle, X, Phone } from "lucide-react";
import axios from "axios";

import Button from "@/components/ui/Button";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";
import GoogleButton from "@/components/auth/GoogleButton";
import Divider from "@/components/auth/Divider";

import { useRoleGuard } from "@/hooks/useAuth";
import { registerOwner, registerCustomer } from "@/services/auth.service";

/* ================= TYPES ================= */
type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  barbershop_name: string;
  phone: string;
};

type Errors = Partial<FormData>;

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

/* ================= COMPONENT ================= */
export default function Register() {
  const navigate = useNavigate();
  const { selectedRole, backToRoleSelect } = useRoleGuard();

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    barbershop_name: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ================= INPUT HANDLER ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setBannerError(null);
  };

  /* ================= VALIDATION ================= */
  const validate = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors: Errors = {};

    if (!form.name.trim()) {
      newErrors.name = "Full name is required.";
    }
    if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (selectedRole === "owner" && !form.barbershop_name.trim()) {
      newErrors.barbershop_name = "Barbershop name is required.";
    }
    if (selectedRole === "owner") {
      if (!form.phone.trim()) {
        newErrors.phone = "Phone number is required.";
      } else if (!/^(08|\+628)[0-9]{8,11}$/.test(form.phone.trim())) {
        newErrors.phone = "Enter a valid Indonesian phone number (e.g. 08123456789).";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setBannerError("Please fix the errors below before continuing.");
      return false;
    }

    return true;
  };

  /* ================= REDIRECT LOGIC ================= */
  const redirectAfterRegister = () => {
    if (selectedRole === "owner") {
      sessionStorage.setItem("registeredOwner", "true");
      navigate("/pricing", { replace: true });
    } else {
      navigate("/login?registered=true", { replace: true });
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (selectedRole === "owner") {
        await registerOwner({
          name:            form.name.trim(),
          email:           form.email.trim(),
          password:        form.password,
          barbershop_name: form.barbershop_name.trim(),
          phone:           form.phone.trim(),
        });
      } else {
        await registerCustomer({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }

      redirectAfterRegister();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 422) {
            const serverErrors = err.response?.data?.errors as Record<string, string[]> | undefined;
            if (serverErrors) {
              const mapped: Errors = {};
              if (serverErrors.name) mapped.name = serverErrors.name[0];
              if (serverErrors.email) mapped.email = serverErrors.email[0];
              if (serverErrors.password) mapped.password = serverErrors.password[0];
              if (serverErrors.barbershop_name) mapped.barbershop_name = serverErrors.barbershop_name[0];
              if (serverErrors.phone) mapped.phone = serverErrors.phone[0];
              setErrors(mapped);
              setBannerError("Please fix the errors below before continuing.");
            } else {
              setBannerError(message ?? "Validation failed. Please check your input.");
            }

        } else if (status === 500) {
          setBannerError("Server error. Please try again or contact support.");
        } else {
          setBannerError(message ?? "Something went wrong. Please try again.");
        }
      } else {
        setBannerError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= GOOGLE REGISTER ================= */
  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/redirect`;
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up as"
      selectedRole={selectedRole}
      onBack={backToRoleSelect}
    >
      <div className="space-y-6">
        <GoogleButton onClick={handleGoogleRegister} />
        <Divider />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Error Banner */}
          {bannerError && (
            <ErrorBanner message={bannerError} onClose={() => setBannerError(null)} />
          )}

          <FormInput
            label="Full Name"
            icon={User}
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            error={errors.name}
          />

          <FormInput
            label="Email"
            icon={Mail}
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
          />

          {/* Field barbershop hanya untuk owner */}
          {selectedRole === "owner" && (
            <FormInput
              label="Barbershop Name"
              icon={Store}
              name="barbershop_name"
              type="text"
              value={form.barbershop_name}
              onChange={handleChange}
              placeholder="Enter your barbershop name"
              error={errors.barbershop_name}
            />
          )}

          {/* Field phone hanya untuk owner */}
          {selectedRole === "owner" && (
            <FormInput
              label="Phone Number"
              icon={Phone}
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 08123456789"
              error={errors.phone}
            />
          )}

          <PasswordInput
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            error={errors.password}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            error={errors.confirmPassword}
          />

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-sm text-neutral-400 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-400 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
