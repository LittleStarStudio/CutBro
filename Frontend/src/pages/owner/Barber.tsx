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
  photo_url: string | null;
  status: "active" | "inactive";
}

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "active",   label: "Active"     },
  { value: "inactive", label: "Inactive"   },
];

const STATUS_STYLES    = { active: "success" as const, inactive: "danger" as const };
const STATUS_DOT_COLORS = { active: "bg-green-500" as const, inactive: "bg-red-500" as const };
const ADD_BARBER_INITIAL_DATA = { name: "", email: "", password: "", bio: "", photo_url: null };

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
  const [showViewModal, setShowViewModal]     = useState(false);
  const [addServerErrors, setAddServerErrors] = useState<Record<string, string>>({});
  const [editServerErrors, setEditServerErrors] = useState<Record<string, string>>({});

  const loadBarbers = () => {
    ownerService.getBarbers().then((data) => {
      setBarbers((data as any[]).map((b: any) => ({
          id:     b.id,
          name:   b.user?.name ?? b.name ?? "-",
          email:  b.user?.email ?? "-",
          bio:      b.bio ?? "",
          photo_url: b.photo_url ?? null,
          status: b.status === "available" ? "active" : "inactive",
        })));
      }).catch(() => {
        toast.error("Load Failed", "Failed to load barber data. Please refresh the page.");
      });
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
    { name: "photo_url", label: "Photo", type: "image", accept: "image/*" },
    { name: "name",     label: "Full Name",      type: "text",     placeholder: "Barber's full name",    required: true, validation: (v) => v.length >= 3 ? null : "Name must be at least 3 characters" },
    { name: "email",    label: "Email Address",  type: "email",    placeholder: "barber@example.com",    required: true, validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email format" },
    { name: "password", label: "Password", type: "password", placeholder: "Minimum 6 characters", required: true, validation: (v) => v.length >= 6 ? null : "Password must be at least 6 characters", helperText: "Login credentials for this barber" },
    { name: "bio",      label: "Bio / Notes",    type: "textarea", placeholder: "e.g., 5 years experience, specializes in modern cuts", rows: 3 },
  ];

  /* Form fields — Edit: only bio and status */
    const editFormFields: FormField[] = [
    { name: "photo_url", label: "Photo", type: "image", accept: "image/*" },
    { name: "name",   label: "Full Name",    type: "text",  required: true, placeholder: "Barber's full name", validation: (v) => v.length >= 3 ? null : "Name must be at least 3 characters" },
    { name: "email",  label: "Email",        type: "email", required: true, placeholder: "barber@example.com", validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email format" },
    { name: "password", label: "New Password", type: "password", placeholder: "Leave blank to keep current password", validation: (v) => !v || v.length >= 6 ? null : "Password must be at least 6 characters", helperText: "Leave blank to keep current password" },
    { name: "bio",    label: "Bio / Notes",  type: "textarea", placeholder: "e.g., 5 years experience...", rows: 3 },
    { name: "status", label: "Status",       type: "select",   required: true, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
  ];

  const viewFormFields: FormField[] = [
    { name: "photo_url", label: "Photo",       type: "image",    disabled: true },
    { name: "name",      label: "Full Name",   type: "text",     disabled: true },
    { name: "email",     label: "Email",       type: "email",    disabled: true },
    { name: "bio",       label: "Bio / Notes", type: "textarea", disabled: true, rows: 3 },
    { name: "status",    label: "Status",      type: "select",   disabled: true, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
  ];

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: Record<string, any>) => {
    setAddServerErrors({});
    setIsLoading(true);
    try {
      await api.post("/owner/barbers", {
        name:     data.name,
        email:    data.email,
        password: data.password,
        bio:      data.bio || null,
        photo_url: data.photo_url || null,
      });
      loadBarbers();
      setShowAddModal(false);
      toast.success("Barber Added", `${data.name} has been added successfully.`);
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (backendErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([field, msgs]) => {
          mapped[field] = (msgs as string[])[0];
        });
        setAddServerErrors(mapped);
      } else {
        const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
        toast.error("Add Failed", msg as string);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEditClick = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowEditModal(true);
  };

  const handleViewClick = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowViewModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    if (!selectedBarber) return;
    setEditServerErrors({});
    setIsLoading(true);
    try {
      await api.put(`/owner/barbers/${selectedBarber.id}`, {
        name:      data.name,
        email:     data.email,
        password:  data.password || undefined,
        bio:       data.bio || null,
        photo_url: data.photo_url || null,
        status:    data.status === "active" ? "available" : "off",
      });
      loadBarbers();
      setShowEditModal(false);
      toast.success("Barber Updated", `${data.name} has been updated.`);
      setSelectedBarber(null);
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (backendErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([field, msgs]) => {
          mapped[field] = (msgs as string[])[0];
        });
        setEditServerErrors(mapped);
      } else {
        const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
        toast.error("Update Failed", msg as string);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (barber: Barber) => {
    if (barber.status === "active") {
      toast.error("Cannot Delete", "Active barbers cannot be deleted. Set the barber to inactive first.");
      return;
    }
    setSelectedBarber(barber);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBarber) return;
    const name = selectedBarber.name;
    setIsLoading(true);
    try {
      await ownerService.deleteBarber(selectedBarber.id);
      loadBarbers();
      setShowDeleteModal(false);
      setSelectedBarber(null);
      toast.success("Barber Deleted", `${name} has been removed.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Delete Failed", msg as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBarber(null);
  };

  const columns = [
    {
      key: "photo",
      header: "Photos",
      headerClassName: "hidden md:table-cell text-center",
      className: "hidden md:table-cell text-center",
      render: (barber: Barber) => (
        <div className="flex justify-center">
          {barber.photo_url
            ? <img src={barber.photo_url} alt={barber.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
            : <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
          }
        </div>
      ),
    },
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
    { key: "bio",    header: "Bio",    render: (barber: Barber) => <span className="text-[#B8B8B8] max-w-[200px] truncate block">{barber.bio || "-"}</span> },
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
      headerClassName: "text-center",
      className: "text-right",
      render: (barber: Barber) => (
        <ActionButtons actions={[
          { type: "view",   onClick: () => handleViewClick(barber)   },
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
            { icon: Scissors,  title: "Total Barbers",    value: stats.total    },
            { icon: UserCheck, title: "Active Barbers",   value: stats.active   },
            { icon: UserX,     title: "Inactive Barbers", value: stats.inactive },
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
                fields={[{ label: "Bio", value: barber.bio || "-" }]}
                actions={<div className="flex justify-end"><ActionButtons actions={[{ type: "view", onClick: () => handleViewClick(barber) }, { type: "edit", onClick: () => handleEditClick(barber) }, { type: "delete", onClick: () => handleDeleteClick(barber) }]} /></div>}
              />
            )}
          />
        </TableCard>
      </div>

      <EditModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setAddServerErrors({}); }} onSave={handleSaveAdd} title="Add New Barber" subtitle="Create a new barber account" fields={addFormFields} initialData={ADD_BARBER_INITIAL_DATA} isLoading={isLoading} saveButtonText="Add Barber" serverErrors={addServerErrors} />
      <EditModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedBarber(null); setEditServerErrors({}); }} onSave={handleSaveEdit} title="Edit Barber" subtitle="Update barber information" fields={editFormFields} initialData={selectedBarber || {}} isLoading={isLoading} saveButtonText="Save Changes" serverErrors={editServerErrors} />
      <DeleteModal isOpen={showDeleteModal} title="Delete Barber" itemName={selectedBarber?.name || ""} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} isLoading={isLoading} />
      <EditModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedBarber(null); }}
        onSave={() => {}}
        title="Barber Details"
        subtitle="View barber information"
        fields={viewFormFields}
        initialData={selectedBarber || {}}
        hideFooter
      />
    </DashboardLayout>
  );
}
