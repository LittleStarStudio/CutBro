import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/context/AuthContext";
import { getRoleDashboard } from "@/lib/auth";
import api from "@/services/api";

function normalizeRole(role: string): "admin" | "owner" | "barber" | "customer" {
  if (role === "super_admin") return "admin";
  return role as "admin" | "owner" | "barber" | "customer";
}

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const accessToken  = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const error        = searchParams.get("error");

    if (error || !accessToken || !refreshToken) {
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    localStorage.setItem("cutbro_token", accessToken);
    localStorage.setItem("cutbro_refresh_token", refreshToken);

    api.get("/auth/me")
      .then((res) => {
        const raw  = res.data.data ?? res.data;
        const user = { ...raw, role: normalizeRole(raw.role) };
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        navigate(getRoleDashboard(user.role), { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("cutbro_token");
        localStorage.removeItem("cutbro_refresh_token");
        setStatus("Login failed. Redirecting...");
        setTimeout(() => navigate("/login?error=google_failed", { replace: true }), 1500);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <p className="text-white text-sm">{status}</p>
    </div>
  );
}
