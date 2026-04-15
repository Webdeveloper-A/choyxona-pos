import type { PlaceStatus } from "@/lib/constants/place-status";

export interface RoomItem {
  id: string;
  name: string;
  capacity?: number;
  status?: PlaceStatus;
  createdAt?: unknown;
}
