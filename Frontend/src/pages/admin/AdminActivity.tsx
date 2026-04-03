import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  DollarSign,
  ToggleRight,
  Settings,
  Activity,
} from "lucide-react";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import {
  searchInObject,
  filterByField,
  capitalizeFirst,
} from "@/lib/utils/AdminUtils";

import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Badge from "@/components/admin/Badge";

/* ================= TYPES ================= */

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "gold" | "info";

type AdminActionType =
  | "edit_pricing"
  | "toggle_status"
  | "update_settings";

type ActionStatus = "success" | "failed" | "pending";

interface AdminActivity {
  id: number;
  admin: string;
  email: string;
  actionType: AdminActionType;
  description: string;
  target: string;
  timestamp: string;
  status: ActionStatus;
}

/* ================= CONSTANTS ================= */

const ACTION_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "edit_pricing", label: "Edit Pricing" },
  { value: "toggle_status", label: "Toggle Status" },
  { value: "update_settings", label: "Update Settings" },
];

const ACTION_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

const ACTION_STYLES: Record<AdminActionType, BadgeVariant> = {
  edit_pricing: "warning",
  toggle_status: "info",
  update_settings: "primary",
};

const ACTION_LABELS: Record<AdminActionType, string> = {
  edit_pricing: "Edit Pricing",
  toggle_status: "Toggle Status",
  update_settings: "Update Settings",
};

const STATUS_STYLES: Record<ActionStatus, BadgeVariant> = {
  success: "success",
  failed: "danger",
  pending: "warning",
};

const STATUS_DOT_COLORS: Record<ActionStatus, string> = {
  success: "bg-green-400",
  failed: "bg-red-400",
  pending: "bg-yellow-400",
};

/* ================= DUMMY DATA ================= */

const DUMMY_ADMIN_ACTIVITIES: AdminActivity[] = [
  {
    id: 1,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "edit_pricing",
    description: "Updated service pricing",
    target: "Regular Haircut - Rp 45.000 → Rp 50.000 (CutBro Surabaya - Gubeng)",
    timestamp: "2026-02-13 08:05:00",
    status: "success",
  },
  {
    id: 2,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "toggle_status",
    description: "Deactivated a barbershop",
    target: "CutBro Jakarta - Kemang → Inactive",
    timestamp: "2026-02-13 08:30:00",
    status: "success",
  },
  {
    id: 3,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "update_settings",
    description: "Updated platform commission rate",
    target: "Global Settings - Commission: 10% → 12%",
    timestamp: "2026-02-13 09:00:00",
    status: "success",
  },
  {
    id: 4,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "edit_pricing",
    description: "Updated service pricing",
    target: "Haircut + Creambath - Rp 80.000 → Rp 85.000 (CutBro Surabaya - Gubeng)",
    timestamp: "2026-02-13 09:30:00",
    status: "success",
  },
  {
    id: 5,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "toggle_status",
    description: "Activated a barbershop",
    target: "GentsCut Bandung - Dago → Active",
    timestamp: "2026-02-13 10:00:00",
    status: "success",
  },
  {
    id: 6,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "edit_pricing",
    description: "Updated service pricing",
    target: "Haircut + Hair Wash - Rp 60.000 → Rp 65.000 (GentsCut Bandung - Dago)",
    timestamp: "2026-02-13 10:30:00",
    status: "failed",
  },
  {
    id: 7,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "update_settings",
    description: "Updated reservation cancellation policy",
    target: "Global Settings - Cancellation window: 1h → 2h before appointment",
    timestamp: "2026-02-13 11:00:00",
    status: "success",
  },
  {
    id: 8,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "toggle_status",
    description: "Deactivated a barber account",
    target: "Reza Pratama (reza@example.com) → Inactive",
    timestamp: "2026-02-13 11:30:00",
    status: "success",
  },
  {
    id: 9,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "edit_pricing",
    description: "Updated service pricing",
    target: "Regular Haircut - Rp 50.000 → Rp 55.000 (OldCut Surabaya - Darmo)",
    timestamp: "2026-02-13 13:00:00",
    status: "success",
  },
  {
    id: 10,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "toggle_status",
    description: "Activated a barber account",
    target: "Jane Smith (jane@example.com) → Active",
    timestamp: "2026-02-13 13:30:00",
    status: "pending",
  },
  {
    id: 11,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "update_settings",
    description: "Updated maximum active barbers per barbershop",
    target: "Global Settings - Max barbers per shop: 5 → 8",
    timestamp: "2026-02-13 14:00:00",
    status: "success",
  },
  {
    id: 12,
    admin: "Super Admin",
    email: "admin@cutbro.com",
    actionType: "edit_pricing",
    description: "Updated service pricing",
    target: "Beard Trim - Rp 25.000 → Rp 30.000 (CutBro Jakarta - Kemang)",
    timestamp: "2026-02-13 14:30:00",
    status: "success",
  },
];

