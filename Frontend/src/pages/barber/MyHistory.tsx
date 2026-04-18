import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth }     from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";
import StatsGrid       from "@/components/admin/StatGrid";
import TableCard       from "@/components/admin/TableCard";
import DataTable       from "@/components/admin/DataTable";
import MobileCardList  from "@/components/admin/MobileCardList";
import MobileCard      from "@/components/admin/MobileCard";
import Badge           from "@/components/admin/Badge";
import { searchInObject } from "@/lib/utils/AdminUtils";

import {
  getBarberBookingHistory,
  type BarberHistoryBooking,
} from "@/services/barber.service";

/* ── Status config ── */
type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "gold" | "info";

const STATUS_STYLES: Record<string, BadgeVariant> = {
  done:      "success",
  cancelled: "danger",
  no_show:   "warning",
};
const STATUS_DOT_COLORS: Record<string, string> = {
  done:      "bg-emerald-400",
  cancelled: "bg-red-400",
  no_show:   "bg-yellow-400",
};
const STATUS_LABELS: Record<string, string> = {
  done:      "Done",
  cancelled: "Cancelled",
  no_show:   "No Show",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "All Status"   },
  { value: "done",      label: "Done"      },
  { value: "cancelled", label: "Cancelled"   },
  { value: "no_show",   label: "No Show"  },
];

const formatPrice = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDate  = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });

/* ── Main component ── */
export default function BarberActivityPage() {
  const { user: currentUser, logout } = useAuth();

  const [history,      setHistory]      = useState<BarberHistoryBooking[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ── Fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBarberBookingHistory();
      setHistory(data);
    } catch {
      setError("Failed to load booking history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:     history.length,
    done:      history.filter((h) => h.status === "done").length,
    cancelled: history.filter((h) => h.status === "cancelled" || h.status === "no_show").length,
  }), [history]);

  /* ── Filter + Search ── */
  const filtered = useMemo(() =>
    history
      .filter((h) => filterStatus === "all" || h.status === filterStatus)
      .filter((h) => searchInObject(h, searchQuery, ["customer_name", "service_name", "booking_date"])),
    [history, searchQuery, filterStatus]
  );

  /* ── Table columns ── */
  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (h: BarberHistoryBooking) => (
        <span className="text-white font-medium whitespace-nowrap">{h.customer_name}</span>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (h: BarberHistoryBooking) => (
        <span className="text-[#B8B8B8] whitespace-nowrap">{h.service_name}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (h: BarberHistoryBooking) => (
        <span className="text-[#B8B8B8] whitespace-nowrap">{formatDate(h.booking_date)}</span>
      ),
    },
    {
      key: "time",
      header: "Start Time",
      render: (h: BarberHistoryBooking) => (
        <span className="text-[#D4AF37] font-semibold whitespace-nowrap">{h.start_time}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (h: BarberHistoryBooking) => (
        <span className="text-amber-400 font-medium whitespace-nowrap">{formatPrice(h.total_price)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (h: BarberHistoryBooking) => (
        <Badge
          text={STATUS_LABELS[h.status] ?? h.status}
          variant={STATUS_STYLES[h.status] ?? "default"}
          showDot
          dotColor={STATUS_DOT_COLORS[h.status] ?? "bg-gray-400"}
        />
      ),
    },
  ];

  /* ── Render ── */
  return (
    <DashboardLayout
      title="My History"
      subtitle="History of your completed sessions"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={currentUser ?? { name: "Barber", email: "" }}
      showNotification
      onLogout={logout}
    >
      <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">

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
              columns={3}
              stats={[
                { icon: Activity,    title: "Total History", value: stats.total     },
                { icon: CheckCircle, title: "Done",       value: stats.done      },
                { icon: XCircle,     title: "Cancelled/No Show", value: stats.cancelled },
              ]}
            />

            <TableCard
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchPlaceholder="Search customer, service, or date..."
              filters={[
                {
                  label:    "Status",
                  value:    filterStatus,
                  onChange: setFilterStatus,
                  options:  STATUS_FILTER_OPTIONS,
                },
              ]}
              isEmpty={history.length === 0}
              emptyIcon={Activity}
              emptyTitle="No history yet"
              emptyDescription="Booking history will appear here after sessions are completed."
            >
              <div className="hidden md:block w-full overflow-x-auto">
                <DataTable data={filtered} columns={columns} />
              </div>

              <div className="block md:hidden">
                <MobileCardList
                  data={filtered}
                  renderCard={(h: BarberHistoryBooking) => (
                    <MobileCard
                      title={h.customer_name}
                      subtitle={h.service_name}
                      headerRight={
                        <Badge
                          text={STATUS_LABELS[h.status] ?? h.status}
                          variant={STATUS_STYLES[h.status] ?? "default"}
                          showDot
                          dotColor={STATUS_DOT_COLORS[h.status] ?? "bg-gray-400"}
                        />
                      }
                      fields={[
                        { label: "Date",   value: formatDate(h.booking_date) },
                        { label: "Start Time", value: h.start_time               },
                        { label: "Price",     value: formatPrice(h.total_price) },
                      ]}
                    />
                  )}
                />
              </div>
            </TableCard>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
