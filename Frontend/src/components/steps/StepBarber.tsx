import { BARBERS } from "@/components/entities/constants/BookConstants";
import { StepHeading, SelectableCard, SelectionIndicator } from "@/components/ui/BookingUi";

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StepBarber({ selected, onSelect }: Props) {
  return (
    <div>
      <StepHeading
        title="Choose Your Barber"
        subtitle="Pick a barber or let us assign one for you"
      />

      <div className="space-y-3">
        {BARBERS.map((barber) => {
          const active = selected === barber.id;
          return (
            <SelectableCard
              key={barber.id}
              active={active}
              disabled={!barber.available}
              onClick={() => onSelect(barber.id)}
              className="p-4 flex items-center gap-4"
            >
              {/* Avatar + online dot */}
              <div className="relative shrink-0">
                <img
                  src={barber.avatar}
                  alt={barber.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                {barber.available && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-zinc-950 rounded-full" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold ${active ? "text-amber-400" : "text-white"}`}>
                  {barber.name}
                </p>
                <p className="text-zinc-400 text-xs">
                  {barber.specialty} · {barber.experience}
                </p>
              </div>

              {!barber.available && (
                <span className="text-xs text-zinc-500 shrink-0">Unavailable</span>
              )}
              {active && <SelectionIndicator />}
            </SelectableCard>
          );
        })}
      </div>
    </div>
  );
}