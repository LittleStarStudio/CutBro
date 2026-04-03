import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Tag, Plus } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import { searchInObject } from "@/lib/utils/AdminUtils";

import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";
import EditModal, { type FormField } from "@/components/admin/EditModal";

import PageHeader from "@/components/admin/PageHeader";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
interface Promo {
  id: number;
  serviceName: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
}

/* ================= DUMMY DATA ================= */
const DUMMY_PROMOS: Promo[] = [
  { id: 1, serviceName: "Premium Haircut", originalPrice: 75000,  discount: 20, finalPrice: 60000  },
  { id: 2, serviceName: "Hair Coloring",   originalPrice: 200000, discount: 15, finalPrice: 170000 },
  { id: 3, serviceName: "Deluxe Package",  originalPrice: 150000, discount: 25, finalPrice: 112500 },
  { id: 4, serviceName: "Beard Trim",      originalPrice: 35000,  discount: 10, finalPrice: 31500  },
  { id: 5, serviceName: "Basic Haircut",   originalPrice: 50000,  discount: 30, finalPrice: 35000  },
];

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

const calculateFinalPrice = (originalPrice: number, discount: number): number =>
  Math.round(originalPrice - (originalPrice * discount / 100));

export default function OwnerPromos() {
  const toast = useToast();

  const [promos, setPromos]           = useState<Promo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedPromo, setSelectedPromo]     = useState<Promo | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const currentUser = getUser();

  useEffect(() => { setPromos(DUMMY_PROMOS); }, []);

  const filteredPromos = useMemo(() => {
    return promos.filter((promo) => searchInObject(promo, searchQuery, ["serviceName"]));
  }, [promos, searchQuery]);

  const formFields: FormField[] = [
    {
      name: "serviceName",
      label: "Service Name",
      type: "text",
      placeholder: "e.g., Premium Haircut",
      required: true,
      validation: (value) => value.length >= 3 ? null : "Service name must be at least 3 characters",
    },
    {
      name: "originalPrice",
      label: "Original Price (Rp)",
      type: "number",
      placeholder: "75000",
      required: true,
      validation: (value) => {
        const num = parseInt(value);
        if (isNaN(num)) return "Price must be a number";
        if (num < 1000) return "Price must be at least Rp 1,000";
        return null;
      },
      helperText: "Enter price in Rupiah (without Rp or commas)",
    },
    {
      name: "discount",
      label: "Discount (%)",
      type: "number",
      placeholder: "20",
      required: true,
      validation: (value) => {
        const num = parseInt(value);
        if (isNaN(num)) return "Discount must be a number";
        if (num < 1)    return "Discount must be at least 1%";
        if (num > 99)   return "Discount cannot exceed 99%";
        return null;
      },
      helperText: "Discount percentage (1-99%)",
    },
  ];

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const newId        = Math.max(...promos.map((p) => p.id), 0) + 1;
      const originalPrice = parseInt(data.originalPrice);
      const discount      = parseInt(data.discount);
      setPromos((prev) => [...prev, { id: newId, serviceName: data.serviceName, originalPrice, discount, finalPrice: calculateFinalPrice(originalPrice, discount) }]);
      setShowAddModal(false);
      toast.success("Promo Added", `${data.serviceName} promo has been added.`);
    } catch {
      toast.error("Add Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEditClick = (promo: Promo) => {
    setSelectedPromo(promo);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const originalPrice = parseInt(data.originalPrice);
      const discount      = parseInt(data.discount);
      setPromos((prev) =>
        prev.map((promo) =>
          promo.id === selectedPromo?.id
            ? { ...promo, serviceName: data.serviceName, originalPrice, discount, finalPrice: calculateFinalPrice(originalPrice, discount) }
            : promo
        )
      );
      setShowEditModal(false);
      toast.success("Promo Updated", `${data.serviceName} promo has been updated.`);
      setSelectedPromo(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (promo: Promo) => {
    setSelectedPromo(promo);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedPromo) return;
    const name = selectedPromo.serviceName;
    setPromos((prev) => prev.filter((p) => p.id !== selectedPromo.id));
    setShowDeleteModal(false);
    setSelectedPromo(null);
    toast.success("Promo Deleted", `${name} promo has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedPromo(null);
  };

  const columns = [
    { key: "no", header: "No", headerClassName: "text-left w-16", render: (promo: Promo) => <span className="text-[#B8B8B8]">{filteredPromos.findIndex((p) => p.id === promo.id) + 1}</span> },
    { key: "serviceName",   header: "Service Name",   render: (promo: Promo) => <span className="text-white font-semibold">{promo.serviceName}</span> },
    { key: "originalPrice", header: "Original Price", render: (promo: Promo) => <span className="text-[#B8B8B8]">{formatPrice(promo.originalPrice)}</span> },
    { key: "discount",      header: "Discount",       render: (promo: Promo) => <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">{promo.discount}% OFF</span> },
    { key: "finalPrice",    header: "Final Price",    render: (promo: Promo) => <span className="text-[#D4AF37] font-bold text-base">{formatPrice(promo.finalPrice)}</span> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
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
      userProfile={currentUser ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Promo", onClick: handleAddClick, icon: Plus }} title={""} />

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
            renderCard={(promo: Promo) => {
              const index = filteredPromos.findIndex((p) => p.id === promo.id);
              return (
                <MobileCard
                  title={<div><p className="text-xs text-[#B8B8B8] mb-1">#{index + 1}</p><p className="font-semibold text-white">{promo.serviceName}</p></div>}
                  headerRight={<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">{promo.discount}% OFF</span>}
                  fields={[
                    { label: "Original Price", value: formatPrice(promo.originalPrice) },
                    { label: "Final Price",    value: <span className="text-[#D4AF37] font-bold">{formatPrice(promo.finalPrice)}</span> },
                  ]}
                  actions={<ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(promo) }, { type: "delete", onClick: () => handleDeleteClick(promo) }]} />}
                />
              );
            }}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveAdd} title="Add New Promo" subtitle="Create a promotional offer - final price will be calculated automatically" fields={formFields} initialData={{ serviceName: "", originalPrice: "", discount: "" }} isLoading={isLoading} saveButtonText="Add Promo" />
      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedPromo(null); }} onSave={handleSaveEdit} title="Edit Promo" subtitle="Update promotional offer - final price will be recalculated" fields={formFields} initialData={selectedPromo || {}} isLoading={isLoading} saveButtonText="Save Changes" />
      <DeleteModal isOpen={showDeleteModal} title="Delete Promo" itemName={selectedPromo?.serviceName || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}