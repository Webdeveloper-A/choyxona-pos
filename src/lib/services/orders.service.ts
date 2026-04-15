import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants/collections";
import type { Order, OrderStatus } from "@/types/order";

export function subscribeKitchenOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where("status", "in", ["new", "preparing"]),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders: Order[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, "id">),
      }));

      callback(orders);
    },
    (error) => {
      console.error("KITCHEN ORDERS SUBSCRIBE ERROR:", error);
      onError?.(error);
    }
  );
}

export function subscribeReadyOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where("status", "==", "ready"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders: Order[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, "id">),
      }));

      callback(orders);
    },
    (error) => {
      console.error("READY ORDERS SUBSCRIBE ERROR:", error);
      onError?.(error);
    }
  );
}

export function subscribeWaiterReadyOrders(
  waiterUid: string,
  callback: (orders: Order[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where("createdByUid", "==", waiterUid),
    where("status", "==", "ready"),
    where("isServed", "==", false),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders: Order[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, "id">),
      }));

      callback(orders);
    },
    (error) => {
      console.error("WAITER READY ORDERS SUBSCRIBE ERROR:", error);
      onError?.(error);
    }
  );
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
) {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export type OrderHistoryFilters = {
  status?: "all" | "new" | "preparing" | "ready" | "paid" | "cancelled";
  placeType?: "all" | "table" | "room";
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
};

export async function getOrdersPage(filters: OrderHistoryFilters = {}) {
  const constraints: QueryConstraint[] = [];

  if (filters.status && filters.status !== "all") {
    constraints.push(where("status", "==", filters.status));
  }

  if (filters.placeType && filters.placeType !== "all") {
    constraints.push(where("placeType", "==", filters.placeType));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(filters.pageSize || 10));

  if (filters.cursor) {
    constraints.push(startAfter(filters.cursor));
  }

  const q = query(collection(db, COLLECTIONS.ORDERS), ...constraints);
  const snap = await getDocs(q);

  const orders: Order[] = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Order, "id">),
  }));

  return {
    orders,
    lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === (filters.pageSize || 10),
  };
}