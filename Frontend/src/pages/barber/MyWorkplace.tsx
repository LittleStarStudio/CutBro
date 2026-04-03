import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Store, MapPin, Phone, Mail, Camera, Briefcase } from "lucide-react";

import { barberLogo, barberMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

/* ================= TYPES ================= */
interface Barbershop {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  photos: string[];
}

/* ================= DUMMY DATA (fetched from API in real app) ================= */
const SHOP_DATA: Barbershop = {
  name: "CutBro Barbershop",
  address: "Jl. Malioboro No. 12, Yogyakarta, DI Yogyakarta 55213",
  phone: "+62 812-3456-7890",
  email: "hello@cutbro.com",
  description: "Premium barbershop with professional barbers and modern equipment. We specialize in classic cuts, fades, and beard grooming with top-tier service.",
  photos: [],
};

/* ================= HELPERS ================= */
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-200 leading-relaxed">{value || "—"}</span>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function BarberWorkplace() {
  const currentUser = getUser();

  return (
    <DashboardLayout
      title="My Workplace"
      subtitle="Barbershop details where you are assigned"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={
        currentUser ?? {
          name: "Barber",
          email: "barber@cutbro.com",
          role: "barber",
        }
      }
      showNotification
      notificationCount={0}
      onLogout={logout}
    >
      <div className="w-full max-w-5xl space-y-6">

        {/* ── Hero Banner ─────────────────────────────────────────── */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37] to-[#D4AF37]/0" />
          <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
              <Store size={28} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-white mb-1">{SHOP_DATA.name}</h2>
              <p className="text-sm text-zinc-400 flex items-start gap-1.5">
                <MapPin size={13} className="text-zinc-500 flex-shrink-0 mt-0.5" />
                {SHOP_DATA.address}
              </p>
              <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-1">
                <Phone size={13} className="text-zinc-500 flex-shrink-0" />
                {SHOP_DATA.phone}
              </p>
              <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-1">
                <Mail size={13} className="text-zinc-500 flex-shrink-0" />
                {SHOP_DATA.email}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl self-start sm:self-center flex-shrink-0">
              <Briefcase size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#D4AF37]">Assigned Here</span>
            </div>
          </div>
        </div>

        {/* ── Two-column: Photos (left) + Info (right) ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT — Photos */}
          <SectionCard title="Barbershop Photos" icon={Camera}>
            {SHOP_DATA.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {SHOP_DATA.photos.map((photo, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700">
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Camera size={32} className="text-zinc-700" />
                <p className="text-sm text-zinc-500">No photos uploaded yet</p>
                <p className="text-xs text-zinc-600">The owner hasn't added any photos.</p>
              </div>
            )}
          </SectionCard>

          {/* RIGHT — Shop Info + Address */}
          <div className="space-y-6">
            <SectionCard title="Shop Information" icon={Store}>
              <div className="space-y-5">
                <InfoRow label="Barbershop Name" value={SHOP_DATA.name} />
                <div className="border-t border-zinc-800" />
                <InfoRow label="Phone Number" value={SHOP_DATA.phone} />
                <div className="border-t border-zinc-800" />
                <InfoRow label="Email" value={SHOP_DATA.email} />
                <div className="border-t border-zinc-800" />
                <InfoRow label="Description" value={SHOP_DATA.description} />
              </div>
            </SectionCard>

            <SectionCard title="Address" icon={MapPin}>
              <InfoRow label="Full Address" value={SHOP_DATA.address} />
            </SectionCard>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}