import { useState, useRef } from "react";

type Role = "SuperAdmin" | "Admin" | "User";

interface UserData {
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  avatar: string;
  bio: string;
  role: Role;
  systemAccess: string;
  lastLogin: string;
}

interface AppSettings {
  appName: string;
  appLogo: string;
  primaryColor: string;
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onSave: (updatedUser: UserData) => void;
  onPasswordChange: (oldPassword: string, newPassword: string) => void;
  onAppSettingsChange: (settings: AppSettings) => void;
  appSettings: AppSettings;
}

type Tab = "profile" | "security" | "app";

const roleColors: Record<Role, string> = {
  SuperAdmin: "from-amber-400 to-yellow-300",
  Admin: "from-sky-400 to-blue-300",
  User: "from-emerald-400 to-teal-300",
};

const roleBadge: Record<Role, string> = {
  SuperAdmin: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Admin: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  User: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function UserProfile({
  isOpen,
  onClose,
  user,
  onSave,
  onPasswordChange,
  onAppSettingsChange,
  appSettings,
}: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [formData, setFormData] = useState({ ...user });
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [passwordData, setPasswordData] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [appForm, setAppForm] = useState({ ...appSettings });
  const [logoPreview, setLogoPreview] = useState(appSettings.appLogo);
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    onSave({ ...formData, avatar: avatarPreview });
  };

  const handlePasswordSubmit = () => {
    setPasswordError("");
    if (!passwordData.old || !passwordData.new || !passwordData.confirm) {
      setPasswordError("All fields are required.");
      return;
    }
    if (passwordData.new.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    onPasswordChange(passwordData.old, passwordData.new);
    setPasswordData({ old: "", new: "", confirm: "" });
  };

  const handleAppSave = () => {
    onAppSettingsChange({ ...appForm, appLogo: logoPreview });
  };

  const isSuperAdmin = user.role === "SuperAdmin";

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "security", label: "Security", icon: "🔒" },
    ...(isSuperAdmin ? [{ key: "app" as Tab, label: "App Settings", icon: "⚙️" }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.7)" }}
    >
      {/* Glow accent */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${appForm.primaryColor}, transparent 70%)`,
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(60px)",
        }}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1c1c22 0%, #18181f 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Header strip */}
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${roleColors[user.role]}`}
        />

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-0.5">
              Account
            </p>
            <h2 className="text-lg font-bold text-white leading-tight">
              Manage Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition"
          >
            ✕
          </button>
        </div>

        {/* Avatar + identity */}
        <div className="flex items-center gap-4 px-6 pb-5">
          <div className="relative group">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleColors[user.role]} p-0.5`}
            >
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-zinc-800 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600 text-xs flex items-center justify-center hover:bg-zinc-600 transition opacity-0 group-hover:opacity-100"
            >
              ✎
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{user.name}</p>
            <p className="text-zinc-500 text-sm truncate">{user.email}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${roleBadge[user.role]}`}
            >
              {user.role}
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-600">Last login</p>
            <p className="text-xs text-zinc-400">{user.lastLogin}</p>
            <p className="text-xs text-zinc-600 mt-1">{user.systemAccess}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b border-zinc-800/70">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.key
                  ? "text-white border-b-2"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={
                activeTab === tab.key
                  ? { borderColor: appForm.primaryColor }
                  : {}
              }
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-5 max-h-[360px] overflow-y-auto">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Full Name"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <Field
                  label="Phone"
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Email"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                  type="email"
                />
                <Field
                  label="Location"
                  value={formData.location}
                  onChange={(v) => setFormData({ ...formData, location: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-800/70 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-zinc-600">
                  Member since {user.joinDate}
                </p>
                <SaveButton onClick={handleSaveProfile} color={appForm.primaryColor} />
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <Field
                label="Current Password"
                value={passwordData.old}
                onChange={(v) => setPasswordData({ ...passwordData, old: v })}
                type="password"
              />
              <Field
                label="New Password"
                value={passwordData.new}
                onChange={(v) => setPasswordData({ ...passwordData, new: v })}
                type="password"
              />
              <Field
                label="Confirm New Password"
                value={passwordData.confirm}
                onChange={(v) =>
                  setPasswordData({ ...passwordData, confirm: v })
                }
                type="password"
              />
              {passwordError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {passwordError}
                </p>
              )}
              <StrengthBar password={passwordData.new} />
              <div className="flex justify-end pt-1">
                <SaveButton
                  onClick={handlePasswordSubmit}
                  label="Update Password"
                  color={appForm.primaryColor}
                />
              </div>
            </div>
          )}

          {/* App Settings Tab */}
          {activeTab === "app" && isSuperAdmin && (
            <div className="space-y-4">
              <Field
                label="App Name"
                value={appForm.appName}
                onChange={(v) => setAppForm({ ...appForm, appName: v })}
              />
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  App Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <button
                    onClick={() => logoRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 transition"
                  >
                    Upload Logo
                  </button>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appForm.primaryColor}
                    onChange={(e) =>
                      setAppForm({ ...appForm, primaryColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span
                    className="px-3 py-1.5 rounded-lg text-sm font-mono border border-zinc-700 text-zinc-300"
                    style={{ background: appForm.primaryColor + "22" }}
                  >
                    {appForm.primaryColor}
                  </span>
                  {/* Presets */}
                  <div className="flex gap-1.5">
                    {["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444"].map(
                      (c) => (
                        <button
                          key={c}
                          onClick={() => setAppForm({ ...appForm, primaryColor: c })}
                          className="w-5 h-5 rounded-full border-2 transition hover:scale-110"
                          style={{
                            background: c,
                            borderColor:
                              appForm.primaryColor === c ? "white" : "transparent",
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <SaveButton
                  onClick={handleAppSave}
                  label="Save Settings"
                  color={appForm.primaryColor}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-800/70 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
      />
    </div>
  );
}

function SaveButton({
  onClick,
  label = "Save Changes",
  color,
}: {
  onClick: () => void;
  label?: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-xl text-sm font-bold text-black hover:opacity-90 active:scale-95 transition"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }}
    >
      {label}
    </button>
  );
}

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i < score ? colors[score - 1] : "#3f3f46",
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: score > 0 ? colors[score - 1] : "#71717a" }}>
        {score > 0 ? labels[score - 1] : ""}
      </p>
    </div>
  );
}