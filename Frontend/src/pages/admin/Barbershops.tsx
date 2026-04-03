import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Store, Crown, MapPin, Star, Users, TrendingUp } from "lucide-react";

import StatsGrid from "@/components/admin/StatGrid";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import type { Barbershop } from "@/type/AdminType";

import {
  searchInObject,
  filterByField,
  capitalizeFirst,
} from "@/lib/utils/AdminUtils";

import {
  PLAN_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  PLAN_STYLES,
  STATUS_STYLES,
  STATUS_DOT_COLORS,
} from "@/components/entities/constants/AdminConstants";

import Badge from "@/components/admin/Badge";
import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";
import EditModal, { type FormField } from "@/components/admin/EditModal";

import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useToast } from "@/components/ui/Toast";

/* ================= DUMMY DATA ================= */

const DUMMY_BARBERSHOPS: Barbershop[] = [
  {
    id: 1,
    name: "Classic Cuts",
    owner: "John Doe",
    location: "Jakarta Selatan",
    plan: "Premium",
    barbers: 8,
    status: "active",
    revenue: "Rp 12.5M",
    rate: 4.8,
  },
  {
    id: 2,
    name: "Barber King",
    owner: "Jane Smith",
    location: "Bandung",
    plan: "Pro",
    barbers: 5,
    status: "active",
    revenue: "Rp 8.2M",
    rate: 4.5,
  },
  {
    id: 3,
    name: "Pro Barber Shop",
    owner: "Alice Brown",
    location: "Surabaya",
    plan: "Free",
    barbers: 1,
    status: "inactive",
    revenue: "Rp 1.5M",
    rate: 3.2,
  },
];

/* ================= COMPONENT ================= */

