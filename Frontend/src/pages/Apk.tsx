import { useState } from "react";
import UserProfile from "@/pages/ProfileModal";

export default function Apk() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Sample user data
  const [userData, setUserData] = useState({
    name: "Admin User",
    email: "admin@gmail.com",
    phone: "0812345789",
    location: "Indonesia",
    joinDate: "Jan 2025",
    avatar: "",
    bio: "Dashboard system user",
    role: "SuperAdmin" as const,
    systemAccess: "Full System Access",
    lastLogin: "2025-02-16 14:30",
  });

  // Sample app settings
  const [appSettings, setAppSettings] = useState({
    appName: "Barbershop Management System",
    appLogo: "",
    primaryColor: "#f59e0b",
  });

  const handleSaveProfile = (updatedUser: any) => {
    setUserData(updatedUser);
    console.log("Profile updated:", updatedUser);
    alert("Profile updated successfully!");
  };

  const handlePasswordChange = (oldPassword: string, newPassword: string) => {
    console.log("Password change requested:", { oldPassword, newPassword });
    alert("Password changed successfully!");
  };

  const handleAppSettingsChange = (settings: any) => {
    setAppSettings(settings);
    console.log("App settings updated:", settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">User Profile Demo</h1>
        <p className="text-zinc-400">Complete profile management system</p>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:scale-105 transition"
        >
          Open Profile Modal
        </button>

        <div className="mt-8 p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700 text-left max-w-md mx-auto">
          <h3 className="text-amber-400 font-bold mb-3">Features:</h3>
          <ul className="text-zinc-300 text-sm space-y-2">
            <li>✅ Edit profile photo with preview</li>
            <li>✅ Update name, phone, location, bio</li>
            <li>✅ Change password with validation</li>
            <li>✅ Admin: Edit app name & logo</li>
            <li>✅ Admin: Customize primary color</li>
            <li>✅ Role-based access (SuperAdmin shown)</li>
            <li>✅ Beautiful UI with tabs</li>
          </ul>
        </div>
      </div>

      <UserProfile
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={userData}
        onSave={handleSaveProfile}
        onPasswordChange={handlePasswordChange}
        onAppSettingsChange={handleAppSettingsChange}
        appSettings={appSettings}
      />
    </div>
  );
}