import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, Mail, X, CheckCircle } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

import { searchInObject, filterByField } from "@/lib/utils/AdminUtils";

import Badge from "@/components/admin/Badge";
import ActionButtons from "@/components/admin/ActionButtons";
import EditModal, { type FormField } from "@/components/admin/EditModal";

import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
type BookingStatus = "pending" | "paid" | "done" | "no_show" | "canceled" | "expired";

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;  
  barber: string;
  service: string;
  date: string;
  time: string;
  endTime: string;
  price: string;
  status: BookingStatus;
  rawStatus: string;       
}

const mapStatus = (s: string): BookingStatus => {
  if (s === "paid")      return "paid";
  if (s === "done")      return "done";
  if (s === "no_show")   return "no_show";
  if (s === "expired")   return "expired";
  if (s === "cancelled") return "canceled";
  return "pending";
};

/* ================= CONSTANTS ================= */
const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "pending",  label: "Pending"    },
  { value: "paid",     label: "Paid"       },
  { value: "done",     label: "Done"       },
  { value: "no_show",  label: "Not Show"   },
  { value: "canceled", label: "Cancelled"  },
  { value: "expired",  label: "Expired"    },
];

// STATUS_STYLES:
const STATUS_STYLES: Record<BookingStatus, "warning" | "success" | "danger" | "info" | "purple" | "default"> = {
  pending:  "warning",
  paid:     "success",
  done:     "info",
  no_show:  "purple",
  canceled: "danger",
  expired:  "default",
};

// STATUS_DOT_COLORS:
const STATUS_DOT_COLORS: Record<BookingStatus, string> = {
  pending:  "bg-yellow-500",
  paid:     "bg-green-500",
  done:     "bg-cyan-500",
  no_show:  "bg-purple-500",
  canceled: "bg-red-500",
  expired:  "bg-gray-500",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:  "Pending",
  paid:     "Paid",
  done:     "Done",
  no_show:  "Not Show",
  canceled: "Cancelled",
  expired:  "Expired",
};

