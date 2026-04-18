import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, Clock, CheckCircle, User, Loader2, AlertCircle } from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth }     from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";
import { useToast }    from "@/components/ui/Toast";
import Badge           from "@/components/admin/Badge";
import StatsGrid       from "@/components/admin/StatGrid";
import TableCard       from "@/components/admin/TableCard";
import DataTable       from "@/components/admin/DataTable";
import MobileCardList  from "@/components/admin/MobileCardList";
import MobileCard      from "@/components/admin/MobileCard";
import { searchInObject } from "@/lib/utils/AdminUtils";

import {
  getTodayBookings,
  markBookingDone,
  type TodayBooking,
} from "@/services/barber.service";

/* ── Status config ── */
const STATUS_STYLES: Record<string, "warning" | "success"> = {
  paid: "warning",
  done: "success",
};
const STATUS_DOT_COLORS: Record<string, string> = {
  paid: "bg-yellow-500",
  done: "bg-green-500",
};
const STATUS_LABELS: Record<string, string> = {
  paid: "In Queue",
  done: "Done",
};

const formatPrice = (n: number) => "Rp " + n.toLocaleString("id-ID");

/* ── Main component ── */
export default function BarberSchedule() {
  const toast = useToast();
  const { user: currentUser, logout } = useAuth();

  const [bookings,     setBookings]     = useState<TodayBooking[]>([]);
  const [stats,        setStats]        = useState({ total: 0, done: 0, pending: 0 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [markingId,    setMarkingId]    = useState<number | null>(null);

  /* ── Fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTodayBookings();
      setBookings(res.bookings);
      setStats(res.stats);
    } catch {
      setError("Failed to load today's queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Mark done ── */
  const handleMarkAsDone = async (booking: TodayBooking) => {
    if (booking.status === "done") return;
    setMarkingId(booking.id);
    try {
      await markBookingDone(booking.id);
      toast.success("Done", `Booking ${booking.customer_name} has been marked as Done`);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to mark as done.";
      toast.error("Failed", msg);
    } finally {
      setMarkingId(null);
    }
  };

  /* ── Filter ── */
  const filtered = useMemo(() =>
    bookings.filter((b) =>
      searchInObject(b, searchQuery, ["customer_name", "service_name", "start_time"])
    ),
    [bookings, searchQuery]
  );

  /* ── Table columns ── */
  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (b: TodayBooking) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-white text-sm font-medium truncate">{b.customer_name}</span>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (b: TodayBooking) => (
        <span className="text-sm text-[#B8B8B8] whitespace-nowrap">{b.service_name}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (b: TodayBooking) => {
        const [sh, sm] = b.start_time.split(":").map(Number);
        const [eh, em] = b.end_time.split(":").map(Number);
        const min = (eh * 60 + em) - (sh * 60 + sm);
        return <span className="text-sm text-[#B8B8B8] whitespace-nowrap">{min} min</span>;
      },
    },
    {
      key: "time",
      header: "Time",
      render: (b: TodayBooking) => (
        <div className="flex items-center gap-1.5 text-sm text-[#B8B8B8] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {b.start_time} – {b.end_time}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (b: TodayBooking) => (
        <span className="text-sm text-amber-400 font-medium">{formatPrice(b.total_price)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b: TodayBooking) => (
        <Badge
          text={STATUS_LABELS[b.status] ?? b.status}
          variant={STATUS_STYLES[b.status] ?? "warning"}
          showDot
          dotColor={STATUS_DOT_COLORS[b.status] ?? "bg-yellow-500"}
        />
      ),
    },
    {
      key: "action",
      header: "Actions",
      render: (b: TodayBooking) => (
        <button
          onClick={() => handleMarkAsDone(b)}
          disabled={b.status === "done" || markingId === b.id}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
            b.status === "done"
              ? "bg-[#2A2A2A] text-[#666] cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {markingId === b.id
            ? <Loader2 size={12} className="animate-spin" />
            : b.status === "done" ? "Completed" : "Done"
          }
        </button>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <DashboardLayout
      title="My Activity"
      subtitle="Today's booking queue"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={currentUser ?? { name: "Barber", email: "" }}
      showNotification
      onLogout={logout}
    >
      <div className="w-full space-y-4 sm:space-y-6">

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-amber-400" size={32} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400 py-8">
            <AlertCircle size={18} /> {error}
          </div>
        ) : (
          <>
            <StatsGrid
              columns={4}
              stats={[
                { icon: Calendar,    title: "Today's Total", value: stats.total   },
                { icon: Clock,       title: "In Queue",        value: stats.pending },
                { icon: CheckCircle, title: "Done",        value: stats.done    },
                {
                  icon: Calendar,
                  title: "Completion",
                  value: stats.total > 0
                    ? `${Math.round((stats.done / stats.total) * 100)}%`
                    : "0%",
                },
              ]}
            />

            <TableCard
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchPlaceholder="Search customer or service..."
              isEmpty={bookings.length === 0}
              emptyIcon={Calendar}
              emptyTitle="No bookings today"
              emptyDescription="Enjoy your day!"
            >
              <>
                {/* Desktop */}
                <div className="hidden md:block w-full overflow-x-auto">
                  {filtered.length === 0 && searchQuery ? (
                    <p className="text-center text-[#666] text-sm py-8">No results for &quot;{searchQuery}&quot;</p>
                  ) : (
                    <DataTable data={filtered} columns={columns} />
                  )}
                </div>

                {/* Mobile */}
                <div className="block md:hidden space-y-3">
                  {filtered.length === 0 && searchQuery ? (
                    <p className="text-center text-[#666] text-sm py-8">No results for &quot;{searchQuery}&quot;</p>
                  ) : (
                    <MobileCardList
                      data={filtered}
                      renderCard={(b: TodayBooking) => {
                        const [sh, sm] = b.start_time.split(":").map(Number);
                        const [eh, em] = b.end_time.split(":").map(Number);
                        const dur = (eh * 60 + em) - (sh * 60 + sm);
                        return (
                          <div className="space-y-2">
                            <MobileCard
                              title={b.customer_name}
                              subtitle={b.service_name}
                              headerRight={
                                <Badge
                                  text={STATUS_LABELS[b.status] ?? b.status}
                                  variant={STATUS_STYLES[b.status] ?? "warning"}
                                  showDot
                                  dotColor={STATUS_DOT_COLORS[b.status] ?? "bg-yellow-500"}
                                />
                              }
                              fields={[
                                { label: "Time",     value: `${b.start_time} – ${b.end_time}` },
                                { label: "Duration", value: `${dur} min` },
                                { label: "Price",    value: formatPrice(b.total_price) },
                              ]}
                            />
                            <button
                              onClick={() => handleMarkAsDone(b)}
                              disabled={b.status === "done" || markingId === b.id}
                              className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                b.status === "done"
                                  ? "bg-[#2A2A2A] text-[#666] cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {markingId === b.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : b.status === "done" ? "Completed" : "Mark as Done"
                              }
                            </button>
                          </div>
                        );
                      }}
                    />
                  )}
                </div>
              </>
            </TableCard>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
