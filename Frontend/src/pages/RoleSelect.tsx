import { useNavigate } from "react-router-dom";
import { User, Crown } from "lucide-react";
import type { Role } from "@/lib/auth";

type RoleCard = {
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export default function RoleSelect() {
  const navigate = useNavigate();

  const roles: RoleCard[] = [
    {
      role: "customer",
      label: "Customer",
      description: "Book services & manage appointments",
      icon: <User className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      role: "owner",
      label: "Owner",
      description: "Manage shop & employees",
      icon: <Crown className="w-6 h-6" />,
      color: "bg-purple-500",
    },
  ];

  const handleSelect = (role: Role) => {
    sessionStorage.setItem("selectedRole", role);

    // 🔥 selalu ke register (bukan login)
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-10">
          Select Role
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => handleSelect(item.role)}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left hover:border-amber-500"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white mb-4`}>
                {item.icon}
              </div>

              <h3 className="text-lg font-semibold text-white">{item.label}</h3>
              <p className="text-sm text-neutral-400 mt-1">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
