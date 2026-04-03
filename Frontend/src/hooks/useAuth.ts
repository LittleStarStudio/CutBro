import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Role } from "@/lib/auth";

export function useRoleGuard() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem("selectedRole") as Role | null;

    if (!role) {
      navigate("/roleselect", { replace: true });
    } else {
      setSelectedRole(role);
    }

    setReady(true);
  }, [navigate]);

  const clearRole = () => {
    sessionStorage.removeItem("selectedRole");
  };

  const backToRoleSelect = () => {
    clearRole();
    navigate("/roleselect", { replace: true });
  };

  return {
    selectedRole,
    clearRole,
    backToRoleSelect,
    ready,
  };
}
