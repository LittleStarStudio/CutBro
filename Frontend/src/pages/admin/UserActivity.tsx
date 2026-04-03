import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Store,
  Scissors,
  User,
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

type UserRole = "owner" | "barber" | "customer";

type ActivityType =
  | "add_barbershop"
  | "edit_barbershop"
  | "add_service"
  | "edit_service"
  | "complete_job"
  | "reservation"
  | "cancel_reservation";

type ActivityStatus = "success" | "failed" | "pending";

interface UserActivity {
  id: number;
  user: string;
  email: string;
  role: UserRole;
  activityType: ActivityType;
  description: string;
  target: string;
  timestamp: string;
  status: ActivityStatus;
}

/* ================= CONSTANTS ================= */

const ACTIVITY_ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "owner", label: "Owner" },
  { value: "barber", label: "Barber" },
  { value: "customer", label: "Customer" },
];

const ACTIVITY_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Activities" },
  { value: "add_barbershop", label: "Add Barbershop" },
  { value: "edit_barbershop", label: "Edit Barbershop" },
  { value: "add_service", label: "Add Service" },
  { value: "edit_service", label: "Edit Service" },
  { value: "complete_job", label: "Complete Job" },
  { value: "reservation", label: "Reservation" },
  { value: "cancel_reservation", label: "Cancel Reservation" },
];

const ROLE_STYLES: Record<UserRole, BadgeVariant> = {
  owner: "warning",
  barber: "info",
  customer: "default",
};

const ACTIVITY_STYLES: Record<ActivityType, BadgeVariant> = {
  add_barbershop: "success",
  edit_barbershop: "warning",
  add_service: "success",
  edit_service: "warning",
  complete_job: "success",
  reservation: "info",
  cancel_reservation: "danger",
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  add_barbershop: "Add Barbershop",
  edit_barbershop: "Edit Barbershop",
  add_service: "Add Service",
  edit_service: "Edit Service",
  complete_job: "Complete Job",
  reservation: "Reservation",
  cancel_reservation: "Cancel Reservation",
};

const STATUS_STYLES: Record<ActivityStatus, BadgeVariant> = {
  success: "success",
  failed: "danger",
  pending: "warning",
};

const STATUS_DOT_COLORS: Record<ActivityStatus, string> = {
  success: "bg-green-400",
  failed: "bg-red-400",
  pending: "bg-yellow-400",
};

/* ================= DUMMY DATA ================= */

const DUMMY_ACTIVITIES: UserActivity[] = [
  // Owner activities
  {
    id: 1,
    user: "Alice Brown",
    email: "alice@example.com",
    role: "owner",
    activityType: "add_barbershop",
    description: "Added a new barbershop",
    target: "CutBro Surabaya - Gubeng",
    timestamp: "2026-02-13 08:00:00",
    status: "success",
  },
  {
    id: 2,
    user: "Alice Brown",
    email: "alice@example.com",
    role: "owner",
    activityType: "add_service",
    description: "Added a new service",
    target: "Haircut + Creambath - Rp 85.000",
    timestamp: "2026-02-13 08:30:00",
    status: "success",
  },
  {
    id: 3,
    user: "Alice Brown",
    email: "alice@example.com",
    role: "owner",
    activityType: "edit_barbershop",
    description: "Updated barbershop information",
    target: "CutBro Surabaya - Gubeng (operating hours)",
    timestamp: "2026-02-13 09:15:00",
    status: "success",
  },
  {
    id: 4,
    user: "David Santoso",
    email: "david@example.com",
    role: "owner",
    activityType: "edit_service",
    description: "Updated service price",
    target: "Regular Haircut - Rp 45.000 → Rp 50.000",
    timestamp: "2026-02-13 10:00:00",
    status: "success",
  },
  {
    id: 5,
    user: "David Santoso",
    email: "david@example.com",
    role: "owner",
    activityType: "add_barbershop",
    description: "Added a new barbershop",
    target: "CutBro Jakarta - Kemang",
    timestamp: "2026-02-13 10:45:00",
    status: "failed",
  },

  // Barber activities
  {
    id: 6,
    user: "Jane Smith",
    email: "jane@example.com",
    role: "barber",
    activityType: "complete_job",
    description: "Completed a job",
    target: "Reservation #R-0012 - John Doe (Regular Haircut)",
    timestamp: "2026-02-13 09:00:00",
    status: "success",
  },
  {
    id: 7,
    user: "Jane Smith",
    email: "jane@example.com",
    role: "barber",
    activityType: "complete_job",
    description: "Completed a job",
    target: "Reservation #R-0013 - Bob Wilson (Haircut + Hair Wash)",
    timestamp: "2026-02-13 10:30:00",
    status: "success",
  },
  {
    id: 8,
    user: "Reza Pratama",
    email: "reza@example.com",
    role: "barber",
    activityType: "complete_job",
    description: "Completed a job",
    target: "Reservation #R-0014 - Charlie Davis (Haircut + Creambath)",
    timestamp: "2026-02-13 11:00:00",
    status: "success",
  },
  {
    id: 9,
    user: "Reza Pratama",
    email: "reza@example.com",
    role: "barber",
    activityType: "complete_job",
    description: "Completed a job",
    target: "Reservation #R-0015 - Andi Wijaya (Regular Haircut)",
    timestamp: "2026-02-13 13:00:00",
    status: "failed",
  },

  // Customer activities
  {
    id: 10,
    user: "John Doe",
    email: "john@example.com",
    role: "customer",
    activityType: "reservation",
    description: "Created a new reservation",
    target: "CutBro Surabaya - Barber: Jane Smith (14:00)",
    timestamp: "2026-02-13 07:00:00",
    status: "success",
  },
  {
    id: 11,
    user: "Bob Wilson",
    email: "bob@example.com",
    role: "customer",
    activityType: "reservation",
    description: "Created a new reservation",
    target: "CutBro Surabaya - Barber: Jane Smith (10:00)",
    timestamp: "2026-02-13 07:30:00",
    status: "success",
  },
  {
    id: 12,
    user: "Charlie Davis",
    email: "charlie@example.com",
    role: "customer",
    activityType: "cancel_reservation",
    description: "Cancelled a reservation",
    target: "Reservation #R-0010 - CutBro Jakarta (15:00)",
    timestamp: "2026-02-13 08:15:00",
    status: "success",
  },
  {
    id: 13,
    user: "Andi Wijaya",
    email: "andi@example.com",
    role: "customer",
    activityType: "reservation",
    description: "Created a new reservation",
    target: "CutBro Jakarta - Barber: Reza Pratama (13:00)",
    timestamp: "2026-02-13 09:00:00",
    status: "pending",
  },
  {
    id: 14,
    user: "Sari Dewi",
    email: "sari@example.com",
    role: "customer",
    activityType: "cancel_reservation",
    description: "Cancelled a reservation",
    target: "Reservation #R-0016 - CutBro Surabaya (11:00)",
    timestamp: "2026-02-13 10:00:00",
    status: "success",
  },
];

