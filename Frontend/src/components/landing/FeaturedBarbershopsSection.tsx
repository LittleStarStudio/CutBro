import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Phone, Star, Scissors, Loader2, ArrowRight } from "lucide-react";

import { useAuth } from "@/components/context/AuthContext";
import {
  getBarbershops,
  type PublicBarbershop,
} from "@/services/customer.service";

const formatPrice = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export default function FeaturedBarbershopsSection() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [shops,   setShops]   = useState<PublicBarbershop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBarbershops()
      .then((data) => setShops(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBookNow = () => {
    if (user) {
      navigate("/booking");
    } else {
      navigate("/login?redirect=/booking");
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-neutral-950 relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-amber-400 font-semibold text-sm uppercase tracking-[0.2em] mb-4 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20">
            Featured Barbershops
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Find Your{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              Perfect Barber
            </span>
          </h2>
          <p className="text-neutral-400 text-lg">
            Discover top-rated barbershops and book your appointment in minutes.
          </p>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-amber-400" size={32} />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <Scissors size={40} className="mx-auto mb-3 opacity-40" />
            <p>No barbershops available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {shops.map((shop) => {
              const closed = !shop.is_open_now;
              return (
                <div
                  key={shop.id}
                  className={`bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden
                    transition-all duration-200
                    ${closed
                      ? "opacity-60 grayscale"
                      : "hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5"}`}
                >
                  {/* Image */}
                  <div className="h-44 bg-neutral-800 relative overflow-hidden">
                    {(shop.cover_photo_url ?? shop.logo_url) ? (
                      <img
                        src={(shop.cover_photo_url ?? shop.logo_url)!}
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors size={36} className="text-neutral-600" />
                      </div>
                    )}

                    {/* Open/Closed badge */}
                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${closed ? "bg-neutral-700 text-neutral-400" : "bg-green-500/90 text-white"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${closed ? "bg-neutral-500" : "bg-white"}`} />
                      {closed ? "CLOSED" : "OPEN NOW"}
                    </div>

                    {/* Rating badge */}
                    {shop.average_rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-900/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-amber-400">
                        <Star size={10} className="fill-amber-400" /> {shop.average_rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-2">{shop.name}</h3>
                    <div className="space-y-1 text-xs text-neutral-400 mb-3">
                      <div className="flex items-center gap-1.5"><MapPin size={11} /> {shop.address}, {shop.city}</div>
                      <div className="flex items-center gap-1.5"><Phone size={11} /> {shop.phone}</div>
                      {shop.average_rating !== null ? (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Star size={11} className="fill-amber-400" />
                          <span>{shop.average_rating.toFixed(1)} rating</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600">No ratings yet</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                      <div>
                        {shop.min_price && (
                          <>
                            <p className="text-[10px] text-neutral-500">Starting from</p>
                            <p className="text-sm font-bold text-amber-400">{formatPrice(shop.min_price)}</p>
                          </>
                        )}
                      </div>
                      <button
                        disabled={closed}
                        onClick={handleBookNow}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors
                          ${closed
                            ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                            : "bg-amber-500 hover:bg-amber-400 text-black"}`}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* More button */}
        <div className="flex justify-center">
          <Link
            to={user ? "/booking" : "/login?redirect=/booking"}
            className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 border border-neutral-700
              hover:border-amber-500/60 hover:bg-amber-500/5 text-white font-semibold rounded-xl
              transition-all duration-200 group"
          >
            View All Barbershops
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
