import { ROUTES } from "@/lib/constants/routes";

export function getRedirectPathByRole(role?: string | null) {
  switch ((role || "").trim().toLowerCase()) {
    case "admin":
      return ROUTES.ADMIN;
    case "ofitsiant":
      return ROUTES.WAITER;
    case "oshxona":
      return ROUTES.KITCHEN;
    case "kassa":
      return ROUTES.CASHIER;
    case "customer":
      return ROUTES.CUSTOMER;
    default:
      return ROUTES.CUSTOMER;
  }
}