/* ================= COMPONENT ================= */

export default function UsersActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const currentUser = getUser();

  /* ================= FETCH ================= */
  useEffect(() => {
    setActivities(DUMMY_ACTIVITIES);
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    return {
      owner: activities.filter((a) => a.role === "owner").length,
      barber: activities.filter((a) => a.role === "barber").length,
      customer: activities.filter((a) => a.role === "customer").length,
      total: activities.length,
    };
  }, [activities]);

  /* ================= FILTER ================= */
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch = searchInObject(activity, searchQuery, [
        "user",
        "email",
        "description",
        "target",
      ]);
      return (
        matchesSearch &&
        filterByField(activity, "role", filterRole) &&
        filterByField(activity, "activityType", filterType)
      );
    });
  }, [activities, searchQuery, filterRole, filterType]);

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "user",
      header: "User",
      render: (a: UserActivity) => (
        <div>
          <p className="text-white font-semibold">{a.user}</p>
          <p className="text-xs text-muted-foreground">{a.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (a: UserActivity) => (
        <Badge
          text={capitalizeFirst(a.role)}
          variant={ROLE_STYLES[a.role]}
        />
      ),
    },
    {
      key: "activityType",
      header: "Activity",
      render: (a: UserActivity) => (
        <Badge
          text={ACTIVITY_LABELS[a.activityType]}
          variant={ACTIVITY_STYLES[a.activityType]}
        />
      ),
    },
    {
      key: "target",
      header: "Detail",
      render: (a: UserActivity) => (
        <div>
          <p className="text-xs text-muted-foreground">{a.description}</p>
          <p className="text-xs text-white/80 mt-0.5">{a.target}</p>
        </div>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (a: UserActivity) => (
        <span className="text-xs text-muted-foreground">{a.timestamp}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a: UserActivity) => (
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
      title="Users Activity"
      subtitle="Monitor all user activities"
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
            { icon: Store, title: "Owner Activity", value: stats.owner },
            { icon: Scissors, title: "Barber Activity", value: stats.barber },
            { icon: User, title: "Customer Activity", value: stats.customer },
            { icon: Activity, title: "Total Activity", value: stats.total },
          ]}
        />

        {/* ================= TABLE ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by user, email, activity detail..."
          filters={[
            {
              label: "Role",
              value: filterRole,
              onChange: setFilterRole,
              options: ACTIVITY_ROLE_FILTER_OPTIONS,
            },
            {
              label: "Activity",
              value: filterType,
              onChange: setFilterType,
              options: ACTIVITY_TYPE_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredActivities.length === 0}
          emptyIcon={Activity}
          emptyTitle="No activity found"
          emptyDescription="Try adjusting your filters"
        >
          <DataTable data={filteredActivities} columns={columns} />

          <MobileCardList
            data={filteredActivities}
            renderCard={(a) => (
              <MobileCard
                title={a.user}
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
                    label: "Role",
                    value: (
                      <Badge
                        text={capitalizeFirst(a.role)}
                        variant={ROLE_STYLES[a.role]}
                      />
                    ),
                  },
                  {
                    label: "Activity",
                    value: (
                      <Badge
                        text={ACTIVITY_LABELS[a.activityType]}
                        variant={ACTIVITY_STYLES[a.activityType]}
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