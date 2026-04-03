// File: src/pages/customer/BookingPage.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Clock, MapPin, Star, ChevronDown, Phone } from "lucide-react";
import { motion, type Variants, AnimatePresence } from "framer-motion";

import NavbarLayout from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";
import { customerMenu } from "@/components/config/Menu";
import { getUser, logout } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Pagination from "@/components/ui/Pagination";

/* ================= TYPES ================= */
interface Barbershop {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  distance: string;
  open: string;
  price: number;
  image: string;
  services: string[];
  phone: string;
}

/* ================= MOCK ================= */
const BARBERSHOPS: Barbershop[] = [
  {
    id: 1,
    name: "Royal Cuts",
    location: "South Jakarta",
    rating: 4.8,
    reviews: 127,
    distance: "1.2 km",
    open: "09:00 - 21:00",
    price: 35000,
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800",
    services: ["Haircut", "Beard Trim", "Hair Coloring"],
    phone: "+62 812-3456-7890",
  },
  {
    id: 2,
    name: "Modern Barber",
    location: "Central Jakarta",
    rating: 4.9,
    reviews: 203,
    distance: "2.5 km",
    open: "10:00 - 22:00",
    price: 45000,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    services: ["Premium Cut", "Hot Shave", "Styling"],
    phone: "+62 821-9876-5432",
  },
  {
    id: 3,
    name: "Classic Style",
    location: "West Jakarta",
    rating: 4.7,
    reviews: 89,
    distance: "3.1 km",
    open: "08:00 - 20:00",
    price: 30000,
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800",
    services: ["Haircut", "Beard Care", "Hair Treatment"],
    phone: "+62 813-1122-3344",
  },
  {
    id: 4,
    name: "Gentleman's Cut",
    location: "North Jakarta",
    rating: 5.0,
    reviews: 156,
    distance: "1.8 km",
    open: "09:00 - 21:00",
    price: 50000,
    image: "https://images.unsplash.com/photo-1622286346003-c399a9773b78?w=800",
    services: ["Premium Cut", "Luxury Shave", "Facial"],
    phone: "+62 857-5566-7788",
  },
  {
    id: 5,
    name: "Urban Barbershop",
    location: "East Jakarta",
    rating: 4.6,
    reviews: 94,
    distance: "4.2 km",
    open: "10:00 - 22:00",
    price: 40000,
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
    services: ["Haircut", "Styling", "Hair Wash"],
    phone: "+62 878-9900-1122",
  },
  {
    id: 6,
    name: "The Barber House",
    location: "South Jakarta",
    rating: 4.9,
    reviews: 178,
    distance: "2.0 km",
    open: "08:00 - 20:00",
    price: 55000,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800",
    services: ["Signature Cut", "Beard Design", "Hair Color"],
    phone: "+62 811-2233-4455",
  },
  {
    id: 7,
    name: "Sharp & Clean",
    location: "West Jakarta",
    rating: 4.5,
    reviews: 61,
    distance: "3.8 km",
    open: "09:00 - 21:00",
    price: 38000,
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800",
    services: ["Haircut", "Beard Trim", "Scalp Treatment"],
    phone: "+62 831-6677-8899",
  },
];

/* ================= CONFIG ================= */
const ITEMS_PER_PAGE = 6;

/* ================= RATING OPTIONS ================= */
const RATING_OPTIONS = [
  { value: "all", label: "All Ratings", stars: 0 },
  { value: "5", label: "5", stars: 5 },
  { value: "4", label: "4", stars: 4 },
  { value: "3", label: "3", stars: 3 },
  { value: "2", label: "2", stars: 2 },
  { value: "1", label: "1", stars: 1 },
];

/* ================= HELPERS ================= */
const formatRupiah = (price: number) =>
  `Rp ${price.toLocaleString("id-ID")}`;

const isOpenNow = (range: string) => {
  const now = new Date();
  const [start, end] = range.split(" - ");
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= sh * 60 + sm && current <= eh * 60 + em;
};

/* ================= RATING STARS ================= */
const RatingStars = ({ count, size = 12 }: { count: number; size?: number }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < count ? "fill-amber-400 text-amber-400" : "fill-zinc-700 text-zinc-700"}
      />
    ))}
  </span>
);

