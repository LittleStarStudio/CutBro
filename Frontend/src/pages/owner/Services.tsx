import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Scissors, Plus } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import { searchInObject, filterByField } from "@/lib/utils/AdminUtils";

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
interface Service {
  id: number;
  serviceName: string;
  category: string;
  price: string;
  description?: string;
  duration?: number;
  status: "active" | "inactive";
}

/* ================= DUMMY DATA ================= */
const DUMMY_SERVICES: Service[] = [
  { id: 1, serviceName: "Premium Haircut", category: "Haircut",   price: "Rp 75,000",  description: "Professional haircut with styling",    duration: 45, status: "active"   },
  { id: 2, serviceName: "Basic Haircut",   category: "Haircut",   price: "Rp 50,000",  description: "Simple and clean haircut",             duration: 30, status: "active"   },
  { id: 3, serviceName: "Beard Trim",      category: "Grooming",  price: "Rp 35,000",  description: "Beard shaping and trimming",           duration: 20, status: "inactive" },
  { id: 4, serviceName: "Hair Coloring",   category: "Coloring",  price: "Rp 200,000", description: "Professional hair coloring service",   duration: 90, status: "active"   },
  { id: 5, serviceName: "Hair Wash",       category: "Treatment", price: "Rp 25,000",  description: "Relaxing hair wash and massage",       duration: 15, status: "active"   },
  { id: 6, serviceName: "Deluxe Package",  category: "Package",   price: "Rp 150,000", description: "Complete grooming package",            duration: 60, status: "inactive" },
];

const CATEGORY_OPTIONS = [
  { value: "all",       label: "All Categories" },
  { value: "Haircut",   label: "Haircut"   },
  { value: "Grooming",  label: "Grooming"  },
  { value: "Coloring",  label: "Coloring"  },
  { value: "Treatment", label: "Treatment" },
  { value: "Package",   label: "Package"   },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "active",   label: "Active"     },
  { value: "inactive", label: "Inactive"   },
];

