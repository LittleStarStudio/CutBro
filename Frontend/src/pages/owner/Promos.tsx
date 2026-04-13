import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Tag, Plus, CheckCircle, XCircle, Percent } from "lucide-react";
import StatCard from "@/components/admin/StatsCard";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

import { searchInObject } from "@/lib/utils/AdminUtils";

import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";
import PromoModal from "@/components/admin/PromoModal";

import PageHeader from "@/components/admin/PageHeader";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
interface Promo {
  id: number;
  serviceId: number | null;
  serviceName: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  status: "active" | "inactive";
}

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

export default function OwnerPromos() {
  const toast = useToast();

  const [promos, setPromos]           = useState<Promo[]>([]);
  const [services, setServices] = useState<{ id: number; name: string; price: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedPromo, setSelectedPromo]     = useState<Promo | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const { user, logout } = useAuth();

  const loadPromos = () => {
    ownerService.getServices().then((data) => {
      setServices(
        data
          .filter((s) => s.is_active)             
          .map((s) => ({
            id:    s.id,
            name:  s.name,
            price: typeof s.price === "string" ? parseFloat(s.price) : s.price,
          }))
      );
    }).catch(() => {});

    ownerService.getPromos().then((data) => {
      setPromos(data.map((p) => ({
        id:            p.id,
        serviceId:     p.service_id,    
        serviceName:   p.name,
        originalPrice: p.original_price,
        discount:      p.discount_percent,
        finalPrice:    p.final_price,
        status:        p.is_active ? "active" : "inactive",
      })));
    }).catch(() => {});
  };

  useEffect(() => { loadPromos(); }, []);

  const filteredPromos = useMemo(() => {
    return promos.filter((promo) => searchInObject(promo, searchQuery, ["serviceName"]));
  }, [promos, searchQuery]);

  // Set berisi service_id yang sudah punya promo
  const takenServiceIds = useMemo(() => {
    return new Set(
      promos.map((p) => p.serviceId).filter((id): id is number => id !== null)
    );
  }, [promos]);

  const stats = useMemo(() => ({
    total:    promos.length,
    active:   promos.filter((p) => p.status === "active").length,
    inactive: promos.filter((p) => p.status === "inactive").length,
  }), [promos]);

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: { serviceId: number; discount: number; status: "active" | "inactive" }) => {
    setIsLoading(true);
    try {
      await ownerService.createPromo({
        service_id:       data.serviceId,
        discount_percent: data.discount,
        is_active:        data.status === "active",
      });
      loadPromos();
      setShowAddModal(false);
      toast.success("Promo Added", "New promo has been added.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Add Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEditClick = (promo: Promo) => {
    setSelectedPromo(promo);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: { serviceId: number; discount: number; status: "active" | "inactive" }) => {
    if (!selectedPromo) return;
    setIsLoading(true);
    try {
      await ownerService.updatePromo(selectedPromo.id, {
        service_id:       data.serviceId,
        discount_percent: data.discount,
        is_active:        data.status === "active",
      });
      loadPromos();
      setShowEditModal(false);
      toast.success("Promo Updated", "Promo has been updated.");
      setSelectedPromo(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Update Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (promo: Promo) => {
    setSelectedPromo(promo);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPromo) return;
    const name = selectedPromo.serviceName;
    try {
      await ownerService.deletePromo(selectedPromo.id);
      loadPromos();
      toast.success("Promo Deleted", `${name} promo has been removed.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Delete Failed", msg);
    }
    setShowDeleteModal(false);
    setSelectedPromo(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedPromo(null);
  };

  const columns = [
    { key: "serviceName",   header: "Service Name",   render: (promo: Promo) => <span className="text-white font-semibold">{promo.serviceName}</span> },
    { key: "originalPrice", header: "Original Price", render: (promo: Promo) => <span className="text-[#B8B8B8]">{formatPrice(promo.originalPrice)}</span> },
    { key: "discount",      header: "Discount",       render: (promo: Promo) => <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">{promo.discount}% OFF</span> },
    { key: "finalPrice",    header: "Final Price",    render: (promo: Promo) => <span className="text-[#D4AF37] font-bold text-base">{formatPrice(promo.finalPrice)}</span> },
    {
      key: "status",
      header: "Status",
      render: (promo: Promo) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          promo.status === "active"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"
        }`}>
          {promo.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      className: "text-center",
      render: (promo: Promo) => (
        <ActionButtons actions={[
          { type: "edit",   onClick: () => handleEditClick(promo)   },
          { type: "delete", onClick: () => handleDeleteClick(promo) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Service Promos"
      subtitle="Manage all promotional offers"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Promo", onClick: handleAddClick, icon: Plus }} title={""} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <StatCard icon={Percent}     title="Total Promos"      value={stats.total} />
          <StatCard icon={CheckCircle} title="Active"        value={stats.active}   iconBgColor="bg-emerald-500/10" iconColor="text-emerald-400" />
          <StatCard icon={XCircle}     title="Inactive"      value={stats.inactive} iconBgColor="bg-zinc-700/50"    iconColor="text-zinc-400" />
        </div>

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search promos..."
          filters={[]}
          isEmpty={filteredPromos.length === 0}
          emptyIcon={Tag}
          emptyTitle="No promos found"
          emptyDescription="Try adjusting your search or add a new promo"
        >
          <DataTable data={filteredPromos} columns={columns} />
          <MobileCardList
            data={filteredPromos}
            renderCard={(promo: Promo) => (
              <MobileCard
                title={<p className="font-semibold text-white">{promo.serviceName}</p>}
                headerRight={<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">{promo.discount}% OFF</span>}
                fields={[
                  { label: "Original Price", value: formatPrice(promo.originalPrice) },
                  { label: "Final Price",    value: <span className="text-[#D4AF37] font-bold">{formatPrice(promo.finalPrice)}</span> },
                ]}
                actions={<div className="flex justify-end"><ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(promo) }, { type: "delete", onClick: () => handleDeleteClick(promo) }]} /></div>}
              />
            )}
          />
        </TableCard>
      </div>

      <PromoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveAdd}
        title="Add New Promo"
        subtitle="Select a service and set discount percentage"
        services={services.filter((s) => !takenServiceIds.has(s.id))}
        initialData={{ serviceId: null, discount: "", status: "active" }}
        isLoading={isLoading}
        saveButtonText="Add Promo"
      />
      <PromoModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedPromo(null); }}
        onSave={handleSaveEdit}
        title="Edit Promo"
        subtitle="Update service and discount"
        services={services.filter(
          (s) => !takenServiceIds.has(s.id) || s.id === selectedPromo?.serviceId
        )}
        initialData={selectedPromo ? {
          serviceId: selectedPromo.serviceId,
          discount:  selectedPromo.discount,
          status:    selectedPromo.status,
        } : undefined}
        isLoading={isLoading}
        saveButtonText="Save Changes"
      />
      <DeleteModal isOpen={showDeleteModal} title="Delete Promo" itemName={selectedPromo?.serviceName || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}