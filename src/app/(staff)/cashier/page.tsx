"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import RoleGuard from "@/components/auth/role-guard";
import AppHeader from "@/components/layout/app-header";
import PageShell from "@/components/layout/page-shell";
import { subscribeReadyOrders } from "@/lib/services/orders.service";
import { updateOrderStatusSecure } from "@/lib/services/order-actions.service";
import type { Order } from "@/types/order";
import { getErrorMessage } from "@/lib/utils/error";

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeReadyOrders(
      (data) => {
        setOrders(data);
        setLoading(false);

        if (data.length > 0 && !selectedOrderId) {
          setSelectedOrderId(data[0].id);
        }

        if (data.length === 0) {
          setSelectedOrderId(null);
        }

        if (
          selectedOrderId &&
          !data.some((order) => order.id === selectedOrderId)
        ) {
          setSelectedOrderId(data.length > 0 ? data[0].id : null);
        }
      },
      () => {
        toast.error("Tayyor buyurtmalar yuklanmadi");
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

async function handlePay(orderId: string) {
  const confirmed = window.confirm("Buyurtma to‘langan deb belgilansinmi?");
  if (!confirmed) return;

  setPayingId(orderId);

  try {
    await updateOrderStatusSecure(orderId, "paid");
    toast.success("Buyurtma to‘landi");
  } catch (error: unknown) {
    console.error(error);
    toast.error(getErrorMessage(error, "To‘lov holati yangilanmadi"));
  } finally {
    setPayingId(null);
  }
}

  return (
    <RoleGuard allowedRoles={["kassa", "admin"]}>
      <AppHeader
        title="Kassa Paneli"
        subtitle="Tayyor buyurtmalarni qabul qilish va to‘lovni yakunlash"
      />

      <PageShell>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Tayyor buyurtmalar yuklanmoqda...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Tayyor buyurtmalar
                </h2>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  {orders.length}
                </span>
              </div>

              <div className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-gray-500">Tayyor buyurtma yo‘q</p>
                ) : (
                  orders.map((order) => {
                    const active = order.id === selectedOrderId;

                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                          active
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {order.placeType === "table" ? "Stol" : "Xona"} —{" "}
                              {order.placeName}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {order.items.length} ta pozitsiya
                            </p>
                          </div>

                          <span className="rounded-lg bg-white px-2 py-1 text-sm font-bold text-gray-900 shadow-sm">
                            {order.totalAmount} so‘m
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
              {!selectedOrder ? (
                <div className="text-gray-500">
                  Buyurtma tanlang
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedOrder.placeType === "table" ? "Stol" : "Xona"} —{" "}
                        {selectedOrder.placeName}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Status: {selectedOrder.status}
                      </p>
                      {selectedOrder.createdByEmail ? (
                        <p className="mt-1 text-sm text-gray-500">
                          Ofitsiant: {selectedOrder.createdByEmail}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl bg-gray-100 px-4 py-3 text-right">
                      <p className="text-sm text-gray-500">Jami summa</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedOrder.totalAmount} so‘m
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={`${selectedOrder.id}-${item.menuItemId}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.price} so‘m × {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold text-gray-900">
                          {item.total} so‘m
                        </p>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.note ? (
                    <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                      <p className="text-sm font-medium text-yellow-800">Izoh</p>
                      <p className="mt-1 text-sm text-yellow-700">
                        {selectedOrder.note}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handlePay(selectedOrder.id)}
                      disabled={payingId === selectedOrder.id}
                      className="rounded-xl bg-purple-700 px-6 py-3 font-medium text-white hover:bg-purple-800 disabled:opacity-60"
                    >
                      {payingId === selectedOrder.id
                        ? "To‘lanmoqda..."
                        : "To‘landi deb belgilash"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </PageShell>
    </RoleGuard>
  );
}