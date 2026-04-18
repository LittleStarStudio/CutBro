import { useState, useEffect } from "react";
import { getMyBarbershop, type BarbershopData } from "@/services/barber.service";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Store, MapPin, Phone, Camera, Briefcase, ClipboardPenIcon, InfoIcon, Building2 } from "lucide-react";

import { useAuth } from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";

/* ================= HELPERS ================= */
function SectionCard({ title, icon: Icon, children, className = "" }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
          <Icon size={16} className="text-[#D4AF37]" />
        </div>
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={16} className="text-zinc-400" />
        </div>
      )}
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-sm text-zinc-200 leading-relaxed">{value || "—"}</span>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function BarberWorkplace() {
  
  const [barbershop, setBarbershop]         = useState<BarbershopData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [selectedPhoto, setSelectedPhoto]   = useState<string | null>(null);
  const [photoIndex, setPhotoIndex]         = useState<number>(0);
  
  const { user: currentUser, logout }       = useAuth();

  useEffect(() => {
    getMyBarbershop()
      .then(data => setBarbershop(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (photoUrl: string, index: number) => {
    setSelectedPhoto(photoUrl);
    setPhotoIndex(index);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = () => {
    if (barbershop?.photos && photoIndex < barbershop.photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
      setSelectedPhoto(barbershop.photos[photoIndex + 1].photo_url);
    }
  };

  const prevPhoto = () => {
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
      setSelectedPhoto(barbershop!.photos[photoIndex - 1].photo_url);
    }
  };

  if (loading) {
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
        </div>
      </DashboardLayout>
    );
  }

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
      <div className="w-full max-w-5xl mx-auto space-y-6">

        {/* ── Hero Banner ────────────────────────────────────────── */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37] to-[#D4AF37]/0" />
          <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            {barbershop?.logo_url ? (
              <img 
                src={barbershop.logo_url}
                alt="Logo" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/30 flex-shrink-0"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  (img.nextElementSibling as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0" style={{ display: barbershop?.logo_url ? 'none' : 'flex' }}>
              <Store size={28} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-white">{barbershop?.name || "Loading..."}</h2>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl self-start sm:self-center flex-shrink-0">
              <Briefcase size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#D4AF37]">Assigned Here</span>
            </div>
          </div>
        </div>

        {/* ── Grid Layout ─────────────── */}

        {/* ROW 1: Photos + Shop Info (2 Kolom) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT - Photos */}
          <SectionCard title="Barbershop Photos" icon={Camera}>
            {barbershop?.photos && barbershop.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {barbershop.photos.map((photo, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700">
                    <img 
                      src={`http://localhost:8000/storage/${photo.photo_url}`}
                      alt={`Photo ${i + 1}`} 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openModal(photo.photo_url, i)}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke=%23747474 stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="m21 15-5-5L5 21"/%3E%3C/svg%3E';
                        img.onerror = null;
                      }}
                    />
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

          {/* RIGHT - Shop Information */}
          <SectionCard title="Barbershop Information" icon={InfoIcon}>
            <div className="space-y-4">
              <InfoRow label="Barbershop Name" value={barbershop?.name || "—"} icon={Store} />
              <div className="border-t border-zinc-800" />
              <InfoRow label="Phone Number" value={barbershop?.phone || "—"} icon={Phone} />
              <div className="border-t border-zinc-800" />
              <InfoRow label="City" value={barbershop?.city || "—"} icon={Building2} />
              <div className="border-t border-zinc-800" />
              <InfoRow label="Address" value={barbershop?.address || "—"} icon={MapPin} />
            </div>
          </SectionCard>

        </div>

        {/* ROW 2: Description (Full Width) */}
        <SectionCard title="Description" icon={ClipboardPenIcon}>
          <InfoRow label="" value={barbershop?.description || "—"} />
        </SectionCard>

        {/* ── Modal for Photo ─────────────── */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeModal}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700"
              onClick={closeModal}
            >
              ✕
            </button>

            {/* Previous Button */}
            {photoIndex > 0 && (
              <button 
                className="absolute left-4 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              >
                ←
              </button>
            )}

            {/* Next Button */}
            {barbershop?.photos && photoIndex < barbershop.photos.length - 1 && (
              <button 
                className="absolute right-4 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              >
                →
              </button>
            )}

            {/* Photo Display */}
            <div 
              className="max-w-4xl max-h-[90vh] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={`http://localhost:8000/storage/${selectedPhoto}`}
                alt={`Photo ${photoIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              <p className="text-center text-zinc-400 mt-4">
                {photoIndex + 1} / {barbershop?.photos?.length}
              </p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}