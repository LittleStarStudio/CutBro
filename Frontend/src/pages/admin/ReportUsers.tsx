import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useMemo } from "react";
import { Users, User, Briefcase, Crown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import { capitalizeFirst } from "@/lib/utils/AdminUtils";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

/* =========================================================
   DUMMY DATA
========================================================= */

const DUMMY_USERS_DATA = [
  { id: 1,  name: "Rizky Pratama",    email: "rizky@gmail.com",    username: "rizky_p",    phone: "081234567890", role: "customer", status: "active",   joinDate: "2023-06-15", lastLogin: "2024-02-24", loginFrequency: 12, totalBookings: 8,  totalSpending: 1250000, device: "Android", location: "Jakarta"    },
  { id: 2,  name: "John Barber",      email: "john@cutbro.com",    username: "john_b",     phone: "082345678901", role: "barber",   status: "active",   joinDate: "2023-01-10", lastLogin: "2024-02-24", loginFrequency: 28, totalBookings: 0,  totalSpending: 0,       device: "iOS",     location: "Bandung"    },
  { id: 3,  name: "Budi Santoso",     email: "budi@gmail.com",     username: "budi_s",     phone: "083456789012", role: "customer", status: "active",   joinDate: "2023-08-01", lastLogin: "2024-02-18", loginFrequency: 6,  totalBookings: 5,  totalSpending: 875000,  device: "Android", location: "Surabaya"   },
  { id: 4,  name: "Owner Ryan",       email: "ryan@cutbro.com",    username: "ryan_owner", phone: "084567890123", role: "owner",    status: "active",   joinDate: "2022-11-05", lastLogin: "2024-02-23", loginFrequency: 30, totalBookings: 0,  totalSpending: 0,       device: "iOS",     location: "Jakarta"    },
  { id: 5,  name: "Andi Wijaya",      email: "andi@gmail.com",     username: "andi_w",     phone: "085678901234", role: "customer", status: "active",   joinDate: "2023-03-10", lastLogin: "2024-02-22", loginFrequency: 18, totalBookings: 14, totalSpending: 2100000, device: "Android", location: "Yogyakarta" },
  { id: 6,  name: "Mike Stylist",     email: "mike@cutbro.com",    username: "mike_s",     phone: "086789012345", role: "barber",   status: "active",   joinDate: "2023-02-14", lastLogin: "2024-02-24", loginFrequency: 25, totalBookings: 0,  totalSpending: 0,       device: "Android", location: "Bandung"    },
  { id: 7,  name: "Dika Ramadhan",    email: "dika@gmail.com",     username: "dika_r",     phone: "087890123456", role: "customer", status: "inactive", joinDate: "2023-11-20", lastLogin: "2024-01-30", loginFrequency: 3,  totalBookings: 3,  totalSpending: 450000,  device: "iOS",     location: "Medan"      },
  { id: 8,  name: "Owner Nina",       email: "nina@cutbro.com",    username: "nina_owner", phone: "088901234567", role: "owner",    status: "active",   joinDate: "2022-09-20", lastLogin: "2024-02-22", loginFrequency: 27, totalBookings: 0,  totalSpending: 0,       device: "iOS",     location: "Surabaya"   },
  { id: 9,  name: "Fajar Nugroho",    email: "fajar@gmail.com",    username: "fajar_n",    phone: "089012345678", role: "customer", status: "active",   joinDate: "2023-01-05", lastLogin: "2024-02-23", loginFrequency: 15, totalBookings: 12, totalSpending: 1800000, device: "Android", location: "Jakarta"    },
  { id: 10, name: "David Barber",     email: "david@cutbro.com",   username: "david_b",    phone: "081122334455", role: "barber",   status: "active",   joinDate: "2023-03-01", lastLogin: "2024-02-24", loginFrequency: 26, totalBookings: 0,  totalSpending: 0,       device: "Android", location: "Jakarta"    },
  { id: 11, name: "Gilang Permana",   email: "gilang@gmail.com",   username: "gilang_p",   phone: "082233445566", role: "customer", status: "active",   joinDate: "2023-09-14", lastLogin: "2024-02-10", loginFrequency: 5,  totalBookings: 4,  totalSpending: 625000,  device: "iOS",     location: "Bandung"    },
  { id: 12, name: "Andi Barber",      email: "andib@cutbro.com",   username: "andi_b",     phone: "083344556677", role: "barber",   status: "active",   joinDate: "2023-04-15", lastLogin: "2024-02-23", loginFrequency: 22, totalBookings: 0,  totalSpending: 0,       device: "Android", location: "Yogyakarta" },
  { id: 13, name: "Hendra Kusuma",    email: "hendra@gmail.com",   username: "hendra_k",   phone: "084455667788", role: "customer", status: "active",   joinDate: "2022-12-01", lastLogin: "2024-02-24", loginFrequency: 24, totalBookings: 20, totalSpending: 3200000, device: "iOS",     location: "Jakarta"    },
  { id: 14, name: "Owner Budi",       email: "budio@cutbro.com",   username: "budi_owner", phone: "085566778899", role: "owner",    status: "active",   joinDate: "2023-01-15", lastLogin: "2024-02-20", loginFrequency: 20, totalBookings: 0,  totalSpending: 0,       device: "iOS",     location: "Bandung"    },
  { id: 15, name: "Irfan Hakim",      email: "irfan@gmail.com",    username: "irfan_h",    phone: "086677889900", role: "customer", status: "inactive", joinDate: "2023-07-22", lastLogin: "2024-02-15", loginFrequency: 7,  totalBookings: 6,  totalSpending: 950000,  device: "Android", location: "Surabaya"   },
  { id: 16, name: "Lukman Hakim",     email: "lukman@gmail.com",   username: "lukman_h",   phone: "087788990011", role: "customer", status: "active",   joinDate: "2023-02-28", lastLogin: "2024-02-21", loginFrequency: 20, totalBookings: 18, totalSpending: 2750000, device: "Android", location: "Medan"      },
  { id: 17, name: "Tegar Maulana",    email: "tegar@gmail.com",    username: "tegar_m",    phone: "088899001122", role: "customer", status: "active",   joinDate: "2022-10-05", lastLogin: "2024-02-24", loginFrequency: 30, totalBookings: 27, totalSpending: 4100000, device: "iOS",     location: "Jakarta"    },
  { id: 18, name: "Reza Mahardika",   email: "reza@gmail.com",     username: "reza_m",     phone: "089900112233", role: "customer", status: "banned",   joinDate: "2023-06-08", lastLogin: "2024-01-10", loginFrequency: 2,  totalBookings: 9,  totalSpending: 1350000, device: "Android", location: "Bandung"    },
  { id: 19, name: "Surya Dinata",     email: "surya@gmail.com",    username: "surya_d",    phone: "081011223344", role: "customer", status: "active",   joinDate: "2023-08-19", lastLogin: "2024-02-11", loginFrequency: 6,  totalBookings: 5,  totalSpending: 825000,  device: "iOS",     location: "Yogyakarta" },
  { id: 20, name: "Kevin Setiawan",   email: "kevin@gmail.com",    username: "kevin_s",    phone: "082122334455", role: "customer", status: "active",   joinDate: "2023-10-03", lastLogin: "2024-02-12", loginFrequency: 8,  totalBookings: 5,  totalSpending: 750000,  device: "Android", location: "Surabaya"   },
];

/* =========================================================
   FILTER OPTIONS
========================================================= */

const ROLE_FILTER_OPTIONS = [
  { value: "all",      label: "All Roles" },
  { value: "customer", label: "Customer"  },
  { value: "barber",   label: "Barber"    },
  { value: "owner",    label: "Owner"     },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "active",   label: "Active"     },
  { value: "inactive", label: "Inactive"   },
  { value: "banned",   label: "Banned"     },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ReportUsers() {
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterRole, setFilterRole]     = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const currentUser = getUser();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  /* ── filtered ── */
  const filtered = useMemo(() => {
    return DUMMY_USERS_DATA.filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        String(user.id)?.includes(q);

      const matchesRole   = filterRole   === "all" || user.role?.toLowerCase()   === filterRole;
      const matchesStatus = filterStatus === "all" || user.status?.toLowerCase() === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, filterRole, filterStatus]);

  /* ── stats ── */
  const stats = useMemo(() => {
    const active = filtered.filter((u) => u.status === "active");
    return {
      totalUsers:    filtered.length,
      activeUsers:   active.length,
      totalBookings: filtered.reduce((a, b) => a + (b.totalBookings || 0), 0),
      totalSpending: filtered.reduce((a, b) => a + (b.totalSpending || 0), 0),
    };
  }, [filtered]);

  /* ── export ── */
  const handleExportExcel = () => {
    const exportData = filtered.map((user, i) => ({
      "No":                   i + 1,
      "User ID":              user.id,
      "Name":                 user.name,
      "Email":                user.email,
      "Username":             user.username,
      "Phone":                user.phone,
      "Role":                 capitalizeFirst(user.role),
      "Status":               capitalizeFirst(user.status),
      "Join Date":            user.joinDate,
      "Last Login":           user.lastLogin,
      "Login Frequency":      user.loginFrequency,
      "Total Bookings":       user.totalBookings || 0,
      "Total Spending (IDR)": user.totalSpending || 0,
      "Device":               user.device,
      "Location":             user.location,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    ws["!cols"] = [
      { wch: 5 }, { wch: 10 }, { wch: 20 }, { wch: 25 },
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
      { wch: 20 }, { wch: 14 }, { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Users Report");
    XLSX.writeFile(wb, `users-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ── role badge style ── */
  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      owner:    "bg-yellow-500/10 text-yellow-400",
      barber:   "bg-blue-500/10 text-blue-400",
      customer: "bg-gray-500/10 text-gray-400",
    };
    return map[role] ?? "bg-gray-500/10 text-gray-400";
  };

  /* ── status badge style ── */
  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; dot: string }> = {
      active:   { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500"  },
      inactive: { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500" },
      banned:   { bg: "bg-red-500/10 text-red-400",       dot: "bg-red-500"    },
    };
    return map[status] ?? { bg: "bg-gray-500/10 text-gray-400", dot: "bg-gray-500" };
  };

  /* ── columns ── */
  const columns = useMemo(() => [
    {
      key: "name",
      header: "Nama",
      render: (user: any) => (
        <span className="text-white font-semibold">{user.name}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user: any) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
          {capitalizeFirst(user.role)}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user: any) => (
        <span className="text-[#B8B8B8]">{user.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: any) => {
        const s = statusBadge(user.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {capitalizeFirst(user.status)}
          </span>
        );
      },
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (user: any) => (
        <span className="text-[#B8B8B8] text-xs">{user.joinDate}</span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (user: any) => (
        <span className="text-[#B8B8B8] text-xs">{user.lastLogin}</span>
      ),
    },
  ], []);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <DashboardLayout
      title="Users Report"
      subtitle="Export user registration & activity data"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={currentUser ?? {
        name: "Super Admin",
        email: "admin@cutbro.com",
        role: "admin",
      }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        <PageHeader
          actions={<button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49f30] text-black font-semibold text-sm transition-colors duration-200 whitespace-nowrap"
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>} title={""}        />

        <StatsGrid
          stats={[
            { icon: Users,     title: "Total Users",    value: stats.totalUsers    },
            { icon: User,      title: "Active Users",   value: stats.activeUsers   },
            { icon: Briefcase, title: "Total Bookings", value: stats.totalBookings },
            { icon: Crown,     title: "Total Spending", value: formatCurrency(stats.totalSpending) },
          ]}
          columns={4}
        />

        {/* INFO BOX */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <span className="text-base">ⓘ</span>
            This report contains:
          </div>
          <p className="text-[#B8B8B8] text-sm leading-relaxed">
            User ID, Name, Email, Username, Phone, Role (Admin/Barber/Customer/Owner), Status (Active/Inactive/Banned), Join Date, Last Login, Login Frequency, Total Bookings, Total Spending, Device, and Location. Default period is current month.
          </p>
          <p className="text-blue-400 text-sm">
            Data will be exported in Excel format. Total users — Total items in this report:{" "}
            <span className="font-bold">{filtered.length}</span>
          </p>
        </div>

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search name, email, or ID..."
          filters={[
            {
              label: "Role",
              value: filterRole,
              onChange: setFilterRole,
              options: ROLE_FILTER_OPTIONS,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filtered.length === 0}
          emptyIcon={Users}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your filters"
        >
          {/* DESKTOP */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filtered} columns={columns} />
          </div>

          {/* MOBILE */}
          <div className="block md:hidden">
            <MobileCardList
              data={filtered}
              renderCard={(user: any) => {
                const s = statusBadge(user.status);
                return (
                  <MobileCard
                    title={user.name}
                    subtitle={<span className="text-[#B8B8B8] text-xs">{user.email}</span>}
                    headerRight={
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {capitalizeFirst(user.status)}
                      </span>
                    }
                    fields={[
                      {
                        label: "Role",
                        value: (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                            {capitalizeFirst(user.role)}
                          </span>
                        ),
                      },
                      { label: "Join Date",  value: user.joinDate  },
                      { label: "Last Login", value: user.lastLogin },
                    ]}
                  />
                );
              }}
            />
          </div>
        </TableCard>

      </div>
    </DashboardLayout>
  );
}