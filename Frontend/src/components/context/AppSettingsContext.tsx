import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/services/api";

interface AppBranding {
  appName: string;
  appLogoUrl: string | null;
  refresh: () => void;
}

const AppSettingsContext = createContext<AppBranding>({
  appName: "CutBro",
  appLogoUrl: null,
  refresh: () => {},
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [appName,    setAppName]    = useState("CutBro");
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get("/app-settings/public")
      .then((r) => {
        setAppName(r.data.data.app_name ?? "CutBro");
        setAppLogoUrl(r.data.data.app_logo_url ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Update favicon + tab title otomatis
  useEffect(() => {
    document.title = appName;
    if (appLogoUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = appLogoUrl;
    }
  }, [appName, appLogoUrl]);

  return (
    <AppSettingsContext.Provider value={{ appName, appLogoUrl, refresh: load }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
