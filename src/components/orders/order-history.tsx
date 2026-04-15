"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { toast } from "sonner";
import {
  getOrdersPage,
  type OrderHistoryFilters,
} from "@/lib/services/orders.service";
import { updateOrderStatusSecure } from "@/lib/services/order-actions.service";
import { formatDateTime } from "@/lib/utils/date";
import type { Order } from "@/types/order";
import { getErrorMessage } from "@/lib/utils/error";

type StatusFilter = "all" | "new" | "preparing" | "ready" | "paid" | "cancelled";
type PlaceFilter = "all" | "table" | "room";

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pageSize = 10;

  const loadOrders = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filters: OrderHistoryFilters = {
        status: statusFilter,
        placeType: placeFilter,
        pageSize,
        cursor: reset ? null : lastVisible,
      };

      const result = await getOrdersPage(filters);

      setOrders((prev) => (reset ? result.orders : [...prev, ...result.orders]));
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error(error);
      toast.error("Order history yuklanmadi");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, placeFilter, lastVisible, pageSize]);

  useEffect(() => {
    setLastVisible(null);
    loadOrders(true);
  }, [statusFilter, placeFilter, loadOrders]);

  const filteredOrders = useMemo(() => {
    const queryText = search.trim().toLowerCase();

    if (!queryText) return orders;

    return orders.filter((order) => {
      return (
        order.placeName.toLowerCase().includes(queryText) ||
        order.createdByEmail?.toLowerCase().includes(queryText) ||
        order.items.some((item) => item.name.toLowerCase().includes(queryText))
      );
    });
  }, [orders, search]);

async function handleCancel(orderId: string) {
  const confirmed = window.confirm("Buyurtmani cancelled holatiga o‘tkazmoqchimisiz?");
  if (!confirmed) return;

  setUpdatingId(orderId);

  try {
    await updateOrderStatusSecure(orderId, "cancelled");
    toast.success("Buyurtma cancelled bo‘ldi");
    setLastVisible(null);
    await loadOrders(true);
  } catch (error: unknown) {
    console.error(error);
    toast.error(getErrorMessage(error, "Buyurtma holati yangilanmadi"));
  } finally {
    setUpdatingId(null);
  }
}

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Buyurtmalar tarixi</h2>
          <p className="mt-1 text-sm text-gray-500">
            Status va joy turi bo‘yicha filterlangan arxiv
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Joy, taom yoki email bo‘yicha qidirish"
            className="rounded-xl border border-gray-300 px-4 py-3"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="all">Barcha statuslar</option>
            <option value="new">new</option>
            <option value="preparing">preparing</option>
            <option value="ready">ready</option>
            <option value="paid">paid</option>
            <option value="cancelled">cancelled</option>
          </select>

          <select
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value as PlaceFilter)}
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="all">Barcha joylar</option>
            <option value="table">Stollar</option>
            <option value="room">Xonalar</option>
          </select>

          <button
            onClick={() => {
              setLastVisible(null);
              loadOrders(true);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Yangilash
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-gray-500">Buyurtmalar yuklanmoqda...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-500">Mos buyurtmalar topilmadi</p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-gray-200 p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {order.placeType === "table" ? "Stol" : "Xona"} — {order.placeName}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      Status: {order.status}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      Joy turi: {order.placeType}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    Ofitsiant: {order.createdByEmail || "Noma’lum"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Yaratilgan vaqt: {formatDateTime(order.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Yangilangan vaqt: {formatDateTime(order.updatedAt)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-100 px-4 py-3 text-right">
                  <p className="text-sm text-gray-500">Jami summa</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {order.totalAmount} so‘m
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={`${order.id}-${item.menuItemId}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.price} so‘m × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">{item.total} so‘m</p>
                  </div>
                ))}
              </div>

              {order.note ? (
                <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                  <p className="text-sm font-medium text-yellow-800">Izoh</p>
                  <p className="mt-1 text-sm text-yellow-700">{order.note}</p>
                </div>
              ) : null}

              {order.status !== "paid" && order.status !== "cancelled" ? (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={updatingId === order.id}
                    className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {updatingId === order.id ? "Yangilanmoqda..." : "Cancel qilish"}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {!loading && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => loadOrders(false)}
            disabled={loadingMore}
            className="rounded-xl bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {loadingMore ? "Yuklanmoqda..." : "Yana yuklash"}
          </button>
        </div>
      )}
    </div>
  );
}