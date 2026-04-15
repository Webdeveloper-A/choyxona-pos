import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants/collections";
import type { Order } from "@/types/order";

export type ReportSummary = {
  totalRevenue: number;
  paidOrdersCount: number;
  averageCheck: number;
  totalItemsSold: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  statusCounts: Array<{
    status: string;
    count: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
};

function toDateSafe(value: unknown): Date | null {
  if (!value) return null;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (value instanceof Date) return value;

  return null;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getPaidOrdersReport(): Promise<{
  paidOrders: Order[];
  summary: ReportSummary;
}> {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where("status", "==", "paid"),
    orderBy("updatedAt", "desc")
  );

  const snap = await getDocs(q);

  const paidOrders: Order[] = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Order, "id">),
  }));

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0
  );

  const paidOrdersCount = paidOrders.length;

  const averageCheck =
    paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

  const totalItemsSold = paidOrders.reduce((sum, order) => {
    const orderItemsCount = (order.items || []).reduce(
      (itemSum, item) => itemSum + (item.quantity || 0),
      0
    );
    return sum + orderItemsCount;
  }, 0);

  const itemMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const order of paidOrders) {
    for (const item of order.items || []) {
      const current = itemMap.get(item.menuItemId) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += item.quantity || 0;
      current.revenue += item.total || 0;

      itemMap.set(item.menuItemId, current);
    }
  }

  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const statusMap = new Map<string, number>();
  for (const order of paidOrders) {
    const status = order.status || "unknown";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }

  const statusCounts = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const dailyMap = new Map<string, { date: string; revenue: number; orders: number }>();

  for (const order of paidOrders) {
    const date =
      toDateSafe(order.updatedAt) ||
      toDateSafe(order.createdAt) ||
      new Date();

    const key = formatDayKey(date);

    const current = dailyMap.get(key) || {
      date: key,
      revenue: 0,
      orders: 0,
    };

    current.revenue += order.totalAmount || 0;
    current.orders += 1;

    dailyMap.set(key, current);
  }

  const dailyRevenue = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    paidOrders,
    summary: {
      totalRevenue,
      paidOrdersCount,
      averageCheck,
      totalItemsSold,
      topItems,
      statusCounts,
      dailyRevenue,
    },
  };
}