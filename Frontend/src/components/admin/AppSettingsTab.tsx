import { useState } from "react";
import { Settings, Upload, Image as ImageIcon } from "lucide-react";

interface AppSettings {
  appName: string;
  appLogo?: string;
  primaryColor?: string;
}

interface AppSettingsTabProps {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
}

export default function AppSettingsTab({
  appSettings,
  onAppSettingsChange,
}: AppSettingsTabProps) {
  const [editedSettings, setEditedSettings] = useState<AppSettings>(appSettings);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    appSettings.appLogo
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setEditedSettings((prev) => ({ ...prev, appLogo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onAppSettingsChange(editedSettings);
    alert("App settings updated successfully!");
  };

  return (
    <div className="space-y-6">
      <p className="text-zinc-400 text-sm">
        Customize your application's branding and appearance.
      </p>

      {/* App Logo */}
      <div>
        <label className="flex items-center gap-2 text-zinc-400 mb-3 text-sm">
          <ImageIcon size={14} /> Application Logo
        </label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="App Logo"
              className="w-20 h-20 rounded-xl border-2 border-zinc-700 object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-zinc-600" />
            </div>
          )}
          <label className="flex-1">
            <div className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition cursor-pointer flex items-center justify-center gap-2">
              <Upload size={16} />
              Upload Logo
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* App Name */}
      <div>
        <label className="flex items-center gap-2 text-zinc-400 mb-2 text-sm">
          <Settings size={14} /> Application Name
        </label>
        <input
          type="text"
          value={editedSettings.appName}
          onChange={(e) =>
            setEditedSettings({ ...editedSettings, appName: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
          placeholder="Enter app name"
        />
      </div>

      {/* Primary Color */}
      <div>
        <label className="flex items-center gap-2 text-zinc-400 mb-2 text-sm">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500" /> Primary Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={editedSettings.primaryColor || "#f59e0b"}
            onChange={(e) =>
              setEditedSettings({
                ...editedSettings,
                primaryColor: e.target.value,
              })
            }
            className="w-12 h-12 rounded-xl cursor-pointer border-2 border-zinc-700"
          />
          <input
            type="text"
            value={editedSettings.primaryColor || "#f59e0b"}
            onChange={(e) =>
              setEditedSettings({
                ...editedSettings,
                primaryColor: e.target.value,
              })
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            placeholder="#f59e0b"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:scale-105 transition"
      >
        Save App Settings
      </button>
    </div>
  );
}