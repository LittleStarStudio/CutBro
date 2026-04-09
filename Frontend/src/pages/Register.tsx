import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Store, AlertCircle, X, Phone, MapPin, Building2 } from "lucide-react";
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
  address: string;
  city: string;
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

const INDONESIAN_CITIES = [
  "Ambon", "Balikpapan", "Banda Aceh", "Bandar Lampung", "Banjarmasin",
  "Batam", "Bekasi", "Bogor", "Cimahi", "Cirebon",
  "Denpasar", "Depok", "Jakarta", "Jambi", "Jayapura",
  "Kediri", "Kupang", "Madiun", "Makassar", "Malang",
  "Manado", "Mataram", "Medan", "Padang", "Palangkaraya",
  "Palembang", "Pekanbaru", "Pontianak", "Samarinda", "Semarang",
  "Serang", "Solo", "Surabaya", "Surakarta", "Tangerang",
  "Tangerang Selatan", "Tasikmalaya", "Yogyakarta",
];

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
    address: "",
    city: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);   
  const cityRef = useRef<HTMLDivElement>(null);            

  /* ================= INPUT HANDLER ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setBannerError(null);
  };

    /* ================= CITY DROPDOWN ================= */
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
          setCityOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

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
    if (selectedRole === "owner") {
      if (!form.address.trim()) {
        newErrors.address = "Address is required.";
      }
      if (!form.city.trim()) {
        newErrors.city = "City is required.";
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
          address:         form.address.trim(),
          city:            form.city.trim(),
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
              if (serverErrors.address) mapped.address = serverErrors.address[0];
              if (serverErrors.city)    mapped.city    = serverErrors.city[0];
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

          {/* Address | City — owner only, 2 kolom */}
          {selectedRole === "owner" && (
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Address"
                icon={MapPin}
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder="Street address"
                error={errors.address}
              />

              {/* City — custom dropdown selalu buka ke bawah */}
              <div ref={cityRef} className="relative">
                <label className="text-sm text-neutral-300 font-medium">City</label>
                <div className="relative mt-2">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <button
                    type="button"
                    onClick={() => setCityOpen((prev) => !prev)}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border text-left text-sm
                      focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                      transition-colors
                      ${errors.city ? "border-red-500" : "border-neutral-800"}
                      ${form.city ? "text-white" : "text-neutral-600"}
                    `}
                  >
                    {form.city || "Select city"}
                  </button>

                  {cityOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-xl">
                      <div className="max-h-44 overflow-y-auto">
                        {INDONESIAN_CITIES.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, city }));
                              setErrors((prev) => ({ ...prev, city: undefined }));
                              setBannerError(null);
                              setCityOpen(false);
                            }}
                            className={`
                              w-full text-left px-4 py-2 text-sm transition-colors
                              ${form.city === city
                                ? "bg-amber-500/20 text-amber-400"
                                : "text-neutral-300 hover:bg-neutral-800"}
                            `}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {errors.city && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.city}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Password | Confirm Password — 2 kolom untuk owner, stacked untuk customer */}
          {selectedRole === "owner" ? (
            <div className="grid grid-cols-2 gap-3">
              <PasswordInput
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                error={errors.password}
              />
              <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                error={errors.confirmPassword}
              />
            </div>
          ) : (
            <>
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
            </>
          )}

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
