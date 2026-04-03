// File: src/components/dashboard/SettingsModal.tsx
import { Settings, Globe, ChevronRight, Check, X, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

/* ================= CONST ================= */
const APP_NAME = "CutBro App";
const APP_VERSION = "1.0.0";

const LANGUAGES = [
  { code: "id", label: "Bahasa Indonesia", flag: "https://flagcdn.com/w20/id.png" },
  { code: "en", label: "English",          flag: "https://flagcdn.com/w20/gb.png" },
];

/* ================= PROPS ================= */
interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean; // ✅ hanya admin yang bisa ubah bahasa
}

/* ================= COMPONENT ================= */
export default function SettingsModal({ open, onClose, isAdmin = false }: SettingsModalProps) {
  const [language, setLanguage]         = useState("en");
  const [langPickerOpen, setLangPicker] = useState(false);
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    if (!open) return;
    const savedLang = localStorage.getItem("app_language");
    if (savedLang) setLanguage(savedLang);
    setLangPicker(false);
    setSaved(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSave = () => {
    localStorage.setItem("app_language", language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentLang = LANGUAGES.find((l) => l.code === language);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center">
              <Settings className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <h2 className="text-sm font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===== BODY ===== */}
        <div className="p-5 space-y-4">

          {/* App Info — 2 kolom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">App Name</label>
              <input
                value={APP_NAME}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Version</label>
              <input
                value={APP_VERSION}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          {/* Language */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-500">Language</label>
              {/* ✅ badge admin-only */}
              {!isAdmin && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <Lock className="w-3 h-3" /> Admin only
                </span>
              )}
            </div>

            {/* ✅ Disabled jika bukan admin */}
            <button
              onClick={() => isAdmin && setLangPicker((v) => !v)}
              disabled={!isAdmin}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isAdmin
                  ? "bg-zinc-950 border-zinc-800 hover:border-[#D4AF37]/50 cursor-pointer"
                  : "bg-zinc-950/50 border-zinc-800/50 cursor-not-allowed opacity-50"
              }`}
            >
              <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="flex-1 flex items-center gap-2 text-sm text-white">
                <img src={currentLang?.flag} alt="" className="w-4 h-auto rounded-sm" />
                {currentLang?.label}
              </span>
              {isAdmin && (
                <ChevronRight
                  className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
                    langPickerOpen ? "rotate-90" : ""
                  }`}
                />
              )}
            </button>

            {/* Inline picker — hanya muncul jika admin */}
            {isAdmin && langPickerOpen && (
              <div className="mt-1 rounded-xl border border-zinc-800 overflow-hidden">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setLangPicker(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left border-b border-zinc-800/50 last:border-0"
                  >
                    <img src={lang.flag} alt="" className="w-4 h-auto rounded-sm" />
                    <span className="text-sm text-zinc-200 flex-1">{lang.label}</span>
                    {language === lang.code && <Check className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          {/* ✅ Tombol Save hanya aktif jika admin */}
          <Button
            onClick={isAdmin ? handleSave : undefined}
            disabled={!isAdmin}
            className={`text-sm transition-colors ${
              !isAdmin
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
                : saved
                ? "bg-green-600 hover:bg-green-600"
                : "bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A0A0A]"
            }`}
          >
            {saved ? "Saved ✓" : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}