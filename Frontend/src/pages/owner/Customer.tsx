import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, UserX } from "lucide-react";

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
interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  lastVisit: string;
  totalSpent: string;
  status: "active" | "banned";
  bannedReason?: string;
}

/* ================= DUMMY DATA ================= */
const DUMMY_CUSTOMERS: Customer[] = [
  { id: 1, name: "Ahmad Wijaya",   phone: "081234567890", email: "ahmad@example.com",   totalBookings: 15, lastVisit: "2024-02-10", totalSpent: "Rp 1,125,000", status: "active" },
  { id: 2, name: "Budi Santoso",   phone: "082345678901", email: "budi@example.com",    totalBookings: 8,  lastVisit: "2024-02-05", totalSpent: "Rp 600,000",   status: "active" },
  { id: 3, name: "Chandra Putra",  phone: "083456789012", email: "chandra@example.com", totalBookings: 3,  lastVisit: "2024-01-20", totalSpent: "Rp 225,000",   status: "banned", bannedReason: "Repeatedly missed appointments without notice" },
  { id: 4, name: "Dedi Kurniawan", phone: "084567890123", email: "dedi@example.com",    totalBookings: 20, lastVisit: "2024-02-12", totalSpent: "Rp 1,500,000", status: "active" },
  { id: 5, name: "Eko Prasetyo",   phone: "085678901234", email: "eko@example.com",     totalBookings: 12, lastVisit: "2024-02-08", totalSpent: "Rp 900,000",   status: "active" },
  { id: 6, name: "Fajar Ramadhan", phone: "086789012345", email: "fajar@example.com",   totalBookings: 5,  lastVisit: "2024-01-15", totalSpent: "Rp 375,000",   status: "banned", bannedReason: "Inappropriate behavior towards staff" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",    label: "All Status" },
  { value: "active", label: "Active"     },
  { value: "banned", label: "Banned"     },
];

const STATUS_STYLES    = { active: "success" as const, banned: "danger" as const };
const STATUS_DOT_COLORS = { active: "bg-green-500" as const, banned: "bg-red-500" as const };

export default function OwnerCustomers() {
  const toast = useToast();

  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading]               = useState(false);

  const currentUser = getUser();

  useEffect(() => { setCustomers(DUMMY_CUSTOMERS); }, []);

  const stats = useMemo(() => ({
    total:  customers.length,
    active: customers.filter((c) => c.status === "active").length,
    banned: customers.filter((c) => c.status === "banned").length,
  }), [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch = searchInObject(customer, searchQuery, ["name", "phone", "email"]);
      return matchesSearch && filterByField(customer, "status", filterStatus);
    });
  }, [customers, searchQuery, filterStatus]);

  const editFields: FormField[] = [
    { name: "name",          label: "Customer Name",   type: "text",     disabled: true, helperText: "Customer information cannot be modified" },
    { name: "phone",         label: "Phone Number",    type: "text",     disabled: true },
    { name: "email",         label: "Email Address",   type: "email",    disabled: true },
    { name: "totalBookings", label: "Total Bookings",  type: "number",   disabled: true },
    { name: "lastVisit",     label: "Last Visit",      type: "date",     disabled: true },
    { name: "totalSpent",    label: "Total Spent",     type: "text",     disabled: true },
    {
      name: "status",
      label: "Account Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "banned", label: "Banned" },
      ],
      helperText: "Change customer account status (Active or Banned)",
    },
    {
      name: "bannedReason",
      label: "Reason for Ban",
      type: "textarea",
      placeholder: "Enter reason for banning this customer...",
      rows: 4,
      helperText: "Required when status is set to Banned",
      showAsterisk: true,
      validation: (value: any, allData?: Record<string, any>) =>
        allData?.status === "banned" && !value?.trim()
          ? "Reason for ban is required when status is Banned."
          : null,
    },
  ];

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === selectedCustomer?.id
            ? { ...customer, status: data.status as "active" | "banned", bannedReason: data.status === "banned" ? data.bannedReason : undefined }
            : customer
        )
      );
      setShowEditModal(false);
      const action = data.status === "banned" ? "banned" : "reactivated";
      toast.success("Customer Updated", `${selectedCustomer?.name} has been ${action}.`);
      setSelectedCustomer(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedCustomer) return;
    const name = selectedCustomer.name;
    setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id));
    setShowDeleteModal(false);
    setSelectedCustomer(null);
    toast.success("Customer Deleted", `${name} has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedCustomer(null);
  };

  const columns = [
    { key: "name",    header: "Name",    render: (customer: Customer) => <span className="text-white font-semibold">{customer.name}</span> },
    { key: "contact", header: "Contact", render: (customer: Customer) => <div className="text-[#B8B8B8]"><p>{customer.phone}</p><p className="text-xs">{customer.email}</p></div> },
    { key: "totalBookings", header: "Total Bookings", render: (customer: Customer) => <span className="text-[#B8B8B8]">{customer.totalBookings}</span> },
    { key: "lastVisit",     header: "Last Visit",     render: (customer: Customer) => <span className="text-[#B8B8B8]">{customer.lastVisit}</span> },
    { key: "totalSpent",    header: "Total Spent",    render: (customer: Customer) => <span className="text-[#B8B8B8] font-medium">{customer.totalSpent}</span> },
    {
      key: "status",
      header: "Status",
      render: (customer: Customer) => (
        <div>
          <Badge text={capitalizeFirst(customer.status)} variant={STATUS_STYLES[customer.status]} showDot dotColor={STATUS_DOT_COLORS[customer.status]} />
          {customer.status === "banned" && customer.bannedReason && (
            <p className="text-xs text-red-400 mt-1 max-w-[200px] truncate" title={customer.bannedReason}>{customer.bannedReason}</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (customer: Customer) => (
        <ActionButtons actions={[
          { type: "edit",   onClick: () => handleEditClick(customer)   },
          { type: "delete", onClick: () => handleDeleteClick(customer) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Customer Management"
      subtitle="Manage all customers"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={currentUser ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <StatsGrid stats={[{ icon: Users, title: "Total Customer", value: stats.total }, { icon: UserCheck, title: "Active Customer", value: stats.active }, { icon: UserX, title: "Banned Customer", value: stats.banned }]} columns={3} />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search customers..."
          filters={[{ label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_FILTER_OPTIONS }]}
          isEmpty={filteredCustomers.length === 0}
          emptyIcon={Users}
          emptyTitle="No customers found"
          emptyDescription="Try adjusting your filters"
        >
          <DataTable data={filteredCustomers} columns={columns} />
          <MobileCardList
            data={filteredCustomers}
            renderCard={(customer: Customer) => (
              <MobileCard
                title={customer.name}
                subtitle={<p className="text-xs text-[#B8B8B8]">{customer.phone}</p>}
                headerRight={
                  <div>
                    <Badge text={capitalizeFirst(customer.status)} variant={STATUS_STYLES[customer.status]} showDot dotColor={STATUS_DOT_COLORS[customer.status]} />
                    {customer.status === "banned" && customer.bannedReason && <p className="text-xs text-red-400 mt-1">{customer.bannedReason}</p>}
                  </div>
                }
                fields={[
                  { label: "Email",          value: customer.email          },
                  { label: "Total Bookings", value: customer.totalBookings  },
                  { label: "Last Visit",     value: customer.lastVisit      },
                  { label: "Total Spent",    value: customer.totalSpent     },
                ]}
                actions={<ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(customer) }, { type: "delete", onClick: () => handleDeleteClick(customer) }]} />}
              />
            )}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedCustomer(null); }} onSave={handleSaveEdit} title="Update Customer Status" subtitle="Change account status and provide reason if banning. Other customer details are locked." fields={editFields} initialData={selectedCustomer || {}} isLoading={isLoading} saveButtonText="Update Status" />
      <DeleteModal isOpen={showDeleteModal} title="Delete Customer" itemName={selectedCustomer?.name || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}