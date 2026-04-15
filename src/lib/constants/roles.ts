export const ROLES = {
  ADMIN: "admin",
  WAITER: "ofitsiant",
  CASHIER: "kassa",
  KITCHEN: "oshxona",
  CUSTOMER: "customer",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
