import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Scissors, UserCheck, UserX, Plus } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import {
  searchInObject,
  filterByField,
  capitalizeFirst,
} from "@/lib/utils/AdminUtils";

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

/* ================= TYPES ================= */
interface Barber {
  id: number;
  name: string;
  phone: string;
  email: string;
  experience: string;
  specialization: string;
  status: "active" | "inactive";
}

/* ================= DUMMY DATA ================= */
const DUMMY_BARBERS: Barber[] = [
  { id: 1, name: "John Barber",  phone: "081234567890", email: "john@example.com",  experience: "5 years", specialization: "Modern Haircuts", status: "active"   },
  { id: 2, name: "Mike Stylist", phone: "082345678901", email: "mike@example.com",  experience: "3 years", specialization: "Beard Styling",   status: "active"   },
  { id: 3, name: "David Cut",    phone: "083456789012", email: "david@example.com", experience: "2 years", specialization: "Classic Cuts",    status: "inactive" },
  { id: 4, name: "Ryan Style",   phone: "084567890123", email: "ryan@example.com",  experience: "4 years", specialization: "Hair Coloring",   status: "active"   },
  { id: 5, name: "Alex Master",  phone: "085678901234", email: "alex@example.com",  experience: "6 years", specialization: "Premium Styling", status: "active"   },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "active",   label: "Active"     },
  { value: "inactive", label: "Inactive"   },
];

const STATUS_STYLES = {
  active:   "success" as const,
  inactive: "danger"  as const,
};

const STATUS_DOT_COLORS = {
  active:   "bg-green-500" as const,
  inactive: "bg-red-500"   as const,
};

export default function OwnerBarbers() {
  const toast = useToast();

  const [barbers, setBarbers]           = useState<Barber[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedBarber, setSelectedBarber]   = useState<Barber | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const currentUser = getUser();

  useEffect(() => {
    setBarbers(DUMMY_BARBERS);
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    total:    barbers.length,
    active:   barbers.filter((b) => b.status === "active").length,
    inactive: barbers.filter((b) => b.status === "inactive").length,
  }), [barbers]);

  /* ================= FILTER ================= */
  const filteredBarbers = useMemo(() => {
    return barbers.filter((barber) => {
      const matchesSearch = searchInObject(barber, searchQuery, ["name", "specialization"]);
      return matchesSearch && filterByField(barber, "status", filterStatus);
    });
  }, [barbers, searchQuery, filterStatus]);

  /* ================= FORM FIELDS ================= */
  const formFields: FormField[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter barber's name",
      required: true,
      validation: (value) => value.length >= 3 ? null : "Name must be at least 3 characters",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "text",
      placeholder: "081234567890",
      required: true,
      validation: (value) => /^08[0-9]{8,11}$/.test(value) ? null : "Invalid phone number format",
      helperText: "Format: 08xxxxxxxxxx",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "barber@example.com",
      required: true,
      validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Invalid email format",
    },
    {
      name: "experience",
      label: "Years of Experience",
      type: "text",
      placeholder: "e.g., 5 years",
      required: true,
      helperText: "Format: X years",
    },
    {
      name: "specialization",
      label: "Specialization",
      type: "text",
      placeholder: "e.g., Modern Haircuts",
      required: true,
      helperText: "What this barber specializes in",
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const newId = Math.max(...barbers.map((b) => b.id), 0) + 1;
      const newBarber: Barber = {
        id:             newId,
        name:           data.name,
        phone:          data.phone,
        email:          data.email,
        experience:     data.experience,
        specialization: data.specialization,
        status:         data.status as "active" | "inactive",
      };
      setBarbers((prev) => [...prev, newBarber]);
      setShowAddModal(false);
      toast.success("Barber Added", `${data.name} has been added successfully.`);
    } catch {
      toast.error("Add Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT HANDLER ================= */
  const handleEditClick = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setBarbers((prev) =>
        prev.map((barber) =>
          barber.id === selectedBarber?.id
            ? {
                ...barber,
                name:           data.name,
                phone:          data.phone,
                email:          data.email,
                experience:     data.experience,
                specialization: data.specialization,
                status:         data.status as "active" | "inactive",
              }
            : barber
        )
      );
      setShowEditModal(false);
      toast.success("Barber Updated", `${data.name} has been updated successfully.`);
      setSelectedBarber(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE HANDLER ================= */
  const handleDeleteClick = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedBarber) return;
    const name = selectedBarber.name;
    setBarbers((prev) => prev.filter((b) => b.id !== selectedBarber.id));
    setShowDeleteModal(false);
    setSelectedBarber(null);
    toast.success("Barber Deleted", `${name} has been removed.`);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBarber(null);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "name",
      header: "Name",
      render: (barber: Barber) => (
        <div className="text-white">
          <p className="font-semibold">{barber.name}</p>
          <p className="text-xs text-[#B8B8B8]">{barber.phone}</p>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      render: (barber: Barber) => <span className="text-[#B8B8B8]">{barber.specialization}</span>,
    },
    {
      key: "experience",
      header: "Experience",
      render: (barber: Barber) => <span className="text-[#B8B8B8]">{barber.experience}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (barber: Barber) => (
        <Badge
          text={capitalizeFirst(barber.status)}
          variant={STATUS_STYLES[barber.status]}
          showDot
          dotColor={STATUS_DOT_COLORS[barber.status]}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (barber: Barber) => (
        <ActionButtons
          actions={[
            { type: "edit",   onClick: () => handleEditClick(barber)   },
            { type: "delete", onClick: () => handleDeleteClick(barber) },
          ]}
        />
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
      userProfile={currentUser ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Barber", onClick: handleAddClick, icon: Plus }} title={""} />

        <StatsGrid
          stats={[
            { icon: Scissors, title: "Total Barber",    value: stats.total    },
            { icon: UserCheck, title: "Barber Active",  value: stats.active   },
            { icon: UserX,     title: "Barber Inactive", value: stats.inactive },
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
                subtitle={<p className="text-xs text-[#B8B8B8]">{barber.phone}</p>}
                badge={<span className="text-xs text-[#B8B8B8]">{barber.experience}</span>}
                headerRight={
                  <Badge
                    text={capitalizeFirst(barber.status)}
                    variant={STATUS_STYLES[barber.status]}
                    showDot
                    dotColor={STATUS_DOT_COLORS[barber.status]}
                  />
                }
                fields={[{ label: "Specialization", value: barber.specialization }]}
                actions={
                  <ActionButtons
                    actions={[
                      { type: "edit",   onClick: () => handleEditClick(barber)   },
                      { type: "delete", onClick: () => handleDeleteClick(barber) },
                    ]}
                  />
                }
              />
            )}
          />
        </TableCard>
      </div>

      <EditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveAdd}
        title="Add New Barber"
        subtitle="Create a new barber profile"
        fields={formFields}
        initialData={{ name: "", phone: "", email: "", experience: "", specialization: "", status: "active" }}
        isLoading={isLoading}
        saveButtonText="Add Barber"
      />

      <EditModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedBarber(null); }}
        onSave={handleSaveEdit}
        title="Edit Barber"
        subtitle="Update barber information"
        fields={formFields}
        initialData={selectedBarber || {}}
        isLoading={isLoading}
        saveButtonText="Save Changes"
      />

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Barber"
        itemName={selectedBarber?.name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </DashboardLayout>
  );
}