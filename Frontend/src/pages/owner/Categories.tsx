import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Tag, Plus } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

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
interface Category {
  id: number;
  categoryName: string;
  serviceCount: number;
  status: "active" | "inactive";
}

export default function OwnerCategories() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [categories, setCategories]   = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading]               = useState(false);

  const loadCategories = () => {
    ownerService.getCategories().then((data) => {
      setCategories(data.map((c) => ({
        id:           c.id,
        categoryName: c.name,
        serviceCount: 0,
        status:       "active" as const,
      })));
    }).catch(() => {});
  };

  useEffect(() => { loadCategories(); }, []);

  /* ================= FILTER ================= */
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => searchInObject(cat, searchQuery, ["categoryName"]));
  }, [categories, searchQuery]);

  /* ================= FORM FIELDS ================= */
  const formFields: FormField[] = [
    {
      name: "categoryName",
      label: "Category Name",
      type: "text",
      placeholder: "e.g., Haircut",
      required: true,
      validation: (value) => value.length >= 2 ? null : "Category name must be at least 2 characters",
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

  /* ================= ADD HANDLER ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await ownerService.createCategory({ name: data.categoryName });
      loadCategories();
      setShowAddModal(false);
      toast.success("Category Added", `${data.categoryName} has been added successfully.`);
    } catch {
      toast.error("Add Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT HANDLER ================= */
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    if (!selectedCategory) return;
    setIsLoading(true);
    try {
      await ownerService.updateCategory(selectedCategory.id, { name: data.categoryName });
      loadCategories();
      setShowEditModal(false);
      toast.success("Category Updated", `${data.categoryName} has been updated successfully.`);
      setSelectedCategory(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE HANDLER ================= */
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    const name = selectedCategory.categoryName;
    try {
      await ownerService.deleteCategory(selectedCategory.id);
      loadCategories();
    } catch {
      toast.error("Delete Failed", "Something went wrong. Please try again.");
    }
    setShowDeleteModal(false);
    setSelectedCategory(null);
    toast.success("Category Deleted", `${name} has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedCategory(null);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "no",
      header: "No",
      headerClassName: "text-left w-16",
      render: (cat: Category) => {
        const index = filteredCategories.findIndex((c) => c.id === cat.id);
        return <span className="text-[#B8B8B8]">{index + 1}</span>;
      },
    },
    { key: "categoryName", header: "Category Name", render: (cat: Category) => <span className="text-white font-semibold">{cat.categoryName}</span> },
    {
      key: "serviceCount",
      header: "Services",
      render: (cat: Category) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
          {cat.serviceCount} service{cat.serviceCount !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (cat: Category) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cat.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"}`}>
          {cat.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (cat: Category) => (
        <ActionButtons actions={[
          { type: "edit",   onClick: () => handleEditClick(cat)   },
          { type: "delete", onClick: () => handleDeleteClick(cat) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Service Categories"
      subtitle="Manage all service categories"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Category", onClick: handleAddClick, icon: Plus }} title={""} />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search categories..."
          isEmpty={filteredCategories.length === 0}
          emptyIcon={Tag}
          emptyTitle="No categories found"
          emptyDescription="Try adjusting your search or add a new category"
        >
          <DataTable data={filteredCategories} columns={columns} />
          <MobileCardList
            data={filteredCategories}
            renderCard={(cat: Category) => {
              const index = filteredCategories.findIndex((c) => c.id === cat.id);
              return (
                <MobileCard
                  title={<div><p className="text-xs text-[#B8B8B8] mb-1">#{index + 1}</p><p className="font-semibold text-white">{cat.categoryName}</p></div>}
                  headerRight={
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cat.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"}`}>
                      {cat.status === "active" ? "Active" : "Inactive"}
                    </span>
                  }
                  fields={[{ label: "Services", value: <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">{cat.serviceCount} service{cat.serviceCount !== 1 ? "s" : ""}</span> }]}
                  actions={<ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(cat) }, { type: "delete", onClick: () => handleDeleteClick(cat) }]} />}
                />
              );
            }}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveAdd} title="Add New Category" subtitle="Create a new service category" fields={formFields} initialData={{ categoryName: "", status: "active" }} isLoading={isLoading} saveButtonText="Add Category" />
      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedCategory(null); }} onSave={handleSaveEdit} title="Edit Category" subtitle="Update category information" fields={formFields} initialData={selectedCategory || {}} isLoading={isLoading} saveButtonText="Save Changes" />
      <DeleteModal isOpen={showDeleteModal} title="Delete Category" itemName={selectedCategory?.categoryName || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}