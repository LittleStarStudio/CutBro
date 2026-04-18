import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Store, Crown, MapPin, Star, Users, TrendingUp, X } from "lucide-react";

import StatsGrid from "@/components/admin/StatGrid";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as adminService from "@/services/admin.service";

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

/* ================= HELPERS ================= */

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}K`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/* ================= COMPONENT ================= */

export default function Barbershops() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [stats, setStats] = useState({ total: 0, free: 0, pro: 0, premium: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Barbershop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewShop, setSelectedViewShop] = useState<Barbershop | null>(null);

  /* ================= LOAD ================= */

  const loadStats = async () => {
    try {
      const data = await adminService.getBarbershopStats();
      setStats(data);
    } catch { /* silent */ }
  };

  const loadBarbershops = async () => {
    try {
      const result = await adminService.getAdminBarbershops();
      setBarbershops(
        result.data.map((s) => ({
          id:       s.id,
          name:     s.name,
          owner:    s.owner,
          location: s.location,
          plan:     s.plan,
          barbers:  s.barbers,
          status:   s.status,
          revenue:  formatRevenue(s.revenue),
          rate:     s.rate,
          logo_url: s.logo_url ?? null,
        }))
      );
    } catch { /* silent */ }
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadBarbershops(); }, []);

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
      name: "photo",
      label: "Shop Photo",
      type: "image" as const,
      disabled: false,
      placeholderIcon: Store,
    },
    {
      name: "name",
      label: "Barbershop Name",
      type: "text",
      required: true,
      placeholder: "Enter barbershop name",
      validation: (value) =>
        value.length >= 3 ? null : "Minimum 3 characters",
    },
    { name: "owner",    label: "Owner Name", type: "text", required: true },
    { name: "location", label: "Location",   type: "text", required: true },
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

  const handleViewClick = (shop: Barbershop) => {
    setSelectedViewShop(shop);
    setShowViewModal(true);
  };

  const handleSaveEdit = async (data: Record<string, string | number>) => {
    if (!selectedShop) return;
    setIsLoading(true);
    try {
      const payload: Record<string, any> = {
        name:              data.name as string,
        owner_name:        data.owner as string,
        city:              data.location as string,
        subscription_plan: (data.plan as string).toLowerCase(),
        status:            data.status as string,
      };
      if (typeof data.photo === "string" && data.photo.startsWith("data:image")) {
        payload.photo_base64 = data.photo;
      }
      await adminService.updateAdminBarbershop(selectedShop.id, payload);
      setShowEditModal(false);
      setSelectedShop(null);
      toast.success("Barbershop Updated", `${selectedShop.name} updated successfully.`);
      await Promise.all([loadStats(), loadBarbershops()]);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDeleteClick = (shop: Barbershop) => {
    if (shop.status === "active") {
      toast.error("Cannot Delete", "Active barbershop cannot be deleted.");
      return;
    }
    setSelectedShop(shop);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedShop) return;
    const name = selectedShop.name;
    try {
      await adminService.deleteAdminBarbershop(selectedShop.id);
      setShowDeleteModal(false);
      setSelectedShop(null);
      toast.success("Barbershop Deleted", `${name} has been removed.`);
      await Promise.all([loadStats(), loadBarbershops()]);
    } catch {
      toast.error("Delete Failed", "Something went wrong. Please try again.");
    }
  };

  /* ================= TABLE COLUMNS ================= */

    const columns = useMemo(
      () => [
        {
          key: "name",
          header: "Shop",
          headerClassName: "text-left w-[180px]",
          render: (shop: Barbershop) => (
            <div className="w-[180px]">
              <p className="text-white font-semibold truncate">{shop.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={12} />
                <span className="truncate">{shop.location}</span>
              </p>
            </div>
          ),
        },
        {
          key: "owner",
          header: "Owner",
          headerClassName: "text-left w-[140px]",
          render: (shop: Barbershop) => (
            <span className="text-muted-foreground w-[140px] block truncate">
              {shop.owner}
            </span>
          ),
        },
        {
          key: "plan",
          header: "Plan",
          headerClassName: "text-left w-[100px]",
          render: (shop: Barbershop) => (
            <div className="w-[100px]">
              <Badge text={shop.plan} variant={PLAN_STYLES[shop.plan]} />
            </div>
          ),
        },
        {
          key: "barbers",
          header: "Barbers",
          headerClassName: "text-left w-[80px]", // ← ganti text-center jadi text-left
          className: "text-left",                // ← ganti text-center jadi text-left
          render: (shop: Barbershop) => (
            <span className="block text-left w-[80px]">{shop.barbers}</span> // ← text-left
          ),
        },
        {
          key: "revenue",
          header: "Revenue",
          headerClassName: "text-left w-[110px]",
          render: (shop: Barbershop) => (
            <span className="font-medium w-[110px] block">{shop.revenue}</span>
          ),
        },
        {
          key: "rate",
          header: "Rate",
          headerClassName: "text-left w-[80px]",
          render: (shop: Barbershop) => (
            <div className="flex items-center gap-1 w-[80px]">
              <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="font-medium text-white">{shop.rate.toFixed(1)}</span>
            </div>
          ),
        },
        {
          key: "status",
          header: "Status",
          headerClassName: "text-left w-[100px]",
          render: (shop: Barbershop) => (
            <div className="w-[100px]">
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
          headerClassName: "text-center w-[80px]",
          className: "text-center",
          render: (shop: Barbershop) => (
            <div className="flex justify-center w-[80px]">
              <ActionButtons
                actions={[
                  { type: "view",   onClick: () => handleViewClick(shop)   },
                  { type: "edit",   onClick: () => handleEditClick(shop)   },
                  { type: "delete", onClick: () => handleDeleteClick(shop) },
                ]}
              />
            </div>
          ),
        },
      ],
      [handleViewClick, handleEditClick, handleDeleteClick]
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
        user ?? {
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
              title: "Free",
              value: stats.free,
              iconBgColor: "bg-[#60A5FA1A]",
              iconColor: "text-[#60A5FA]",
            },
            {
              icon: TrendingUp,
              title: "Pro",
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
                      align="end"
                      actions={[
                        { type: "view",   onClick: () => handleViewClick(shop)   },
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
        initialData={{ ...selectedShop, photo: selectedShop?.logo_url ?? "" }}
        isLoading={isLoading}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Barbershop"
        itemName={selectedShop?.name ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {showViewModal && selectedViewShop && (
        <ViewBarbershopModal
          shop={selectedViewShop}
          onClose={() => { setShowViewModal(false); setSelectedViewShop(null); }}
        />
      )}

    </DashboardLayout>
  );
}

function ViewField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-sm text-white">
        {children ?? value}
      </div>
    </div>
  );
}

function ViewBarbershopModal({
  shop,
  onClose,
}: {
  shop: Barbershop;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-white font-semibold text-lg">Barbershop Detail</h3>
            <p className="text-zinc-400 text-sm mt-0.5">View barbershop information</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Shop Photo Preview */}
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="w-full h-44 object-cover rounded-xl border border-zinc-700/40"
            />
          ) : (
            <div className="w-full h-44 bg-zinc-800/60 border border-zinc-700/40 rounded-xl flex flex-col items-center justify-center gap-2">
              <Store size={40} className="text-zinc-600" />
              <span className="text-xs text-zinc-500">No photo uploaded</span>
            </div>
          )}

          <ViewField label="Barbershop Name" value={shop.name} />
          <ViewField label="Owner" value={shop.owner} />
          <ViewField label="Location" value={shop.location} />
          <ViewField label="Subscription Plan">
            <Badge text={shop.plan} variant={PLAN_STYLES[shop.plan]} />
          </ViewField>
          <div className="grid grid-cols-2 gap-3">
            <ViewField label="Total Barbers" value={String(shop.barbers)} />
            <ViewField label="Revenue" value={shop.revenue} />
          </div>
          <ViewField label="Rating" value={`⭐ ${shop.rate.toFixed(1)}`} />
          <ViewField label="Status">
            <Badge
              text={capitalizeFirst(shop.status)}
              variant={STATUS_STYLES[shop.status]}
              showDot
              dotColor={STATUS_DOT_COLORS[shop.status]}
            />
          </ViewField>
        </div>
      </div>
    </div>
  );
}
