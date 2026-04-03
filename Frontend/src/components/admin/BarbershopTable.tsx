import React from "react";

/* ================= TYPES ================= */
export interface Barbershop {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  status: "Open" | "Full";
  image?: string;
}

interface Props {
  barbershops: Barbershop[];
  onBookNow: (id: number) => void;
}

/* ================= COMPONENT ================= */
const BarbershopTable: React.FC<Props> = ({
  barbershops,
  onBookNow,
}) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {barbershops.map((shop) => (
        <div
          key={shop.id}
          className="
            bg-neutral-900 border border-neutral-800
            rounded-2xl p-5
            hover:border-yellow-500 transition
          "
        >
          {/* Name */}
          <h3 className="text-lg font-semibold text-white">
            {shop.name}
          </h3>

          {/* Location */}
          <p className="text-sm text-neutral-400 mt-1">
            {shop.location}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-400">★</span>
            <span className="text-white font-medium">
              {shop.rating}
            </span>
            <span className="text-neutral-400 text-sm">
              ({shop.reviews})
            </span>
          </div>

          {/* Price */}
          <p className="text-yellow-400 font-semibold mt-3">
            Rp {shop.price}
          </p>

          {/* Status */}
          <p
            className={`text-sm mt-1 ${
              shop.status === "Open"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {shop.status}
          </p>

          {/* Button */}
          <button
            onClick={() => onBookNow(shop.id)}
            disabled={shop.status === "Full"}
            className={`
              w-full mt-4 py-2 rounded-lg font-medium
              ${
                shop.status === "Full"
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-yellow-500 text-black hover:bg-yellow-400"
              }
            `}
          >
            {shop.status === "Full" ? "Full" : "Book Now"}
          </button>
        </div>
      ))}

      {barbershops.length === 0 && (
        <p className="text-neutral-500 text-center col-span-full py-10">
          No barbershop found
        </p>
      )}
    </div>
  );
};

export default BarbershopTable;
