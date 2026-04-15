import type { UserRole } from "@/lib/constants/roles";

export interface AppUser {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  createdAt?: unknown;
}
