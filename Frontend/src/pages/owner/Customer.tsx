import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, UserX } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

import { searchInObject, filterByField, capitalizeFirst } from "@/lib/utils/AdminUtils";

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
interface Customer {
  id: number;
  name: string;
  email: string;
  totalBookings: number;
  lastVisit: string;
  totalSpent: string;
  status: "active" | "banned";
  bannedReason?: string;
}


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

  const [showEditModal, setShowEditModal]       = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading]               = useState(false);

  const { user, logout } = useAuth();

  const formatSpent = (amount: number) =>
    `Rp ${amount.toLocaleString("id-ID")}`;

  const loadCustomers = () => {
    ownerService.getCustomers().then((data) => {
      setCustomers(data.map((c) => ({
        id:            c.id,
        name:          c.name,
        email:         c.email,
        totalBookings: c.total_bookings,
        lastVisit:     c.last_visit ?? "-",
        totalSpent:    formatSpent(c.total_spent),
        status:        c.status,
        bannedReason:  c.banned_reason ?? undefined,
      })));
    }).catch(() => {
      toast.error("Failed to Load", "Could not fetch customers. Please refresh the page.");
    });
  };

  useEffect(() => { loadCustomers(); }, []);

  const stats = useMemo(() => ({
    total:  customers.length,
    active: customers.filter((c) => c.status === "active").length,
    banned: customers.filter((c) => c.status === "banned").length,
  }), [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch = searchInObject(customer, searchQuery, ["name", "email"]);
      return matchesSearch && filterByField(customer, "status", filterStatus);
    });
  }, [customers, searchQuery, filterStatus]);

  const editFields: FormField[] = [
    { name: "name",          label: "Customer Name",   type: "text",     disabled: true, helperText: "Customer information cannot be modified" },
    { name: "email",         label: "Email Address",   type: "email",    disabled: true },
    { name: "totalBookings", label: "Total Bookings",  type: "number",   disabled: true },
    { name: "lastVisit",     label: "Last Visit",      type: "text",     disabled: true },
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
    if (!selectedCustomer) return;
    setIsLoading(true);
    try {
      await ownerService.updateCustomerStatus(selectedCustomer.id, {
        status:        data.status as "active" | "banned",
        banned_reason: data.status === "banned" ? data.bannedReason : undefined,
      });
      loadCustomers();
      setShowEditModal(false);
      const action = data.status === "banned" ? "banned" : "reactivated";
      toast.success("Customer Updated", `${selectedCustomer.name} has been ${action}.`);
      setSelectedCustomer(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Update Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "name",    header: "Name",    render: (customer: Customer) => <span className="text-white font-semibold">{customer.name}</span> },
    { key: "contact", header: "Email", render: (customer: Customer) => (
        <span className="text-[#B8B8B8] text-sm">{customer.email}</span>
    )},
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
      headerClassName: "text-center",
      className: "text-center",
      render: (customer: Customer) => (
        <ActionButtons actions={[
          { type: "edit", onClick: () => handleEditClick(customer) },
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
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
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
          <div className="hidden md:block overflow-x-auto">
            <DataTable data={filteredCustomers} columns={columns} />
          </div>
          <div className="block md:hidden">
            <MobileCardList
              data={filteredCustomers}
              renderCard={(customer: Customer) => (
                <MobileCard
                  title={customer.name}
                  subtitle={<p className="text-xs text-[#B8B8B8]">{customer.email}</p>}
                  headerRight={
                    <div className="flex flex-col items-end gap-1">
                      <Badge text={capitalizeFirst(customer.status)} variant={STATUS_STYLES[customer.status]} showDot dotColor={STATUS_DOT_COLORS[customer.status]} />
                      {customer.status === "banned" && customer.bannedReason && (
                        <p className="text-xs text-red-400 text-right max-w-[120px] truncate">{customer.bannedReason}</p>
                      )}
                    </div>
                  }
                  fields={[
                    { label: "Total Bookings", value: customer.totalBookings },
                    { label: "Last Visit",     value: customer.lastVisit     },
                    { label: "Total Spent",    value: customer.totalSpent    },
                  ]}
                  actions={
                    <div className="flex justify-end">
                      <ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(customer) }]} />
                    </div>
                  }
                />
              )}
            />
          </div>
        </TableCard>
      </div>

      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedCustomer(null); }} onSave={handleSaveEdit} title="Update Customer Status" subtitle="Change account status and provide reason if banning. Other customer details are locked." fields={editFields} initialData={selectedCustomer || {}} isLoading={isLoading} saveButtonText="Update Status" />
    </DashboardLayout>
  );
}