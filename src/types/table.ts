import type { PlaceStatus } from "@/lib/constants/place-status";

export interface TableItem {
  id: string;
  name: string;
  seats?: number;
  status?: PlaceStatus;
  createdAt?: unknown;
}
