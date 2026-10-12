export type { AdminUser, UserRole } from "../types";

// The backend only has isActive (boolean) + deactivate/reactivate — no
// separate "suspended" state, no hard-delete for other users' accounts,
// and no working subscription-tier override (see admin-dashboard.ts
// comments). Trimmed to the 5 actions that map to a real endpoint.
export type AdminActionType = "deactivate" | "reactivate" | "edit" | "reset_password" | "verify_email";

export interface EditUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  stateOfResidence: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}