export default function Barbershops() {
  const toast = useToast();

  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Barbershop | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = getUser();

  /* ================= FETCH (DUMMY) ================= */

  useEffect(() => {
    setBarbershops(DUMMY_BARBERSHOPS);
  }, []);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    return {
      total:   barbershops.length,
      free:    barbershops.filter((s) => s.plan === "Free").length,
      pro:     barbershops.filter((s) => s.plan === "Pro").length,
      premium: barbershops.filter((s) => s.plan === "Premium").length,
    };
  }, [barbershops]);

  /* ================= FILTER ================= */

  const filteredBarbershops = useMemo(() => {
    return barbershops.filter((shop) => {
      const matchesSearch = searchInObject(shop, searchQuery, [
        "name",
        "owner",
        "location",
      ]);

      return (
        matchesSearch &&
        filterByField(shop, "plan", filterPlan) &&
        filterByField(shop, "status", filterStatus)
      );
    });
  }, [barbershops, searchQuery, filterPlan, filterStatus]);

  /* ================= EDIT FIELDS ================= */

  const editFields: FormField[] = [
    {
      name: "name",
      label: "Barbershop Name",
      type: "text",
      required: true,
      placeholder: "Enter barbershop name",
      validation: (value) =>
        value.length >= 3 ? null : "Minimum 3 characters",
    },
    { name: "owner",    label: "Owner Name",     type: "text",   required: true },
    { name: "location", label: "Location",        type: "text",   required: true },
    {
      name: "plan",
      label: "Subscription Plan",
      type: "select",
      required: true,
      options: [
        { value: "Free",    label: "Free"    },
        { value: "Pro",     label: "Pro"     },
        { value: "Premium", label: "Premium" },
      ],
    },
    {
      name: "barbers",
      label: "Number of Barbers",
      type: "number",
      required: true,
      validation: (value) =>
        Number(value) > 0 ? null : "At least 1 barber required",
    },
    { name: "revenue", label: "Monthly Revenue", type: "text",   placeholder: "Rp 10.5M" },
    {
      name: "rate",
      label: "Rating",
      type: "number",
      placeholder: "0.0 - 5.0",
      validation: (value) =>
        Number(value) >= 0 && Number(value) <= 5
          ? null
          : "Rating must be between 0 and 5",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "active",   label: "Active"   },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  /* ================= EDIT ================= */

  const handleEditClick = (shop: Barbershop) => {
    setSelectedShop(shop);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, string | number>) => {
    if (!selectedShop) return;
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setBarbershops((prev) =>
        prev.map((shop) =>
          shop.id === selectedShop.id
            ? { ...shop, ...data, barbers: Number(data.barbers), rate: Number(data.rate) }
            : shop
        )
      );
      setShowEditModal(false);
      toast.success("Barbershop Updated", `${selectedShop.name} has been updated successfully.`);
      setSelectedShop(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDeleteClick = (shop: Barbershop) => {
    setSelectedShop(shop);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedShop) return;
    const name = selectedShop.name;
    setBarbershops((prev) => prev.filter((s) => s.id !== selectedShop.id));
    setShowDeleteModal(false);
    setSelectedShop(null);
    toast.success("Barbershop Deleted", `${name} has been removed.`);
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Shop",
        render: (shop: Barbershop) => (
          <div className="min-w-[140px]">
            <p className="text-white font-semibold truncate max-w-[160px]">{shop.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin size={12} />
              <span className="truncate max-w-[120px]">{shop.location}</span>
            </p>
          </div>
        ),
      },
      {
        key: "owner",
        header: "Owner",
        render: (shop: Barbershop) => (
          <span className="text-muted-foreground whitespace-nowrap min-w-[100px] block">
            {shop.owner}
          </span>
        ),
      },
      {
        key: "plan",
        header: "Plan",
        render: (shop: Barbershop) => (
          <div className="min-w-[80px]">
            <Badge text={shop.plan} variant={PLAN_STYLES[shop.plan]} />
          </div>
        ),
      },
      {
        key: "barbers",
        header: "Barbers",
        render: (shop: Barbershop) => (
          <span className="whitespace-nowrap">{shop.barbers}</span>
        ),
      },
      {
        key: "revenue",
        header: "Revenue",
        render: (shop: Barbershop) => (
          <span className="font-medium whitespace-nowrap min-w-[80px] block">{shop.revenue}</span>
        ),
      },
      {
        key: "rate",
        header: "Rate",
        render: (shop: Barbershop) => (
          <div className="flex items-center gap-1 min-w-[70px]">
            <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="font-medium text-white">{shop.rate.toFixed(1)}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (shop: Barbershop) => (
          <div className="min-w-[80px]">
            <Badge
              text={capitalizeFirst(shop.status)}
              variant={STATUS_STYLES[shop.status]}
              showDot
              dotColor={STATUS_DOT_COLORS[shop.status]}
            />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (shop: Barbershop) => (
          <ActionButtons
            actions={[
              { type: "edit",   onClick: () => handleEditClick(shop)   },
              { type: "delete", onClick: () => handleDeleteClick(shop) },
            ]}
          />
        ),
      },
    ],
    [handleEditClick, handleDeleteClick]
  );

  /* ================= UI ================= */

  return (
    <DashboardLayout
      title="Barbershops Management"
      subtitle="Manage all registered barbershops"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={
        currentUser ?? {
          name:  "Super Admin",
          email: "admin@cutbro.com",
          role:  "admin",
        }
      }
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={4}
          stats={[
            {
              icon: Store,
              title: "Total",
              value: stats.total,
              iconBgColor: "bg-[#22C55E1A]",
              iconColor: "text-[#22C55E]",
            },
            {
              icon: Users,
              title: "Free Plan",
              value: stats.free,
              iconBgColor: "bg-[#60A5FA1A]",
              iconColor: "text-[#60A5FA]",
            },
            {
              icon: TrendingUp,
              title: "Pro Plan",
              value: stats.pro,
              iconBgColor: "bg-[#F59E0B1A]",
              iconColor: "text-[#F59E0B]",
            },
            {
              icon: Crown,
              title: "Premium",
              value: stats.premium,
              iconBgColor: "bg-[#C084FC1A]",
              iconColor: "text-[#C084FC]",
            },
          ]}
        />

        {/* ================= TABLE CARD ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search barbershops..."
          filters={[
            {
              label: "Plan",
              value: filterPlan,
              onChange: setFilterPlan,
              options: PLAN_FILTER_OPTIONS,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredBarbershops.length === 0}
          emptyIcon={Store}
          emptyTitle="No barbershops found"
          emptyDescription="Try adjusting your filters"
        >
          {/* DESKTOP TABLE */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filteredBarbershops} columns={columns} />
          </div>

          {/* MOBILE CARDS */}
          <div className="block md:hidden">
            <MobileCardList
              data={filteredBarbershops}
              renderCard={(shop) => (
                <MobileCard
                  title={shop.name}
                  subtitle={
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} />
                      {shop.location}
                    </span>
                  }
                  headerRight={
                    <Badge
                      text={capitalizeFirst(shop.status)}
                      variant={STATUS_STYLES[shop.status]}
                      showDot
                      dotColor={STATUS_DOT_COLORS[shop.status]}
                    />
                  }
                  fields={[
                    { label: "Owner",   value: shop.owner },
                    {
                      label: "Plan",
                      value: <Badge text={shop.plan} variant={PLAN_STYLES[shop.plan]} />,
                    },
                    { label: "Barbers", value: shop.barbers },
                    { label: "Revenue", value: shop.revenue },
                    { label: "Rate",    value: `⭐ ${shop.rate.toFixed(1)}` },
                  ]}
                  actions={
                    <ActionButtons
                      actions={[
                        { type: "edit",   onClick: () => handleEditClick(shop)   },
                        { type: "delete", onClick: () => handleDeleteClick(shop) },
                      ]}
                    />
                  }
                />
              )}
            />
          </div>
        </TableCard>
      </div>

      {/* ================= MODALS ================= */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedShop(null);
        }}
        onSave={handleSaveEdit}
        title="Edit Barbershop"
        subtitle="Update barbershop information"
        fields={editFields}
        initialData={selectedShop ?? {}}
        isLoading={isLoading}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Barbershop"
        itemName={selectedShop?.name ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </DashboardLayout>
  );
}