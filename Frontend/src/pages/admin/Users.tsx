import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Users, User, Scissors } from "lucide-react";

import StatsGrid from "@/components/admin/StatGrid";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import type { User as UserType } from "@/type/AdminType";

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

/* ================= TYPES ================= */
interface ExtendedUserType extends UserType {
  username?: string;
  lastLogin?: string;
  loginFrequency?: number;
  totalBookings?: number;
  totalSpending?: number;
  device?: string;
  location?: string;
}

/* ================= DUMMY DATA ================= */
const DUMMY_USERS: ExtendedUserType[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    username: "johndoe",
    phone: "+62 812-3456-7890",
    role: "customer",
    status: "active",
    joinDate: "2024-01-15",
    lastLogin: "2026-02-13 08:30",
    loginFrequency: 45,
    totalBookings: 12,
    totalSpending: 1250000,
    device: "Mobile - Android",
    location: "Jakarta, Indonesia",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    username: "janesmith",
    phone: "+62 813-4567-8901",
    role: "barber",
    status: "active",
    joinDate: "2024-01-20",
    lastLogin: "2026-02-13 07:15",
    loginFrequency: 120,
    totalBookings: 0,
    totalSpending: 0,
    device: "Desktop - Windows",
    location: "Bandung, Indonesia",
  },
  {
    id: 3,
    name: "Alice Brown",
    email: "alice@example.com",
    username: "alicebrown",
    phone: "+62 814-5678-9012",
    role: "owner",
    status: "active",
    joinDate: "2024-02-01",
    lastLogin: "2026-02-12 22:45",
    loginFrequency: 80,
    totalBookings: 0,
    totalSpending: 0,
    device: "Mobile - iOS",
    location: "Surabaya, Indonesia",
  },
  {
    id: 4,
    name: "Bob Wilson",
    email: "bob@example.com",
    username: "bobwilson",
    phone: "+62 815-6789-0123",
    role: "customer",
    status: "inactive",
    joinDate: "2024-02-05",
    lastLogin: "2026-01-20 14:30",
    loginFrequency: 8,
    totalBookings: 3,
    totalSpending: 350000,
    device: "Mobile - Android",
    location: "Yogyakarta, Indonesia",
  },
  {
    id: 5,
    name: "Charlie Davis",
    email: "charlie@example.com",
    username: "charlied",
    phone: "+62 816-7890-1234",
    role: "customer",
    status: "banned",
    joinDate: "2024-03-10",
    lastLogin: "2026-02-01 10:20",
    loginFrequency: 25,
    totalBookings: 5,
    totalSpending: 500000,
    device: "Desktop - MacOS",
    location: "Bali, Indonesia",
  },
];

