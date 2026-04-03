import { useState } from "react";
import { TIME_SLOTS, UNAVAILABLE_TIMES, MONTH_NAMES, DAY_NAMES } from "@/components/entities/constants/BookConstants";
import { buildCalendarDays, toISODate, todayISO } from "@/lib/utils/BookingUtils";
import { StepHeading } from "@/components/ui/BookingUi";

interface Props {
  selectedDate: string | null;
  selectedTime: string | null;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

export function StepDateTime({ selectedDate, selectedTime, onSelectDate, onSelectTime }: Props) {
  const today   = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const cells = buildCalendarDays(year, month);
  const todayStr = todayISO();

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <div>
      <StepHeading title="Pick a Date & Time" subtitle="Choose your preferred appointment slot" />

      {/* ── Calendar ───────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-300"
          >
            ‹
          </button>
          <span className="font-bold text-white">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-300"
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-zinc-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />;

            const dateStr  = toISODate(year, month, cell.date);
            const isActive = selectedDate === dateStr;
            const isToday  = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                disabled={cell.past}
                onClick={() => !cell.past && onSelectDate(dateStr)}
                className={`aspect-square rounded-xl text-sm font-medium transition-all duration-200 ${
                  cell.past
                    ? "text-zinc-700 cursor-not-allowed"
                    : isActive
                    ? "bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                    : isToday
                    ? "border border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {cell.date}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time Slots ─────────────────────────────────────────────────────── */}
      {selectedDate && (
        <div>
          <p className="text-sm font-semibold text-zinc-400 mb-3">Available Times</p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((time) => {
              const unavailable = UNAVAILABLE_TIMES.includes(time);
              const active      = selectedTime === time;
              return (
                <button
                  key={time}
                  disabled={unavailable}
                  onClick={() => !unavailable && onSelectTime(time)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    unavailable
                      ? "bg-zinc-900 text-zinc-700 cursor-not-allowed line-through"
                      : active
                      ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}