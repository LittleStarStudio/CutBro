import api from "./api";

export interface AppSettings {
  app_name: string;
  app_website: string | null;
  app_logo_url: string | null;
}

export const getAppSettings = (): Promise<AppSettings> =>
  api.get("/admin/app-settings").then((r) => r.data.data);

export const updateAppSettings = (data: { app_name?: string; app_website?: string | null }) =>
  api.patch("/admin/app-settings", data).then((r) => r.data.data);

export const uploadAppLogo = (file: File): Promise<{ app_logo_url: string }> => {
  const fd = new FormData();
  fd.append("logo", file);
  return api
    .post<{ success: boolean; data: { app_logo_url: string } }>(
      "/admin/app-settings/logo",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    .then((r) => r.data.data);
};
