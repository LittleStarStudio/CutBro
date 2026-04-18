import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Users, User, Scissors, Store, X } from "lucide-react";

import StatsGrid from "@/components/admin/StatGrid";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as adminService from "@/services/admin.service";
import type { AdminUser } from "@/services/admin.service";

import {
  searchInObject,
  filterByField,
  capitalizeFirst,
} from "@/lib/utils/AdminUtils";

import {
  USER_ROLE_FILTER_OPTIONS,
  USER_STATUS_FILTER_OPTIONS,
  USER_ROLE_STYLES,
  USER_STATUS_STYLES,
  STATUS_DOT_COLORS,
} from "@/components/entities/constants/AdminConstants";

import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Badge from "@/components/admin/Badge";
import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";
import EditModal, { type FormField } from "@/components/admin/EditModal";

import { useToast } from "@/components/ui/Toast";

export default function UsersManagement() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ total: 0, customers: 0, barbers: 0, owners: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewUser, setSelectedViewUser] = useState<AdminUser | null>(null);

  /* ================= LOAD ================= */

  const loadStats = async () => {
    try {
      const data = await adminService.getUserStats();
      setStats(data);
    } catch { /* silent */ }
  };

  const loadUsers = async () => {
    try {
      const result = await adminService.getAdminUsers();
      setUsers(result.data);
    } catch { /* silent */ }
  };

  useEffect(() => { loadStats(); loadUsers(); }, []);

  /* ================= FILTER ================= */

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = searchInObject(u, searchQuery, ["name", "email"]);
      return (
        matchesSearch &&
        filterByField(u, "role", filterRole) &&
        filterByField(u, "status", filterStatus)
      );
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  /* ================= EDIT ================= */

  const editFields: FormField[] = [
    {
      name: "photo",
      label: "User Photo",
      type: "image" as const,
      disabled: false,
    },
    {
      name: "name",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "Enter full name",
      validation: (v) => {
        const trimmed = (v ?? "").trim();
        if (!trimmed) return "Full Name cannot be spaces only";
        if (trimmed.length < 3) return "Full Name must be at least 3 characters";
        if (trimmed.length > 100) return "Full Name cannot exceed 100 characters";
        return null;
      },
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      required: true,
      placeholder: "Enter email address",
      validation: (v) => {
        const trimmed = (v ?? "").trim();
        if (!trimmed) return "Email Address cannot be empty";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
          return "Invalid email format (e.g. user@example.com)";
        if (trimmed.length > 255) return "Email Address is too long (max 255 characters)";
        const emailTaken = users.some(
          (u) => u.email.toLowerCase() === trimmed.toLowerCase() && u.id !== selectedUser?.id
        );
        if (emailTaken) return "Email address is already in use by another user";
        return null;
      },
    },
    {
      name: "role",
      label: "User Role",
      type: "select",
      required: true,
      options: [
        { value: "customer", label: "Customer" },
        { value: "barber",   label: "Barber"   },
        { value: "owner",    label: "Owner"    },
      ],
      validation: (v) =>
        ["customer", "barber", "owner"].includes(v)
          ? null
          : "Please select a valid role",
    },
    {
      name: "status",
      label: "Account Status",
      type: "select",
      required: true,
      options: [
        { value: "active",   label: "Active"   },
        { value: "inactive", label: "Inactive" },
        { value: "banned",   label: "Banned"   },
      ],
      validation: (v) =>
        ["active", "inactive", "banned"].includes(v)
          ? null
          : "Please select a valid status",
    },
  ];

  const handleEditClick = (u: AdminUser) => {
    setSelectedUser(u);
    setShowEditModal(true);
  };

  const handleViewClick = (u: AdminUser) => {
    setSelectedViewUser(u);
    setShowViewModal(true);
  };

  const handleSaveEdit = async (data: Record<string, string | number>) => {
    if (!selectedUser) return;
    const target = selectedUser;   // ← tangkap ke const lokal
    setIsLoading(true);
    try {
      const payload: Record<string, any> = {
        name:   data.name as string,
        email:  data.email as string,
        role:   data.role as string,
        status: data.status as string,
      };
      if (typeof data.photo === "string" && data.photo.startsWith("data:image")) {
        payload.avatar_base64 = data.photo;
      }
      await adminService.updateAdminUser(target.id, payload);
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success("User Updated", `${target.name} updated successfully.`);
      await Promise.all([loadStats(), loadUsers()]);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDeleteClick = (u: AdminUser) => {
    if (u.status !== "banned") {
      toast.error("Cannot Delete", "Only banned users can be deleted.");
      return;
    }
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    const target = selectedUser;   // ← tangkap ke const lokal
    const name = target.name;
    try {
      await adminService.deleteAdminUser(target.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success("User Deleted", `${name} has been removed.`);
      await Promise.all([loadStats(), loadUsers()]);
    } catch {
      toast.error("Delete Failed", "Something went wrong. Please try again.");
    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        key: "user",
        header: "User",
        render: (u: AdminUser) => (
          <div className="flex items-center gap-3 min-w-[180px]">
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.name}
                className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-[#D4AF37]" />
              </div>
            )}
            <div>
              <p className="text-white font-semibold truncate max-w-[140px]">{u.name}</p>
              <p className="text-xs text-zinc-400 truncate max-w-[140px]">{u.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        render: (u: AdminUser) => (
          <Badge text={capitalizeFirst(u.role)} variant={USER_ROLE_STYLES[u.role]} />
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (u: AdminUser) => (
          <Badge
            text={capitalizeFirst(u.status)}
            variant={USER_STATUS_STYLES[u.status]}
            showDot
            dotColor={STATUS_DOT_COLORS[u.status]}
          />
        ),
      },
      {
        key: "join_date",
        header: "Join Date",
        render: (u: AdminUser) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{u.join_date}</span>
        ),
      },
      {
        key: "last_login",
        header: "Last Login",
        render: (u: AdminUser) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {u.last_login ?? "-"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-center",
        className: "text-center",
        render: (u: AdminUser) => (
          <ActionButtons
            actions={[
              { type: "view",   onClick: () => handleViewClick(u)   },
              { type: "edit",   onClick: () => handleEditClick(u)   },
              { type: "delete", onClick: () => handleDeleteClick(u) },
            ]}
          />
        ),
      },
    ],
    [handleViewClick, handleEditClick, handleDeleteClick]
  );

  /* ================= UI ================= */

  return (
    <DashboardLayout
      title="Users Management"
      subtitle="Manage all registered users"
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
            { icon: Users,    title: "Total Users", value: stats.total,     iconBgColor: "bg-[#22C55E1A]", iconColor: "text-[#22C55E]" },
            { icon: User,     title: "Customers",   value: stats.customers, iconBgColor: "bg-[#60A5FA1A]", iconColor: "text-[#60A5FA]" },
            { icon: Scissors, title: "Barbers",     value: stats.barbers,   iconBgColor: "bg-[#F59E0B1A]", iconColor: "text-[#F59E0B]" },
            { icon: Store,    title: "Owners",      value: stats.owners,    iconBgColor: "bg-[#C084FC1A]", iconColor: "text-[#C084FC]" },
          ]}
        />

        {/* ================= TABLE CARD ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search users by name, email..."
          filters={[
            {
              label: "Role",
              value: filterRole,
              onChange: setFilterRole,
              options: USER_ROLE_FILTER_OPTIONS,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: USER_STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredUsers.length === 0}
          emptyIcon={Users}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your filters"
        >
          {/* DESKTOP TABLE */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filteredUsers} columns={columns} />
          </div>

          {/* MOBILE CARDS */}
          <div className="block md:hidden">
            <MobileCardList
              data={filteredUsers}
              renderCard={(u) => (
                <MobileCard
                  title={u.name}
                  subtitle={<span className="text-xs text-muted-foreground">{u.email}</span>}
                  headerRight={
                    <Badge
                      text={capitalizeFirst(u.status)}
                      variant={USER_STATUS_STYLES[u.status]}
                      showDot
                      dotColor={STATUS_DOT_COLORS[u.status]}
                    />
                  }
                  fields={[
                    {
                      label: "Role",
                      value: <Badge text={capitalizeFirst(u.role)} variant={USER_ROLE_STYLES[u.role]} />,
                    },
                    { label: "Joined",     value: u.join_date         },
                    { label: "Last Login", value: u.last_login ?? "-" },
                  ]}
                  actions={
                    <ActionButtons
                      align="end"
                      actions={[
                        { type: "view",   onClick: () => handleViewClick(u)   },
                        { type: "edit",   onClick: () => handleEditClick(u)   },
                        { type: "delete", onClick: () => handleDeleteClick(u) },
                      ]}
                    />
                  }
                />
              )}
            />
          </div>
        </TableCard>

        {/* ================= PAGINATION ================= */}
        
      </div>

      {/* ================= MODALS ================= */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveEdit}
        title="Edit User"
        subtitle="Update user information and permissions"
        fields={editFields}
        initialData={{ ...selectedUser, photo: selectedUser?.avatar_url ?? "" }}
        isLoading={isLoading}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete User"
        itemName={selectedUser?.name ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {showViewModal && selectedViewUser && (
        <ViewUserModal
          user={selectedViewUser}
          onClose={() => { setShowViewModal(false); setSelectedViewUser(null); }}
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

function ViewUserModal({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-white font-semibold text-lg">User Detail</h3>
            <p className="text-zinc-400 text-sm mt-0.5">View user information</p>
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

          {/* Avatar + Nama + Email */}
          <div className="flex items-center gap-4 p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover border border-zinc-700 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-[#D4AF37]" />
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>

          <ViewField label="Role">
            <Badge text={capitalizeFirst(user.role)} variant={USER_ROLE_STYLES[user.role]} />
          </ViewField>
          <ViewField label="Status">
            <Badge
              text={capitalizeFirst(user.status)}
              variant={USER_STATUS_STYLES[user.status]}
              showDot
              dotColor={STATUS_DOT_COLORS[user.status]}
            />
          </ViewField>
          <ViewField label="Join Date" value={user.join_date} />
          <ViewField label="Last Login" value={user.last_login ?? "-"} />
        </div>
      </div>
    </div>
  );
}
