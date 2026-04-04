import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useMemo } from "react";
import {
  Store, Camera, MapPin, Clock, Trash2, Upload,
  AlertCircle,
} from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
interface OperatingHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Barbershop {
  name: string;
  address: string;
  phone: string;
  description: string;
  photos: string[];
  operatingHours: OperatingHour[];
}

/* ================= CONSTANTS ================= */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: OperatingHour[] = DAYS.map((day) => ({
  day,
  isOpen: day !== "Sunday",
  openTime: "09:00",
  closeTime: "21:00",
}));

/* ================= HELPERS ================= */
function FieldWarning({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

/* ================= SECTION CARD ================= */
function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
          <Icon size={16} className="text-[#D4AF37]" />
        </div>
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
const EMPTY_SHOP: Barbershop = {
  name: "", address: "", phone: "", description: "", photos: [], operatingHours: DEFAULT_HOURS,
};

export default function OwnerBarbershop() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [shop, setShop]           = useState<Barbershop>(EMPTY_SHOP);
  const [savedShop, setSavedShop] = useState<Barbershop>(EMPTY_SHOP);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);

  useEffect(() => {
    ownerService.getBarbershopProfile().then((data) => {
      const mapped: Barbershop = {
        name:        data.name,
        address:     data.address,
        phone:       data.phone,
        description: data.description ?? "",
        photos:      data.photos ?? [],
        operatingHours: data.operational_hours?.length
          ? data.operational_hours.map((h) => ({
              day:       h.day,
              isOpen:    h.is_open,
              openTime:  h.open_time?.slice(0, 5) ?? "09:00",
              closeTime: h.close_time?.slice(0, 5) ?? "21:00",
            }))
          : DEFAULT_HOURS,
      };
      setShop(mapped);
      setSavedShop(mapped);
    }).catch(() => {});
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(shop) !== JSON.stringify(savedShop),
    [shop, savedShop]
  );

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!shop.name.trim())    e.name    = "Barbershop name cannot be empty";
    if (!shop.address.trim()) e.address = "Address cannot be empty";
    if (!shop.phone.trim())   e.phone   = "Phone number cannot be empty";
    shop.operatingHours.forEach((h, i) => {
      if (h.isOpen && h.openTime >= h.closeTime) e[`hour_${i}`] = "Close time must be after open time";
    });
    return e;
  }, [shop]);

  const isValid = Object.keys(errors).length === 0;

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setShop((prev) => ({ ...prev, photos: [...prev.photos, reader.result as string] }));
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setShop((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const updateHour = (index: number, field: keyof OperatingHour, value: any) => {
    setShop((prev) => {
      const hours = [...prev.operatingHours];
      hours[index] = { ...hours[index], [field]: value };
      return { ...prev, operatingHours: hours };
    });
  };

  const [bulkOpen, setBulkOpen]   = useState("09:00");
  const [bulkClose, setBulkClose] = useState("21:00");

  const applyToAll = () => {
    setShop((prev) => ({
      ...prev,
      operatingHours: prev.operatingHours.map((h) =>
        h.isOpen ? { ...h, openTime: bulkOpen, closeTime: bulkClose } : h
      ),
    }));
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!isValid) {
      toast.error("Validation Error", "Please fix the highlighted fields before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name",        shop.name);
      formData.append("address",     shop.address);
      formData.append("phone",       shop.phone);
      formData.append("description", shop.description);
      shop.operatingHours.forEach((h, i) => {
        formData.append(`operational_hours[${i}][day]`,        h.day);
        formData.append(`operational_hours[${i}][is_open]`,    h.isOpen ? "1" : "0");
        formData.append(`operational_hours[${i}][open_time]`,  h.openTime);
        formData.append(`operational_hours[${i}][close_time]`, h.closeTime);
      });
      await ownerService.updateBarbershopProfile(formData);
      setSavedShop(shop);
      toast.success("Changes Saved!", "Barbershop info updated successfully.");
    } catch {
      toast.error("Save Failed", "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Barbershop Management"
      subtitle="Manage your barbershop information"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl space-y-6">

          {submitted && !isValid && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">Please fix the highlighted fields before saving.</p>
            </div>
          )}

          <SectionCard title="Barbershop Photos" icon={Camera}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shop.photos.map((photo, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border-2 border-zinc-700">
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleRemovePhoto(i)} className="w-9 h-9 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">{i + 1}</span>
                </div>
              ))}
              {shop.photos.length < 6 && (
                <label className="aspect-video rounded-xl border-2 border-dashed border-zinc-700 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                  <input type="file" accept="image/*" multiple onChange={handleAddPhoto} className="hidden" />
                  <Upload size={20} className="text-zinc-500" />
                  <span className="text-xs text-zinc-500 font-medium">Add Photo</span>
                  <span className="text-[10px] text-zinc-600">{shop.photos.length}/6</span>
                </label>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-3">Upload up to 6 photos • JPG, PNG • Recommended 16:9 ratio</p>
          </SectionCard>

          <SectionCard title="Basic Information" icon={Store}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Barbershop Name <span className="text-red-400">*</span></label>
                <input type="text" className={`w-full p-3 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${submitted && errors.name ? "border-red-500" : "border-zinc-700 focus:border-[#D4AF37]"}`} value={shop.name} onChange={(e) => setShop((p) => ({ ...p, name: e.target.value }))} placeholder="Enter barbershop name" />
                {submitted && errors.name && <FieldWarning message={errors.name} />}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                <input type="tel" className={`w-full p-3 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${submitted && errors.phone ? "border-red-500" : "border-zinc-700 focus:border-[#D4AF37]"}`} value={shop.phone} onChange={(e) => setShop((p) => ({ ...p, phone: e.target.value }))} placeholder="+62 812-3456-7890" />
                {submitted && errors.phone && <FieldWarning message={errors.phone} />}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Description <span className="text-zinc-500 font-normal">(Optional)</span></label>
                <textarea rows={3} className="w-full p-3 rounded-lg bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none transition-colors resize-none" value={shop.description} onChange={(e) => setShop((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of your barbershop..." />
                <p className="text-xs text-zinc-500 mt-1">Shown on your public profile and booking page</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Address" icon={MapPin}>
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Full Address <span className="text-red-400">*</span></label>
              <textarea rows={3} className={`w-full p-3 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none ${submitted && errors.address ? "border-red-500" : "border-zinc-700 focus:border-[#D4AF37]"}`} value={shop.address} onChange={(e) => setShop((p) => ({ ...p, address: e.target.value }))} placeholder="Enter full address including city and postal code" />
              {submitted && errors.address && <FieldWarning message={errors.address} />}
              <p className="text-xs text-zinc-500 mt-1">Include street, district, city, and postal code for accuracy</p>
            </div>
          </SectionCard>

          <SectionCard title="Operating Hours" icon={Clock}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <p className="text-xs text-zinc-400">Set hours for all open days at once:</p>
                <div className="flex items-center gap-2">
                  <input type="time" value={bulkOpen} onChange={(e) => setBulkOpen(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:border-[#D4AF37] focus:outline-none" />
                  <span className="text-zinc-500 text-xs">–</span>
                  <input type="time" value={bulkClose} onChange={(e) => setBulkClose(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:border-[#D4AF37] focus:outline-none" />
                  <button onClick={applyToAll} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded-lg transition-colors">Apply All</button>
                </div>
              </div>
              {shop.operatingHours.map((hour, i) => (
                <div key={hour.day} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${hour.isOpen ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-900 border-zinc-800 opacity-60"}`}>
                  <button onClick={() => updateHour(i, "isOpen", !hour.isOpen)} className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${hour.isOpen ? "bg-[#D4AF37] justify-end" : "bg-zinc-700 justify-start"}`}>
                    <span className="w-4 h-4 bg-white rounded-full shadow transition-all" />
                  </button>
                  <span className={`w-24 text-sm font-semibold flex-shrink-0 ${hour.isOpen ? "text-white" : "text-zinc-500"}`}>{hour.day}</span>
                  {hour.isOpen ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={hour.openTime} onChange={(e) => updateHour(i, "openTime", e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:border-[#D4AF37] focus:outline-none transition-colors" />
                        <span className="text-zinc-500 text-sm flex-shrink-0">–</span>
                        <input type="time" value={hour.closeTime} onChange={(e) => updateHour(i, "closeTime", e.target.value)} className={`flex-1 bg-zinc-900 border text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none transition-colors ${errors[`hour_${i}`] ? "border-red-500" : "border-zinc-700 focus:border-[#D4AF37]"}`} />
                      </div>
                      {errors[`hour_${i}`] && <span title={errors[`hour_${i}`]}><AlertCircle size={16} className="text-red-400 flex-shrink-0" /></span>}
                    </>
                  ) : (
                    <span className="text-sm text-zinc-500 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex gap-3 pb-8">
            <button onClick={() => { setShop(savedShop); setSubmitted(false); }} disabled={!hasChanges} className="px-6 py-3 rounded-xl font-semibold border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving || !hasChanges} className="flex-1 flex items-center justify-center py-3 bg-[#D4AF37] hover:bg-[#c9a227] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}