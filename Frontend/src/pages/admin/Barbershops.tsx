import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Store, Crown, MapPin, Star, Users, TrendingUp } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Barbershop | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ================= LOAD ================= */

  const loadStats = async () => {
    try {
      const data = await adminService.getBarbershopStats();
      setStats(data);
    } catch { /* silent */ }
  };

  const loadBarbershops = async (p: number) => {
    try {
      const result = await adminService.getAdminBarbershops(p);
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
        }))
      );
      setLastPage(result.last_page);
    } catch { /* silent */ }
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadBarbershops(page); }, [page]);

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

  const handleSaveEdit = async (data: Record<string, string | number>) => {
    if (!selectedShop) return;
    setIsLoading(true);
    try {
      await adminService.updateAdminBarbershop(selectedShop.id, {
        name:              data.name as string,
        owner_name:        data.owner as string,
        city:              data.location as string,
        subscription_plan: (data.plan as string).toLowerCase(),
        status:            data.status as string,
      });
      setShowEditModal(false);
      setSelectedShop(null);
      toast.success("Barbershop Updated", `${selectedShop.name} updated successfully.`);
      await Promise.all([loadStats(), loadBarbershops(page)]);
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
      const newPage = barbershops.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      if (newPage === page) await Promise.all([loadStats(), loadBarbershops(page)]);
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

        {/* ================= PAGINATION ================= */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-md bg-card border border-border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="px-3 py-1.5 text-sm rounded-md bg-card border border-border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        )}
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
