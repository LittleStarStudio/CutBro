import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Scissors, UserCheck, UserX, Plus } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";

import { searchInObject, filterByField, capitalizeFirst } from "@/lib/utils/AdminUtils";

import Badge from "@/components/admin/Badge";
import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";
import EditModal, { type FormField } from "@/components/admin/EditModal";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useToast } from "@/components/ui/Toast";
import api from "@/services/api";
import * as ownerService from "@/services/owner.service";

/* ================= TYPES ================= */
interface Barber {
  id: number;
  name: string;
  email: string;
  bio: string;
  status: "active" | "inactive";
}

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "active",   label: "Active"     },
  { value: "inactive", label: "Inactive"   },
];

const STATUS_STYLES    = { active: "success" as const, inactive: "danger" as const };
const STATUS_DOT_COLORS = { active: "bg-green-500" as const, inactive: "bg-red-500" as const };

export default function OwnerBarbers() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [barbers, setBarbers]           = useState<Barber[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedBarber, setSelectedBarber]   = useState<Barber | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const loadBarbers = () => {
    ownerService.getBarbers().then((data) => {
      setBarbers((data as any[]).map((b: any) => ({
        id:     b.id,
        name:   b.user?.name ?? b.name ?? "-",
        email:  b.user?.email ?? "-",
        bio:    b.bio ?? "-",
        status: b.status === "available" ? "active" : "inactive",
      })));
    }).catch(() => {});
  };

  useEffect(() => { loadBarbers(); }, []);

  const stats = useMemo(() => ({
    total:    barbers.length,
    active:   barbers.filter((b) => b.status === "active").length,
    inactive: barbers.filter((b) => b.status === "inactive").length,
  }), [barbers]);

  const filteredBarbers = useMemo(() => {
    return barbers.filter((barber) => {
      const matchesSearch = searchInObject(barber, searchQuery, ["name", "email", "bio"]);
      return matchesSearch && filterByField(barber, "status", filterStatus);
    });
  }, [barbers, searchQuery, filterStatus]);

  /* Form fields — Add: requires name, email, password */
  const addFormFields: FormField[] = [
    { name: "name",     label: "Full Name",      type: "text",     placeholder: "Barber's full name",    required: true, validation: (v) => v.length >= 3 ? null : "Name must be at least 3 characters" },
    { name: "email",    label: "Email Address",  type: "email",    placeholder: "barber@example.com",    required: true, validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email format" },
    { name: "password", label: "Password",       type: "text",     placeholder: "Minimum 6 characters",  required: true, validation: (v) => v.length >= 6 ? null : "Password must be at least 6 characters", helperText: "Login credentials for this barber" },
    { name: "bio",      label: "Bio / Notes",    type: "textarea", placeholder: "e.g., 5 years experience, specializes in modern cuts", rows: 3 },
  ];

  /* Form fields — Edit: only bio and status */
  const editFormFields: FormField[] = [
    { name: "name",   label: "Full Name",    type: "text",     disabled: true, helperText: "Name cannot be changed here" },
    { name: "email",  label: "Email",        type: "email",    disabled: true },
    { name: "bio",    label: "Bio / Notes",  type: "textarea", placeholder: "e.g., 5 years experience...", rows: 3 },
    { name: "status", label: "Status",       type: "select",   required: true, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
  ];

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await api.post("/owner/barbers", {
        name:     data.name,
        email:    data.email,
        password: data.password,
        bio:      data.bio ?? null,
      });
      loadBarbers();
      setShowAddModal(false);
      toast.success("Barber Added", `${data.name} has been added successfully.`);
    } catch (err: any) {
      const msg = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : "Something went wrong. Please try again.";
      toast.error("Add Failed", msg as string);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEditClick = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    if (!selectedBarber) return;
    setIsLoading(true);
    try {
      await api.put(`/owner/barbers/${selectedBarber.id}`, {
        bio:    data.bio ?? null,
        status: data.status === "active" ? "available" : "off",
      });
      loadBarbers();
      setShowEditModal(false);
      toast.success("Barber Updated", `${selectedBarber.name} has been updated.`);
      setSelectedBarber(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBarber) return;
    const name = selectedBarber.name;
    try {
      await ownerService.deleteBarber(selectedBarber.id);
      loadBarbers();
    } catch {
      toast.error("Delete Failed", "Something went wrong. Please try again.");
    }
    setShowDeleteModal(false);
    setSelectedBarber(null);
    toast.success("Barber Deleted", `${name} has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBarber(null);
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (barber: Barber) => (
        <div className="text-white">
          <p className="font-semibold">{barber.name}</p>
          <p className="text-xs text-[#B8B8B8]">{barber.email}</p>
        </div>
      ),
    },
    { key: "bio",    header: "Bio",    render: (barber: Barber) => <span className="text-[#B8B8B8] max-w-[200px] truncate block">{barber.bio}</span> },
    {
      key: "status",
      header: "Status",
      render: (barber: Barber) => (
        <Badge text={capitalizeFirst(barber.status)} variant={STATUS_STYLES[barber.status]} showDot dotColor={STATUS_DOT_COLORS[barber.status]} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (barber: Barber) => (
        <ActionButtons actions={[
          { type: "edit",   onClick: () => handleEditClick(barber)   },
          { type: "delete", onClick: () => handleDeleteClick(barber) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Barber Management"
      subtitle="Manage all barbers"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Barber", onClick: handleAddClick, icon: Plus }} title={""} />

        <StatsGrid
          stats={[
            { icon: Scissors,  title: "Total Barber",     value: stats.total    },
            { icon: UserCheck, title: "Barber Active",    value: stats.active   },
            { icon: UserX,     title: "Barber Inactive",  value: stats.inactive },
          ]}
          columns={3}
        />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search barbers..."
          filters={[{ label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_FILTER_OPTIONS }]}
          isEmpty={filteredBarbers.length === 0}
          emptyIcon={Scissors}
          emptyTitle="No barbers found"
          emptyDescription="Try adjusting your filters or add a new barber"
        >
          <DataTable data={filteredBarbers} columns={columns} />
          <MobileCardList
            data={filteredBarbers}
            renderCard={(barber: Barber) => (
              <MobileCard
                title={barber.name}
                subtitle={<p className="text-xs text-[#B8B8B8]">{barber.email}</p>}
                headerRight={<Badge text={capitalizeFirst(barber.status)} variant={STATUS_STYLES[barber.status]} showDot dotColor={STATUS_DOT_COLORS[barber.status]} />}
                fields={[{ label: "Bio", value: barber.bio }]}
                actions={<ActionButtons actions={[{ type: "edit", onClick: () => handleEditClick(barber) }, { type: "delete", onClick: () => handleDeleteClick(barber) }]} />}
              />
            )}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveAdd} title="Add New Barber" subtitle="Create a new barber account" fields={addFormFields} initialData={{ name: "", email: "", password: "", bio: "" }} isLoading={isLoading} saveButtonText="Add Barber" />
      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedBarber(null); }} onSave={handleSaveEdit} title="Edit Barber" subtitle="Update barber information" fields={editFormFields} initialData={selectedBarber || {}} isLoading={isLoading} saveButtonText="Save Changes" />
      <DeleteModal isOpen={showDeleteModal} title="Delete Barber" itemName={selectedBarber?.name || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </DashboardLayout>
  );
}