export default function OwnerServices() {
  const toast = useToast();

  const [services, setServices]           = useState<Service[]>([]);
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const currentUser = getUser();

  useEffect(() => { setServices(DUMMY_SERVICES); }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch   = searchInObject(service, searchQuery, ["serviceName", "category"]);
      const matchesCategory = filterByField(service, "category", filterCategory);
      const matchesStatus   = filterStatus === "all" || service.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, searchQuery, filterCategory, filterStatus]);

  const formFields: FormField[] = [
    { name: "serviceName", label: "Service Name", type: "text", placeholder: "e.g., Premium Haircut", required: true, validation: (value) => value.length >= 3 ? null : "Service name must be at least 3 characters" },
    { name: "category", label: "Category", type: "select", required: true, options: [{ value: "Haircut", label: "Haircut" }, { value: "Grooming", label: "Grooming" }, { value: "Coloring", label: "Coloring" }, { value: "Treatment", label: "Treatment" }, { value: "Package", label: "Package" }] },
    { name: "price", label: "Price", type: "text", placeholder: "Rp 50,000", required: true, validation: (value) => /^Rp\s?[\d,]+$/.test(value) ? null : "Price must be in format: Rp 50,000", helperText: "Format: Rp 50,000" },
    { name: "duration", label: "Duration (minutes)", type: "number", placeholder: "30", required: true, validation: (value) => { const num = parseInt(value); if (isNaN(num)) return "Duration must be a number"; if (num < 5) return "Duration must be at least 5 minutes"; if (num > 300) return "Duration cannot exceed 300 minutes (5 hours)"; return null; }, helperText: "Service duration in minutes (5-300)" },
    { name: "status", label: "Status", type: "select", required: true, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
    { name: "description", label: "Description", type: "textarea", placeholder: "Describe the service...", rows: 4, helperText: "Optional: Add a brief description of the service" },
  ];

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const newId = Math.max(...services.map((s) => s.id), 0) + 1;
      setServices((prev) => [...prev, { id: newId, serviceName: data.serviceName, category: data.category, price: data.price, description: data.description, duration: parseInt(data.duration), status: data.status }]);
      setShowAddModal(false);
      toast.success("Service Added", `${data.serviceName} has been added successfully.`);
    } catch {
      toast.error("Add Failed", "Something went wrong. Please try again.");
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
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setServices((prev) =>
        prev.map((service) =>
          service.id === selectedService?.id
            ? { ...service, serviceName: data.serviceName, category: data.category, price: data.price, description: data.description, duration: parseInt(data.duration), status: data.status }
            : service
        )
      );
      setShowEditModal(false);
      toast.success("Service Updated", `${data.serviceName} has been updated successfully.`);
      setSelectedService(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedService) return;
    const name = selectedService.serviceName;
    setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
    setShowDeleteModal(false);
    setSelectedService(null);
    toast.success("Service Deleted", `${name} has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedService(null);
  };

  const columns = [
    { key: "no", header: "No", headerClassName: "text-left w-16", render: (service: Service) => <span className="text-[#B8B8B8]">{filteredServices.findIndex((s) => s.id === service.id) + 1}</span> },
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
    { key: "category", header: "Category", render: (service: Service) => <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">{service.category}</span> },
    { key: "duration", header: "Duration", render: (service: Service) => <span className="text-[#B8B8B8]">{service.duration} min</span> },
    { key: "price",    header: "Price",    render: (service: Service) => <span className="text-[#B8B8B8] font-medium">{service.price}</span> },
    { key: "status",   header: "Status",   render: (service: Service) => <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${service.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"}`}>{service.status === "active" ? "Active" : "Inactive"}</span> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
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
      userProfile={currentUser ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Service", onClick: handleAddClick, icon: Plus }} title={""} />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search services..."
          filters={[
            { label: "Category", value: filterCategory, onChange: setFilterCategory, options: CATEGORY_OPTIONS },
            { label: "Status",   value: filterStatus,   onChange: setFilterStatus,   options: STATUS_FILTER_OPTIONS },
          ]}
          isEmpty={filteredServices.length === 0}
          emptyIcon={Scissors}
          emptyTitle="No services found"
          emptyDescription="Try adjusting your filters or add a new service"
        >
          <DataTable data={filteredServices} columns={columns} />
          <MobileCardList
            data={filteredServices}
            renderCard={(service: Service) => {
              const index = filteredServices.findIndex((s) => s.id === service.id);
              return (
                <MobileCard
                  title={<div><p className="text-xs text-[#B8B8B8] mb-1">#{index + 1}</p><p className="font-semibold text-white">{service.serviceName}</p>{service.description && <p className="text-xs text-[#B8B8B8] mt-1">{service.description}</p>}</div>}
                  headerRight={<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">{service.category}</span>}
                  fields={[
                    { label: "Duration", value: `${service.duration} minutes` },
                    { label: "Price",    value: service.price },
                    { label: "Status",   value: <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${service.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"}`}>{service.status === "active" ? "Active" : "Inactive"}</span> },
                  ]}
                  actions={<ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(service) }, { type: "delete", onClick: () => handleDeleteClick(service) }]} />}
                />
              );
            }}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveAdd} title="Add New Service" subtitle="Create a new service offering" fields={formFields} initialData={{ serviceName: "", category: "Haircut", price: "Rp ", duration: 30, status: "active", description: "" }} isLoading={isLoading} saveButtonText="Add Service" />
      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedService(null); }} onSave={handleSaveEdit} title="Edit Service" subtitle="Update service information" fields={formFields} initialData={selectedService || {}} isLoading={isLoading} saveButtonText="Save Changes" />
      <DeleteModal isOpen={showDeleteModal} title="Delete Service" itemName={selectedService?.serviceName || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}