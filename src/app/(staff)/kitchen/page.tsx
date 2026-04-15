"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import RoleGuard from "@/components/auth/role-guard";
import AppHeader from "@/components/layout/app-header";
import PageShell from "@/components/layout/page-shell";
import { subscribeKitchenOrders } from "@/lib/services/orders.service";
import { updateOrderStatusSecure } from "@/lib/services/order-actions.service";
import type { Order } from "@/types/order";
import { getErrorMessage } from "@/lib/utils/error";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeKitchenOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      () => {
        toast.error("Oshxona buyurtmalari yuklanmadi");
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const newOrders = useMemo(
    () => orders.filter((order) => order.status === "new"),
    [orders]
  );

  const preparingOrders = useMemo(
    () => orders.filter((order) => order.status === "preparing"),
    [orders]
  );

async function handleStart(orderId: string) {
  setUpdatingId(orderId);
  try {
    await updateOrderStatusSecure(orderId, "preparing");
    toast.success("Buyurtma tayyorlanmoqda holatiga o‘tdi");
  } catch (error: unknown) {
    console.error(error);
    toast.error(getErrorMessage(error, "Status yangilanmadi"));
  } finally {
    setUpdatingId(null);
  }
}

async function handleReady(orderId: string) {
  setUpdatingId(orderId);
  try {
    await updateOrderStatusSecure(orderId, "ready");
    toast.success("Buyurtma tayyor holatiga o‘tdi");
  } catch (error: unknown) {
    console.error(error);
    toast.error(getErrorMessage(error, "Status yangilanmadi"));
  } finally {
    setUpdatingId(null);
  }
}

  return (
    <RoleGuard allowedRoles={["oshxona", "admin"]}>
      <AppHeader
        title="Oshxona Paneli"
        subtitle="Yangi buyurtmalar va tayyorlash jarayoni"
      />

      <PageShell>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Buyurtmalar yuklanmoqda...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Yangi buyurtmalar
                </h2>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                  {newOrders.length}
                </span>
              </div>

              <div className="space-y-4">
                {newOrders.length === 0 ? (
                  <p className="text-gray-500">Yangi buyurtma yo‘q</p>
                ) : (
                  newOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      actionLabel={
                        updatingId === order.id
                          ? "Yangilanmoqda..."
                          : "Tayyorlashni boshlash"
                      }
                      actionColor="bg-orange-600 hover:bg-orange-700"
                      disabled={updatingId === order.id}
                      onAction={() => handleStart(order.id)}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Tayyorlanayotganlar
                </h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="space-y-4">
                {preparingOrders.length === 0 ? (
                  <p className="text-gray-500">Tayyorlanayotgan buyurtma yo‘q</p>
                ) : (
                  preparingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      actionLabel={
                        updatingId === order.id
                          ? "Yangilanmoqda..."
                          : "Tayyor deb belgilash"
                      }
                      actionColor="bg-green-600 hover:bg-green-700"
                      disabled={updatingId === order.id}
                      onAction={() => handleReady(order.id)}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </PageShell>
    </RoleGuard>
  );
}

function OrderCard({
  order,
  actionLabel,
  actionColor,
  disabled,
  onAction,
}: {
  order: Order;
  actionLabel: string;
  actionColor: string;
  disabled: boolean;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {order.placeType === "table" ? "Stol" : "Xona"} — {order.placeName}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Status: <span className="font-medium">{order.status}</span>
          </p>
          {order.createdByEmail ? (
            <p className="mt-1 text-sm text-gray-500">
              Ofitsiant: {order.createdByEmail}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900">
          {order.totalAmount} so‘m
        </div>
      </div>

      <div className="mt-4 space-y-2">
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

      <div className="mt-5">
        <button
          onClick={onAction}
          disabled={disabled}
          className={`w-full rounded-xl px-4 py-3 font-medium text-white disabled:opacity-60 ${actionColor}`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}