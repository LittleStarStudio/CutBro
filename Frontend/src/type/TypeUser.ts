// @/type/TypeUser.ts

export type UserRole = "SuperAdmin" | "Owner" | "Barber" | "Customer";

export interface UserProfileData {
  joinDate: any;
  bio: string;
  location: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  // Add other fields as needed
}

export interface AppSettings {
  appName: string;
  // Add other settings as needed
}