/* ================= COMPONENT ================= */

export default function AdminActivity() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const currentUser = getUser();

  /* ================= FETCH ================= */
  useEffect(() => {
    setActivities(DUMMY_ADMIN_ACTIVITIES);
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    return {
      editPricing: activities.filter((a) => a.actionType === "edit_pricing").length,
      toggleStatus: activities.filter((a) => a.actionType === "toggle_status").length,
      updateSettings: activities.filter((a) => a.actionType === "update_settings").length,
      total: activities.length,
    };
  }, [activities]);

  /* ================= FILTER ================= */
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch = searchInObject(activity, searchQuery, [
        "admin",
        "email",
        "description",
        "target",
      ]);
      return (
        matchesSearch &&
        filterByField(activity, "actionType", filterType) &&
        filterByField(activity, "status", filterStatus)
      );
    });
  }, [activities, searchQuery, filterType, filterStatus]);

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "admin",
      header: "Admin",
      render: (a: AdminActivity) => (
        <div>
          <p className="text-white font-semibold">{a.admin}</p>
          <p className="text-xs text-muted-foreground">{a.email}</p>
        </div>
      ),
    },
    {
      key: "actionType",
      header: "Action",
      render: (a: AdminActivity) => (
        <Badge
          text={ACTION_LABELS[a.actionType]}
          variant={ACTION_STYLES[a.actionType]}
        />
      ),
    },
    {
      key: "target",
      header: "Detail",
      render: (a: AdminActivity) => (
        <div>
          <p className="text-xs text-muted-foreground">{a.description}</p>
          <p className="text-xs text-white/80 mt-0.5">{a.target}</p>
        </div>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (a: AdminActivity) => (
        <span className="text-xs text-muted-foreground">{a.timestamp}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a: AdminActivity) => (
        <Badge
          text={capitalizeFirst(a.status)}
          variant={STATUS_STYLES[a.status]}
          showDot
          dotColor={STATUS_DOT_COLORS[a.status]}
        />
      ),
    },
  ];

  /* ================= UI ================= */
  return (
    <DashboardLayout
      title="Admin Activity"
      subtitle="Monitor all admin actions and changes"
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
      <div className="space-y-6 lg:space-y-8">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: DollarSign, title: "Edit Pricing", value: stats.editPricing },
            { icon: ToggleRight, title: "Toggle Status", value: stats.toggleStatus },
            { icon: Settings, title: "Update Settings", value: stats.updateSettings },
            { icon: Activity, title: "Total Actions", value: stats.total },
          ]}
        />

        {/* ================= TABLE ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by admin, email, action detail..."
          filters={[
            {
              label: "Action",
              value: filterType,
              onChange: setFilterType,
              options: ACTION_TYPE_FILTER_OPTIONS,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: ACTION_STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredActivities.length === 0}
          emptyIcon={ShieldCheck}
          emptyTitle="No admin activity found"
          emptyDescription="Try adjusting your filters"
        >
          <DataTable data={filteredActivities} columns={columns} />

          <MobileCardList
            data={filteredActivities}
            renderCard={(a) => (
              <MobileCard
                title={a.admin}
                subtitle={<span className="text-xs">{a.email}</span>}
                headerRight={
                  <Badge
                    text={capitalizeFirst(a.status)}
                    variant={STATUS_STYLES[a.status]}
                    showDot
                    dotColor={STATUS_DOT_COLORS[a.status]}
                  />
                }
                fields={[
                  {
                    label: "Action",
                    value: (
                      <Badge
                        text={ACTION_LABELS[a.actionType]}
                        variant={ACTION_STYLES[a.actionType]}
                      />
                    ),
                  },
                  { label: "Description", value: a.description },
                  { label: "Target", value: a.target },
                  { label: "Time", value: a.timestamp },
                ]}
              />
            )}
          />
        </TableCard>
      </div>
    </DashboardLayout>
  );
}