/* ================= COMPONENT ================= */
export default function OwnerBooking() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | BookingStatus>("all");

  const [showEditModal, setShowEditModal]     = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const loadBookings = () => {
    ownerService.getBookings().then((data) => {
      setBookings((data as any[]).map((b: any) => ({
        id:            b.id,
        customerName:  b.customer?.name ?? "-",
        customerEmail: b.customer?.email ?? "-",
        barber:        b.barber?.user?.name ?? b.barber?.name ?? "-",
        service:       b.service?.name ?? "-",
        date:          b.booking_date ?? "-",
        time:          b.start_time ? b.start_time.slice(0, 5) : "-",
        endTime:       b.end_time   ? b.end_time.slice(0, 5)   : "-",
        price:         `Rp ${Number(b.total_price).toLocaleString("id-ID")}`,
        status:        mapStatus(b.status),
        rawStatus:     b.status ?? "pending_payment",
      })));
    }).catch(() => {
      toast.error("Failed to Load", "Could not fetch bookings. Please refresh the page.");
    });
  };

  useEffect(() => { loadBookings(); }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    pending:  bookings.filter((b) => b.status === "pending").length,
    paid:     bookings.filter((b) => b.status === "paid").length,
    done:     bookings.filter((b) => b.status === "done").length,
    canceled: bookings.filter((b) => ["canceled", "no_show", "expired"].includes(b.status)).length,
  }), [bookings]);

  /* ================= FILTER ================= */
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch  = searchInObject(booking, searchQuery, ["customerName", "barber", "service"]);
      const matchesStatus  = filterStatus === "all" ? true : filterByField(booking, "status", filterStatus);
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, filterStatus]);

  const getStatusOptions = (rawStatus: string) => {
    if (rawStatus === "pending_payment") {
      return [
        { value: "paid",     label: "Paid (Mark as Paid)" },
        { value: "canceled", label: "Cancelled"           },
      ];
    }
    if (rawStatus === "paid") {
      return [
        { value: "done",     label: "Done (Service Completed)" },
        { value: "no_show",  label: "Not Show"                 },
        { value: "canceled", label: "Cancelled"                },
      ];
    }
    return [];
  };  

  /* ================= EDIT MODAL FIELDS ================= */
  const editFields: FormField[] = [
    { name: "customerName",  label: "Customer Name", type: "text", disabled: true, helperText: "Customer information cannot be modified" },
    { name: "customerEmail", label: "Email",         type: "text", disabled: true },
    { name: "barber",        label: "Barber",        type: "text", disabled: true },
    { name: "service",       label: "Service",       type: "text", disabled: true },
    { name: "date",          label: "Date",          type: "date", disabled: true },
    { name: "time",          label: "Start Time",    type: "text", disabled: true },
    { name: "endTime",       label: "End Time",      type: "text", disabled: true },
    { name: "price",         label: "Price",         type: "text", disabled: true },
    {
      name: "status",
      label: "Booking Status",
      type: "select",
      required: true,
      options: getStatusOptions(selectedBooking?.rawStatus ?? ""),
      helperText: "Only valid status transitions are shown",
    },
  ];

  /* ================= EDIT HANDLER ================= */
  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    if (!selectedBooking) return;
    setIsLoading(true);
    // Map UI status back to backend status
    const backendStatusMap: Record<string, string> = {
      paid:     "paid",
      done:     "done",
      no_show:  "no_show",
      canceled: "cancelled",
    };
    const backendStatus = backendStatusMap[data.status] ?? data.status;
    try {
      await ownerService.updateBookingStatus(selectedBooking.id, backendStatus);
      loadBookings();
      setShowEditModal(false);
      toast.success("Booking Updated", `Status changed to ${STATUS_LABELS[data.status as BookingStatus] ?? data.status}.`);
      setSelectedBooking(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Update Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (booking: Booking) => (
        <div className="text-white min-w-[120px]">
          <p className="font-semibold text-sm truncate max-w-[150px]">{booking.customerName}</p>
          <div className="flex items-center gap-1 text-xs text-[#B8B8B8] mt-0.5">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{booking.customerEmail}</span>
          </div>
        </div>
      ),
    },
    { key: "barber",   header: "Barber",     headerClassName: "hidden md:table-cell text-left",   className: "hidden md:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm truncate block max-w-[120px]">{booking.barber}</span> },
    { key: "service",  header: "Service",    headerClassName: "hidden lg:table-cell text-left",   className: "hidden lg:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm truncate block max-w-[140px]">{booking.service}</span> },
    { key: "date",     header: "Date",       headerClassName: "hidden sm:table-cell text-left",   className: "hidden sm:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.date}</span> },
    { key: "time",     header: "Start Time", headerClassName: "hidden sm:table-cell text-left",   className: "hidden sm:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.time}</span>    },
    { key: "endTime",  header: "End Time",   headerClassName: "hidden sm:table-cell text-left",   className: "hidden sm:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.endTime}</span> },
    { key: "price",    header: "Price",      headerClassName: "hidden md:table-cell text-left",   className: "hidden md:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.price}</span> },
    {
      key: "status",
      header: "Status",
      render: (booking: Booking) => (
        <Badge text={STATUS_LABELS[booking.status]} variant={STATUS_STYLES[booking.status]} showDot dotColor={STATUS_DOT_COLORS[booking.status]} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      className: "text-right",
      render: (booking: Booking) => {
        const isTerminal = ["done", "canceled", "no_show", "expired"].includes(booking.status);
        if (isTerminal) return <span className="text-[#555] text-xs">—</span>;
        return (
          <ActionButtons actions={[
            { type: "edit", onClick: () => handleEditClick(booking) },
          ]} />
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title="Booking Management"
      subtitle="Manage all booking appointments"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <StatsGrid
          stats={[
            { icon: Clock,        title: "Pending",            value: stats.pending  },
            { icon: Calendar,     title: "Paid (Confirmed)",   value: stats.paid     },
            { icon: CheckCircle,  title: "Done (Completed)",   value: stats.done     },
            { icon: X,            title: "Cancelled/Expired",  value: stats.canceled },
          ]}
          columns={4}
        />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search bookings..."
          filters={[{ label: "Status", value: filterStatus, onChange: (val) => setFilterStatus(val as "all" | BookingStatus), options: STATUS_FILTER_OPTIONS }]}
          isEmpty={filteredBookings.length === 0}
          emptyIcon={Calendar}
          emptyTitle="No bookings found"
          emptyDescription="Try adjusting your filters"
        >
          <div className="hidden md:block overflow-x-auto">
            <DataTable data={filteredBookings} columns={columns} />
          </div>
          <div className="block md:hidden">
            <MobileCardList
              data={filteredBookings}
              renderCard={(booking: Booking) => (
                <MobileCard
                  title={booking.customerName}
                  subtitle={
                    <div className="flex items-center gap-1 text-xs text-[#B8B8B8]">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{booking.customerEmail}</span>
                    </div>
                  }
                  badge={<Badge text={STATUS_LABELS[booking.status]} variant={STATUS_STYLES[booking.status]} showDot dotColor={STATUS_DOT_COLORS[booking.status]} />}
                  fields={[
                    { label: "Barber",        value: booking.barber },
                    { label: "Service",       value: booking.service },
                    { label: "Date",          value: booking.date    },
                    { label: "Start Time",    value: booking.time    },
                    { label: "End Time",      value: booking.endTime },
                    { label: "Price",         value: booking.price },
                  ]}
                  actions={(() => {
                    const isTerminal = ["done", "canceled", "no_show", "expired"].includes(booking.status);
                    if (isTerminal) return undefined;
                    return (
                      <div className="flex justify-end">
                        <ActionButtons actions={[
                          { type: "edit", onClick: () => handleEditClick(booking) },
                        ]} />
                      </div>
                    );
                  })()}
                />
              )}
            />
          </div>
        </TableCard>
      </div>

      <EditModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedBooking(null); }}
        onSave={handleSaveEdit}
        title="Update Booking Status"
        subtitle="Only booking status can be modified. Other details are locked."
        fields={editFields}
        initialData={selectedBooking || {}}
        isLoading={isLoading}
        saveButtonText="Update Status"
      />

    </DashboardLayout>
  );
}