/* ================= CUSTOM DROPDOWN ================= */
const RatingDropdown = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = RATING_OPTIONS.find((o) => o.value === value) ?? RATING_OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-zinc-600 transition-colors min-w-[150px]"
      >
        {selected.stars > 0 ? (
          <RatingStars count={selected.stars} />
        ) : (
          <span className="text-zinc-400 text-sm">All Ratings</span>
        )}
        {selected.stars > 0 && (
          <span className="text-white font-semibold ml-1">{selected.label}</span>
        )}
        <ChevronDown
          size={14}
          className={`ml-auto text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-full min-w-[160px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {RATING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors
                  ${value === option.value
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-zinc-300 hover:bg-zinc-800"
                  }
                `}
              >
                {option.stars > 0 ? (
                  <>
                    <RatingStars count={option.stars} />
                    <span className="font-semibold">{option.label}</span>
                  </>
                ) : (
                  <span>{option.label}</span>
                )}
                {value === option.value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ================= ANIMATION VARIANTS ================= */
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

/* ================= PAGE ================= */
export default function BookingPage() {
  const [search, setSearch]             = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const navigate = useNavigate();
  const user = getUser();

  const debouncedSearch = useDebouncedValue(search, 300);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return BARBERSHOPS.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.location.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchesRating = true;
      if (ratingFilter !== "all") {
        const r = Number(ratingFilter);
        matchesRating = Math.floor(b.rating) === r;
      }

      return matchesSearch && matchesRating;
    });
  }, [debouncedSearch, ratingFilter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRatingFilter = (value: string) => {
    setRatingFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= NAVIGATE ================= */
const handleBook = (shop: Barbershop, open: boolean) => {
  if (!open) return;
  navigate(`/customer/booking/${shop.id}`, { state: { shop } });
};

  /* ================= UI ================= */
  return (
    <PageTransition>
      <NavbarLayout
        user={user}
        notificationCount={3}
        onLogout={logout}
      />

      <div className="min-h-screen bg-zinc-950 text-white pb-20 md:pb-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">

          {/* ================= SEARCH + FILTER ================= */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-7 sm:mb-10 max-w-7xl mx-auto"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-400 shrink-0" />
              <RatingDropdown value={ratingFilter} onChange={handleRatingFilter} />
            </div>
          </motion.div>

          {/* ================= GRID ================= */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`page-${currentPage}-${debouncedSearch}-${ratingFilter}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 lg:gap-10 max-w-7xl mx-auto"
            >
              {paginated.map((shop) => {
                const open = isOpenNow(shop.open);

                return (
                  <motion.div
                    key={shop.id}
                    variants={cardVariants}
                    className={`
                      group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800
                      backdrop-blur-xl transition-all duration-500
                      ${
                        open
                          ? "bg-zinc-900/80 hover:-translate-y-3 hover:border-amber-500 hover:shadow-[0_20px_60px_rgba(251,191,36,0.25)] cursor-pointer"
                          : "bg-zinc-900/50 opacity-60 grayscale cursor-not-allowed"
                      }
                    `}
                    onClick={() => handleBook(shop, open)}
                  >
                    {open && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/10" />
                    )}

                    {/* IMAGE */}
                    <div className="relative h-48 sm:h-60 overflow-hidden">
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className={`w-full h-full object-cover transition duration-700 ${open ? "group-hover:scale-110" : "grayscale"}`}
                      />
                      <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1.5 text-xs font-bold rounded-full tracking-wide shadow-xl ${open ? "bg-green-500 text-black" : "bg-red-600 text-white"}`}>
                        {open ? "● OPEN NOW" : "● CLOSED"}
                      </div>
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/70 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs sm:text-sm font-bold text-white">{shop.rating}</span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      <h2 className={`text-lg sm:text-xl font-bold transition ${open ? "group-hover:text-amber-400 text-white" : "text-zinc-500"}`}>
                        {shop.name}
                      </h2>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                        <MapPin size={13} />
                        {shop.location} • {shop.distance}
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                        <Clock size={13} />
                        {shop.open}
                      </div>

                      {/* PHONE */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                        <Phone size={13} />
                        {shop.phone}
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {shop.services.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-300">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* FOOTER */}
                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-zinc-800">
                        <div>
                          <p className="text-[10px] text-zinc-500 mb-0.5">Starting from</p>
                          <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                            {formatRupiah(shop.price)}
                          </span>
                        </div>
                        <button
                          disabled={!open}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBook(shop, open);
                          }}
                          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                            open
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:scale-105 hover:shadow-lg hover:shadow-amber-500/40"
                              : "bg-zinc-800 text-zinc-600"
                          }`}
                        >
                          {open ? "Book Now" : "Closed"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* ================= PAGINATION ================= */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />

          {/* ================= EMPTY STATE ================= */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center py-16 sm:py-20"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">No Barbershops Found</h3>
              <p className="text-zinc-400 text-sm sm:text-base mb-6">Try adjusting your search to find what you're looking for</p>
              <button
                onClick={() => { handleSearchChange(""); handleRatingFilter("all"); }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-zinc-800 border border-zinc-700 text-white font-semibold rounded-xl hover:border-amber-500/50 transition-all text-sm sm:text-base"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <BottomNav
        menuItems={customerMenu}
        user={user}
        onLogout={logout}
      />
    </PageTransition>
  );
}