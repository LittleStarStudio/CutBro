import { Check } from "lucide-react";
import { SERVICES } from "@/components/entities/constants/BookConstants";
import { StepHeading, SelectableCard } from "@/components/ui/BookingUi";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const formatRupiah = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

export function StepService({ selected, onSelect }: Props) {
  return (
    <div>
      <StepHeading
        title="Choose Your Service"
        subtitle="Select a service you'd like"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((svc) => {
          const active         = selected === svc.id;
          const discountedPrice = svc.discount
            ? Math.round(svc.price * (1 - svc.discount / 100))
            : null;

          return (
            <SelectableCard
              key={svc.id}
              active={active}
              onClick={() => onSelect(svc.id)}
              className="relative p-4"
            >
              {/* Badge: Popular (kiri atas) atau centang aktif */}
              {svc.popular && !active && (
                <span className="absolute top-3 left-3 text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">
                  POPULAR
                </span>
              )}
              {active && (
                <div className="absolute top-3 left-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-black" strokeWidth={3} />
                </div>
              )}

              <div className="flex items-start gap-3 mt-5">
                {/* Icon */}
                <span className="text-2xl">{svc.icon}</span>

                {/* Nama & durasi */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${active ? "text-amber-400" : "text-white"}`}>
                    {svc.name}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">{svc.duration}</p>
                </div>

                {/* Harga */}
                <div className="shrink-0 text-right">
                  {discountedPrice ? (
                    <>
                      <p className="text-zinc-500 text-xs line-through">
                        {formatRupiah(svc.price)}
                      </p>
                      <p className={`font-bold text-sm ${active ? "text-amber-400" : "text-white"}`}>
                        {formatRupiah(discountedPrice)}{" "}
                        <span className="text-red-400 text-[10px] font-semibold">
                          -{svc.discount}%
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className={`font-bold text-sm ${active ? "text-amber-400" : "text-white"}`}>
                      {formatRupiah(svc.price)}
                    </p>
                  )}
                </div>
              </div>
            </SelectableCard>
          );
        })}
      </div>
    </div>
  );
}