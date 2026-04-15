export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  isActive?: boolean;
  createdAt?: unknown;
}