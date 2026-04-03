// File: src/components/profile/AdminProfileModal.tsx
import { useState, useEffect, useMemo } from "react";
import { Upload, Eye, EyeOff, Image, Type, Save, X, CheckCircle, AlertCircle } from "lucide-react";
import Modal from "@/components/admin/Modal";

export type AdminProfile = {
  name: string;
  email: string;
  photoPreview: string;
  password?: string;
  confirmPassword?: string;
  appLogo?: string;
  appName?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  data: AdminProfile;
  onSave: (data: AdminProfile) => void;
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl animate-[scaleIn_0.25s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-2xl opacity-30 scale-150" />
          <div className="relative w-20 h-20 bg-amber-500/10 border-2 border-amber-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-amber-400" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-white">Changes Saved!</h3>
          <p className="text-sm text-zinc-400">Your profile has been updated successfully.</p>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors">
          Got it
        </button>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Field Warning ────────────────────────────────────────────────────────────
function FieldWarning({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminProfileModal({ open, onClose, data, onSave }: Props) {
  const [form, setForm]                               = useState<AdminProfile>(data);
  const [photoFile, setPhotoFile]                     = useState<string | null>(null);
  const [logoFile, setLogoFile]                       = useState<string | null>(null);
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab]                     = useState<"profile" | "app">("profile");
  const [showSuccess, setShowSuccess]                 = useState(false);
  const [submitted, setSubmitted]                     = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...data, password: "", confirmPassword: "" });
      setPhotoFile(null);
      setLogoFile(null);
      setActiveTab("profile");
      setSubmitted(false);
    }
  }, [open, data]);

  // ── Detect changes ─────────────────────────────────────────────────────────
  const hasChanges = useMemo(() => {
    if (photoFile || logoFile) return true;
    if (form.name !== data.name) return true;
    if (form.appName !== data.appName) return true;
    if ((form.password?.length ?? 0) > 0) return true;
    if ((form.confirmPassword?.length ?? 0) > 0) return true;
    return false;
  }, [form, photoFile, logoFile, data]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "Name cannot be empty";

    const hasPassword = (form.password?.length ?? 0) > 0;
    const hasConfirm  = (form.confirmPassword?.length ?? 0) > 0;

    // Confirm filled but password empty
    if (hasConfirm && !hasPassword) {
      e.password = "Password cannot be empty if confirm is filled";
    } else if (hasPassword && (form.password?.length ?? 0) < 8) {
      e.password = `Password must be at least 8 characters (${form.password?.length}/8)`;
    }

    // Password filled and valid but confirm empty
    if (hasPassword && (form.password?.length ?? 0) >= 8 && !hasConfirm) {
      e.confirmPassword = "Confirm password cannot be empty";
    } else if (hasPassword && hasConfirm && form.confirmPassword !== form.password) {
      e.confirmPassword = "Passwords do not match";
    }

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!hasChanges || !isValid) return;

    const updatedData: AdminProfile = {
      ...form,
      photoPreview: photoFile || form.photoPreview,
      appLogo: logoFile || form.appLogo,
    };
    if (!form.password) {
      delete updatedData.password;
      delete updatedData.confirmPassword;
    }
    onSave(updatedData);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  // Realtime checks
  const passwordTooShort = (form.password?.length ?? 0) > 0 && (form.password?.length ?? 0) < 8;
  const confirmMismatch  = (form.confirmPassword?.length ?? 0) > 0 && form.confirmPassword !== form.password;

  return (
    <>
      <SuccessModal open={showSuccess} onClose={handleSuccessClose} />

      <Modal isOpen={open && !showSuccess} onClose={onClose} title="Admin Profile">
        <div className="space-y-0">

          {/* Tab switcher */}
          <div className="flex mb-6 bg-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "profile" ? "bg-amber-500 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Upload size={14} />
              My Profile
            </button>
            <button
              onClick={() => setActiveTab("app")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "app" ? "bg-amber-500 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              App Settings
            </button>
          </div>

          {/* === TAB: MY PROFILE === */}
          {activeTab === "profile" && (
            <div className="space-y-5">

              {/* Global warning banner */}
              {submitted && !isValid && (
                <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">
                    Please fix the empty or invalid fields before saving.
                  </p>
                </div>
              )}

              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4 p-5 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <img
                    src={photoFile || form.photoPreview || "/default-avatar.png"}
                    alt="Profile"
                    className="relative w-24 h-24 rounded-full object-cover border-4 border-amber-500/40 shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={16} className="text-white" />
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm">
                    <Upload size={14} />
                    Upload Photo
                  </div>
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  className={`w-full p-3 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                    submitted && errors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-zinc-700 focus:border-amber-500"
                  }`}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your name"
                />
                {submitted && errors.name && <FieldWarning message={errors.name} />}
              </div>

              {/* Email (disabled) */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="w-full p-3 rounded-lg bg-zinc-800 border-2 border-zinc-700 text-zinc-500 cursor-not-allowed"
                  value={form.email}
                  disabled
                />
                <p className="text-xs text-zinc-600 mt-1">Email cannot be changed</p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  New Password <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full p-3 pr-12 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                      passwordTooShort || (submitted && errors.password)
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-amber-500"
                    }`}
                    value={form.password || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value, confirmPassword: "" }))
                    }
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordTooShort ? (
                  <FieldWarning message={`Password must be at least 8 characters (${form.password?.length}/8)`} />
                ) : submitted && errors.password ? (
                  <FieldWarning message={errors.password} />
                ) : null}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full p-3 pr-12 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                      confirmMismatch || (submitted && errors.confirmPassword)
                        ? "border-red-500 focus:border-red-500"
                        : "border-zinc-700 focus:border-amber-500"
                    }`}
                    value={form.confirmPassword || ""}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmMismatch ? (
                  <FieldWarning message="Passwords do not match" />
                ) : submitted && errors.confirmPassword ? (
                  <FieldWarning message={errors.confirmPassword} />
                ) : (
                  <p className="text-xs text-zinc-500 mt-1">Leave blank to keep current password</p>
                )}
              </div>
            </div>
          )}

          {/* === TAB: APP SETTINGS === */}
          {activeTab === "app" && (
            <div className="space-y-6">

              {/* Global warning banner for app tab */}
              {submitted && !isValid && (
                <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">
                    Please fix the errors in the Profile tab before saving.
                  </p>
                </div>
              )}

              {/* App Logo */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <Image size={14} className="text-amber-400" />
                  App Logo
                </label>
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="w-16 h-16 rounded-xl bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center overflow-hidden shrink-0">
                    {logoFile || form.appLogo ? (
                      <img src={logoFile || form.appLogo} alt="App Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 font-medium mb-1">Upload new logo</p>
                    <p className="text-xs text-zinc-500 mb-3">PNG, SVG recommended • Min 64×64px</p>
                    <label className="cursor-pointer inline-flex">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <span className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                        <Upload size={12} />
                        Choose File
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* App Name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5 flex items-center gap-2">
                  <Type size={14} className="text-amber-400" />
                  App Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                  value={form.appName || ""}
                  onChange={(e) => setForm((p) => ({ ...p, appName: e.target.value }))}
                  placeholder="Enter application name"
                />
                <p className="text-xs text-zinc-500 mt-1">Shown in header, browser tab, and emails</p>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <X size={15} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm shadow-lg ${
                hasChanges
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 cursor-pointer"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Save size={15} />
              Save Changes
            </button>
          </div>

        </div>
      </Modal>
    </>
  );
}