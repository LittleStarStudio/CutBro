import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordTabProps {
  onPasswordChange: (oldPassword: string, newPassword: string) => void;
}

export default function PasswordTab({ onPasswordChange }: PasswordTabProps) {
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handleSubmit = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }
    onPasswordChange(passwordData.oldPassword, passwordData.newPassword);
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-5">
      <p className="text-zinc-400 text-sm">
        Change your password to keep your account secure.
      </p>

      {/* Old Password */}
      <div>
        <label className="flex items-center gap-2 text-zinc-400 mb-2 text-sm">
          <Lock size={14} /> Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.old ? "text" : "password"}
            value={passwordData.oldPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, oldPassword: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none pr-12"
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() =>
              setShowPasswords({ ...showPasswords, old: !showPasswords.old })
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="flex items-center gap-2 text-zinc-400 mb-2 text-sm">
          <Lock size={14} /> New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none pr-12"
            placeholder="Enter new password (min. 6 characters)"
          />
          <button
            type="button"
            onClick={() =>
              setShowPasswords({ ...showPasswords, new: !showPasswords.new })
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="flex items-center gap-2 text-zinc-400 mb-2 text-sm">
          <Lock size={14} /> Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none pr-12"
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() =>
              setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:scale-105 transition"
      >
        Update Password
      </button>
    </div>
  );
}