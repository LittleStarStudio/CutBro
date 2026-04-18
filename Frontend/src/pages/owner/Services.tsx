import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Scissors, Plus, CheckCircle, XCircle } from "lucide-react";
import StatCard from "@/components/admin/StatsCard";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";

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
import * as ownerService from "@/services/owner.service";

/* ================= TYPES ================= */
interface Service {
  id: number;
  serviceName: string;
  categoryId: number | null;
  categoryName: string;
  price: number;
  duration: number;
  description?: string;
  status: "active" | "inactive";
}

const formatPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function OwnerServices() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [services, setServices]               = useState<Service[]>([]);
  const [categories, setCategories]           = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [filterCategory, setFilterCategory]   = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const loadData = () => {
    ownerService.getServices().then((data) => {
      setServices(data.map((s) => ({
        id:           s.id,
        serviceName:  s.name,
        categoryId:   s.category_id ?? null,
        categoryName: s.category?.name ?? "-",
        price:        typeof s.price === "string" ? parseFloat(s.price) : s.price,
        duration:     s.duration_minutes,
        description:  s.description ?? undefined,
        status:       s.is_active ? "active" : "inactive",  
      })));
    }).catch(() => {});

    ownerService.getCategories().then((data) => {
      setCategories(data.map((c) => ({ id: c.id, name: c.name })));
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const categoryOptions = useMemo(() => [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ], [categories]);

  const categoryFormOptions = useMemo(() =>
    categories.map((c) => ({ value: String(c.id), label: c.name })),
  [categories]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch   = searchInObject(service, searchQuery, ["serviceName", "categoryName"]);
      const matchesCategory = filterCategory === "all" || String(service.categoryId) === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, filterCategory]);

  const stats = useMemo(() => ({
    total:    services.length,
    active:   services.filter((s) => s.status === "active").length,
    inactive: services.filter((s) => s.status === "inactive").length,
  }), [services]);

  const formFields: FormField[] = [
    { name: "serviceName", label: "Service Name", type: "text", placeholder: "e.g., Premium Haircut", required: true, validation: (value) => value.length >= 3 ? null : "Service name must be at least 3 characters" },
    { name: "categoryId",  label: "Category",     type: "select", required: true, options: categoryFormOptions },
    { name: "price",       label: "Price (Rp)",   type: "number", placeholder: "75000", required: true, validation: (value) => { const n = parseInt(value); return isNaN(n) || n < 1000 ? "Price must be at least Rp 1,000" : null; }, helperText: "Enter price in Rupiah (e.g., 75000)" },
    { name: "duration",    label: "Duration (minutes)", type: "number", placeholder: "30", required: true, validation: (value) => { const n = parseInt(value); return isNaN(n) || n < 5 ? "Duration must be at least 5 minutes" : null; } },
    { name: "description", label: "Description",  type: "textarea", placeholder: "Describe the service...", rows: 3 },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "active",   label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await ownerService.createService({
        name:             data.serviceName,
        category_id:      data.categoryId ? parseInt(data.categoryId) : undefined,
        price:            parseInt(data.price),
        duration_minutes: parseInt(data.duration),
        description:      data.description,
        is_active:        data.status === "active",
      });
      loadData();
      setShowAddModal(false);
      toast.success("Service Added", `${data.serviceName} has been added successfully.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Add Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    if (!selectedService) return;
    setIsLoading(true);
    try {
      await ownerService.updateService(selectedService.id, {
        name:             data.serviceName,
        category_id:      data.categoryId ? parseInt(data.categoryId) : undefined,
        price:            parseInt(data.price),
        duration_minutes: parseInt(data.duration),
        description:      data.description,
        is_active:        data.status === "active", 
      });
      loadData();
      setShowEditModal(false);
      toast.success("Service Updated", `${data.serviceName} has been updated successfully.`);
      setSelectedService(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Update Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;
    const name = selectedService.serviceName;
    try {
      await ownerService.deleteService(selectedService.id);
      loadData();
      setShowDeleteModal(false);
      setSelectedService(null);
      toast.success("Service Deleted", `${name} has been removed.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong.";
      toast.error("Delete Failed", msg);   // ← tampilkan pesan spesifik dari backend
      setShowDeleteModal(false);
      setSelectedService(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedService(null);
  };

  const columns = [
    {
      key: "serviceName",
      header: "Service Name",
      render: (service: Service) => (
        <div>
          <span className="text-white font-semibold">{service.serviceName}</span>
          {service.description && <p className="text-xs text-[#B8B8B8] mt-1 max-w-[200px] truncate">{service.description}</p>}
        </div>
      ),
    },
    { key: "category", header: "Category", render: (service: Service) => <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">{service.categoryName}</span> },
    { key: "duration",  header: "Duration", render: (service: Service) => <span className="text-[#B8B8B8]">{service.duration} min</span> },
    { key: "price",     header: "Price",    render: (service: Service) => <span className="text-[#B8B8B8] font-medium">{formatPrice(service.price)}</span> },
    {
      key: "status",
      header: "Status",
      render: (service: Service) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          service.status === "active"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"
        }`}>
          {service.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      className: "text-center",
      render: (service: Service) => (
        <ActionButtons actions={[
          { type: "edit",   onClick: () => handleEditClick(service)   },
          { type: "delete", onClick: () => handleDeleteClick(service) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Services Management"
      subtitle="Manage all services"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Service", onClick: handleAddClick, icon: Plus }} title={""} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <StatCard icon={Scissors}    title="Total Services" value={stats.total}    />
          <StatCard icon={CheckCircle} title="Active"         value={stats.active}   iconBgColor="bg-emerald-500/10" iconColor="text-emerald-400" />
          <StatCard icon={XCircle}     title="Inactive"       value={stats.inactive} iconBgColor="bg-zinc-700/50"    iconColor="text-zinc-400" />
        </div>

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search services..."
          filters={[
            { label: "Category", value: filterCategory, onChange: setFilterCategory, options: categoryOptions },
          ]}
          isEmpty={filteredServices.length === 0}
          emptyIcon={Scissors}
          emptyTitle="No services found"
          emptyDescription="Try adjusting your filters or add a new service"
        >
          <DataTable data={filteredServices} columns={columns} />
          <MobileCardList
            data={filteredServices}
            renderCard={(service: Service) => (
              <MobileCard
                title={
                  <div>
                    <p className="font-semibold text-white">{service.serviceName}</p>
                    {service.description && <p className="text-xs text-[#B8B8B8] mt-1">{service.description}</p>}
                  </div>
                }
                headerRight={<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">{service.categoryName}</span>}
                fields={[
                  { label: "Duration", value: `${service.duration} minutes` },
                  { label: "Price",    value: formatPrice(service.price) },
                  { label: "Status",   value: (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${service.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"}`}>
                      {service.status === "active" ? "Active" : "Inactive"}
                    </span>
                  )},
                ]}
                actions={<div className="flex justify-end"><ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(service) }, { type: "delete", onClick: () => handleDeleteClick(service) }]} /></div>}
              />
            )}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveAdd} title="Add New Service" subtitle="Create a new service offering" fields={formFields} initialData={{ serviceName: "", categoryId: categoryFormOptions[0]?.value ?? "", price: "", duration: 30, description: "", status: "active" }} isLoading={isLoading} saveButtonText="Add Service" />
      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedService(null); }} onSave={handleSaveEdit} title="Edit Service" subtitle="Update service information" fields={formFields} initialData={selectedService ? { serviceName: selectedService.serviceName, categoryId: String(selectedService.categoryId ?? ""), price: selectedService.price, duration: selectedService.duration, description: selectedService.description ?? "", status:       selectedService.status } : {}} isLoading={isLoading} saveButtonText="Save Changes" />
      <DeleteModal isOpen={showDeleteModal} title="Delete Service" itemName={selectedService?.serviceName || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}