/* ================= COMPONENT ================= */
export default function UsersManagement() {
  const toast = useToast();

  const [users, setUsers] = useState<ExtendedUserType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = getUser();

  useEffect(() => {
    setUsers(DUMMY_USERS);
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter((u) => u.role === "customer").length,
      barbers: users.filter((u) => u.role === "barber").length,
      owners: users.filter((u) => u.role === "owner").length,
      activeUsers: users.filter((u) => u.status === "active").length,
    };
  }, [users]);

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = searchInObject(user, searchQuery, [
        "name",
        "email",
        "phone",
        "username",
      ]);

      return (
        matchesSearch &&
        filterByField(user, "role", filterRole) &&
        filterByField(user, "status", filterStatus)
      );
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  /* ================= FORMAT CURRENCY ================= */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  /* ================= EDIT HANDLER ================= */
  const handleEditClick = (user: ExtendedUserType) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser?.id ? { ...user, ...data } : user
        )
      );
      setShowEditModal(false);
      toast.success("User Updated", `${selectedUser?.name} has been updated successfully.`);
      setSelectedUser(null);
    } catch {
      toast.error("Update Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (user: ExtendedUserType) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    const name = selectedUser.name;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    setSelectedUser(null);
    toast.success("User Deleted", `${name} has been removed.`);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "user",
      header: "User",
      render: (user: ExtendedUserType) => (
        <div>
          <p className="text-white font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">{user.phone}</p>
        </div>
      ),
    },
    {
      key: "username",
      header: "Username",
      render: (user: ExtendedUserType) => (
        <span className="font-mono text-xs text-muted-foreground">
          @{user.username}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user: ExtendedUserType) => (
        <Badge
          text={capitalizeFirst(user.role)}
          variant={USER_ROLE_STYLES[user.role]}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: ExtendedUserType) => (
        <Badge
          text={capitalizeFirst(user.status)}
          variant={USER_STATUS_STYLES[user.status]}
          showDot
          dotColor={STATUS_DOT_COLORS[user.status]}
        />
      ),
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (user: ExtendedUserType) => (
        <span className="text-xs text-muted-foreground">{user.joinDate}</span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (user: ExtendedUserType) => (
        <span className="text-xs text-muted-foreground">{user.lastLogin}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (user: ExtendedUserType) => (
        <ActionButtons
          actions={[
            { type: "edit", onClick: () => handleEditClick(user) },
            { type: "delete", onClick: () => handleDeleteClick(user) },
          ]}
        />
      ),
    },
  ];

  /* ================= EDIT MODAL FIELDS ================= */
  const editFields: FormField[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter full name",
      required: true,
      validation: (value) => {
        return value.length >= 3 ? null : "Name must be at least 3 characters";
      },
    },
    {
      name: "username",
      label: "Username",
      type: "text",
      placeholder: "Enter username",
      required: true,
      validation: (value) => {
        const usernameRegex = /^[a-z0-9_]+$/;
        return usernameRegex.test(value)
          ? null
          : "Username can only contain lowercase letters, numbers, and underscores";
      },
      helperText: "Lowercase letters, numbers, and underscores only",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter email",
      required: true,
      validation: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : "Invalid email format";
      },
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "text",
      placeholder: "+62 812-3456-7890",
      required: true,
      validation: (value) => {
        return value.length >= 10
          ? null
          : "Phone number must be at least 10 characters";
      },
    },
    {
      name: "role",
      label: "User Role",
      type: "select",
      required: true,
      options: [
        { value: "customer", label: "Customer" },
        { value: "barber", label: "Barber" },
        { value: "owner", label: "Owner" },
      ],
    },
    {
      name: "status",
      label: "Account Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "banned", label: "Banned" },
      ],
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g., Jakarta, Indonesia",
    },
  ];

  /* ================= UI ================= */
  return (
    <DashboardLayout
      title="Users Management"
      subtitle="Manage all registered barbershops"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={
        currentUser ?? {
          name: "Super Admin",
          email: "admin@cutbro.com",
          role: "admin",
        }
      }
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={3}
          stats={[
            { icon: Users, title: "Total Users", value: stats.total },
            { icon: User, title: "Active Users", value: stats.activeUsers },
            { icon: Scissors, title: "Barbers", value: stats.barbers },
          ]}
        />

        {/* ================= TABLE ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search users by name, email, username..."
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
          <DataTable data={filteredUsers} columns={columns} />

          <MobileCardList
            data={filteredUsers}
            renderCard={(user) => (
              <MobileCard
                title={user.name}
                subtitle={
                  <span className="text-xs font-mono">@{user.username}</span>
                }
                headerRight={
                  <Badge
                    text={capitalizeFirst(user.status)}
                    variant={USER_STATUS_STYLES[user.status]}
                    showDot
                    dotColor={STATUS_DOT_COLORS[user.status]}
                  />
                }
                fields={[
                  { label: "Email", value: user.email },
                  { label: "Phone", value: user.phone },
                  {
                    label: "Role",
                    value: (
                      <Badge
                        text={capitalizeFirst(user.role)}
                        variant={USER_ROLE_STYLES[user.role]}
                      />
                    ),
                  },
                  { label: "Joined", value: user.joinDate },
                  { label: "Last Login", value: user.lastLogin },
                  ...(user.role === "customer"
                    ? [
                        {
                          label: "Bookings",
                          value: String(user.totalBookings),
                        },
                        {
                          label: "Total Spent",
                          value: (
                            <span className="text-[#D4AF37]">
                              {formatCurrency(user.totalSpending || 0)}
                            </span>
                          ),
                        },
                      ]
                    : []),
                ]}
                actions={
                  <ActionButtons
                    actions={[
                      { type: "edit", onClick: () => handleEditClick(user) },
                      { type: "delete", onClick: () => handleDeleteClick(user) },
                    ]}
                  />
                }
              />
            )}
          />
        </TableCard>
      </div>

      {/* ================= EDIT MODAL ================= */}
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
        initialData={selectedUser || {}}
        isLoading={isLoading}
      />

      {/* ================= DELETE MODAL ================= */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete User"
        itemName={selectedUser?.name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </DashboardLayout>
  );
}