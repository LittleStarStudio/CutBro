import { Activity, User, Calendar, CreditCard, LogIn, ShoppingBag } from "lucide-react";

interface ActivityLog {
  id: number;
  user: string;
  email: string;
  action: string;
  type: "booking" | "login" | "payment" | "registration" | "cancellation";
  timestamp: string;
  status: "success" | "pending" | "failed";
  details?: string;
}

interface ActivityLogTableProps {
  activities: ActivityLog[];
}

export default function ActivityLogTable({ activities }: ActivityLogTableProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="w-4 h-4" />;
      case "login":
        return <LogIn className="w-4 h-4" />;
      case "payment":
        return <CreditCard className="w-4 h-4" />;
      case "registration":
        return <User className="w-4 h-4" />;
      case "cancellation":
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
            Success
          </span>
        );
      case "pending":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-950 text-red-400 border border-red-800">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      booking: "bg-blue-950 text-blue-400 border-blue-800",
      login: "bg-purple-950 text-purple-400 border-purple-800",
      payment: "bg-amber-950 text-amber-400 border-amber-800",
      registration: "bg-green-950 text-green-400 border-green-800",
      cancellation: "bg-red-950 text-red-400 border-red-800",
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[type] || "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-4 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                User
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Action
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-500">
                  No activity logs found
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-neutral-800/50 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                        {activity.user.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {activity.user}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {activity.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-neutral-800 text-amber-500 group-hover:bg-amber-950 transition-colors">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {activity.action}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-neutral-500">
                            {activity.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getTypeBadge(activity.type)}</td>
                  <td className="py-4 px-4">{getStatusBadge(activity.status)}</td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-neutral-400">
                      {activity.timestamp}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            No activity logs found
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 hover:border-amber-600/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center text-white font-semibold shadow-lg">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {activity.user}
                    </p>
                    <p className="text-xs text-neutral-500">{activity.email}</p>
                  </div>
                </div>
                {getStatusBadge(activity.status)}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-neutral-700 text-amber-500">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {activity.action}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-neutral-500">{activity.details}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-700">
                {getTypeBadge(activity.type)}
                <p className="text-xs text-neutral-500">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}