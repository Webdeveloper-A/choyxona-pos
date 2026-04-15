export type OrderPlaceType = "table" | "room";

export type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "paid"
  | "cancelled";

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  placeType: OrderPlaceType;
  placeId: string;
  placeName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  note?: string;
  createdByUid: string;
  createdByEmail?: string;
  isServed?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreateOrderInputItem {
  menuItemId: string;
  quantity: number;
}