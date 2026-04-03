import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, Phone, X } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import { searchInObject, filterByField, capitalizeFirst } from "@/lib/utils/AdminUtils";

import Badge from "@/components/admin/Badge";
import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";
import EditModal, { type FormField } from "@/components/admin/EditModal";

import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
type BookingStatus = "pending" | "paid" | "canceled";

interface Booking {
  id: number;
  customerName: string;
  customerPhone: string;
  barber: string;
  service: string;
  date: string;
  time: string;
  price: string;
  status: BookingStatus;
}

/* ================= DUMMY DATA ================= */
const DUMMY_BOOKINGS: Booking[] = [
  { id: 1, customerName: "Ahmad Wijaya",  customerPhone: "081234567890", barber: "John Barber",  service: "Premium Haircut",      date: "2024-02-15", time: "10:00", price: "Rp 75,000",  status: "paid"    },
  { id: 2, customerName: "Budi Santoso",  customerPhone: "082345678901", barber: "Mike Stylist", service: "Haircut + Beard Trim", date: "2024-02-15", time: "11:30", price: "Rp 100,000", status: "pending" },
  { id: 3, customerName: "Chandra Putra", customerPhone: "083456789012", barber: "David Cut",    service: "Basic Haircut",        date: "2024-02-14", time: "14:00", price: "Rp 50,000",  status: "canceled"},
];

/* ================= CONSTANTS ================= */
const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "pending",  label: "Pending"    },
  { value: "paid",     label: "Paid"       },
  { value: "canceled", label: "Canceled"   },
];

const STATUS_STYLES: Record<BookingStatus, "warning" | "success" | "danger"> = {
  pending:  "warning",
  paid:     "success",
  canceled: "danger",
};

const STATUS_DOT_COLORS: Record<BookingStatus, string> = {
  pending:  "bg-yellow-500",
  paid:     "bg-green-500",
  canceled: "bg-red-500",
};

/* ================= COMPONENT ================= */
export default function OwnerBooking() {
  const toast = useToast();

  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | BookingStatus>("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const currentUser = getUser();

  useEffect(() => { setBookings(DUMMY_BOOKINGS); }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    pending:  bookings.filter((b) => b.status === "pending").length,
    paid:     bookings.filter((b) => b.status === "paid").length,
    canceled: bookings.filter((b) => b.status === "canceled").length,
  }), [bookings]);

  /* ================= FILTER ================= */
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch  = searchInObject(booking, searchQuery, ["customerName", "barber", "service"]);
      const matchesStatus  = filterStatus === "all" ? true : filterByField(booking, "status", filterStatus);
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, filterStatus]);

  /* ================= EDIT MODAL FIELDS ================= */
  const editFields: FormField[] = [
    { name: "customerName",  label: "Customer Name",  type: "text",   disabled: true, helperText: "Customer information cannot be modified" },
    { name: "customerPhone", label: "Phone Number",   type: "text",   disabled: true },
    { name: "barber",        label: "Barber",         type: "text",   disabled: true },
    { name: "service",       label: "Service",        type: "text",   disabled: true },
    { name: "date",          label: "Date",           type: "date",   disabled: true },
    { name: "time",          label: "Time",           type: "text",   disabled: true },
    { name: "price",         label: "Price",          type: "text",   disabled: true },
    {
      name: "status",
      label: "Booking Status",
      type: "select",
      required: true,
      options: [
        { value: "pending",  label: "Pending"  },
        { value: "paid",     label: "Paid"     },
        { value: "canceled", label: "Canceled" },
      ],
      helperText: "Update the booking status based on payment or cancellation",
    },
  ];

  /* ================= EDIT HANDLER ================= */
  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking?.id
            ? { ...booking, status: data.status as BookingStatus }
            : booking
        )
      );
      setShowEditModal(false);
      toast.success("Booking Updated", `Status changed to ${capitalizeFirst(data.status)}.`);
      setSelectedBooking(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedBooking) return;
    const name = selectedBooking.customerName;
    setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
    setShowDeleteModal(false);
    setSelectedBooking(null);
    toast.success("Booking Deleted", `Booking for ${name} has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBooking(null);
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
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{booking.customerPhone}</span>
          </div>
        </div>
      ),
    },
    { key: "barber",   header: "Barber",   headerClassName: "hidden md:table-cell", className: "hidden md:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm truncate block max-w-[120px]">{booking.barber}</span> },
    { key: "service",  header: "Service",  headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm truncate block max-w-[140px]">{booking.service}</span> },
    { key: "date", header: "Date", headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.date}</span> },
    { key: "time", header: "Time", headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.time}</span> },
    { key: "price",    header: "Price",    headerClassName: "hidden md:table-cell", className: "hidden md:table-cell", render: (booking: Booking) => <span className="text-[#B8B8B8] text-sm whitespace-nowrap">{booking.price}</span> },
    {
      key: "status",
      header: "Status",
      render: (booking: Booking) => (
        <Badge text={capitalizeFirst(booking.status)} variant={STATUS_STYLES[booking.status]} showDot dotColor={STATUS_DOT_COLORS[booking.status]} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (booking: Booking) => (
        <ActionButtons actions={[
          { type: "edit",   onClick: () => handleEditClick(booking)   },
          { type: "delete", onClick: () => handleDeleteClick(booking) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Booking Management"
      subtitle="Manage all booking appointments"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={currentUser ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <StatsGrid
          stats={[
            { icon: Clock,    title: "Pending Bookings",  value: stats.pending  },
            { icon: Calendar, title: "Paid Bookings",     value: stats.paid     },
            { icon: X,        title: "Canceled Bookings", value: stats.canceled },
          ]}
          columns={3}
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
                  subtitle={<div className="flex items-center gap-1 text-xs text-[#B8B8B8]"><Phone className="w-3 h-3 flex-shrink-0" /><span className="truncate">{booking.customerPhone}</span></div>}
                  badge={<Badge text={capitalizeFirst(booking.status)} variant={STATUS_STYLES[booking.status]} showDot dotColor={STATUS_DOT_COLORS[booking.status]} />}
                  fields={[
                    { label: "Barber",        value: booking.barber },
                    { label: "Service",       value: booking.service },
                    { label: "Date", value: booking.date },
                    { label: "Time", value: booking.time },
                    { label: "Price",         value: booking.price },
                  ]}
                  actions={
                    <ActionButtons actions={[
                      { type: "edit",   onClick: () => handleEditClick(booking)   },
                      { type: "delete", onClick: () => handleDeleteClick(booking) },
                    ]} />
                  }
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

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Booking"
        itemName={selectedBooking?.customerName ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </DashboardLayout>
  );
}