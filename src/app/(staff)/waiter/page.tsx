"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import RoleGuard from "@/components/auth/role-guard";
import AppHeader from "@/components/layout/app-header";
import PageShell from "@/components/layout/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase/client";
import { getMenuItems } from "@/lib/services/menu.service";
import { getRooms } from "@/lib/services/rooms.service";
import { getTables } from "@/lib/services/tables.service";
import { subscribeWaiterReadyOrders } from "@/lib/services/orders.service";
import { markOrderServedSecure } from "@/lib/services/order-actions.service";
import type { MenuItem } from "@/types/menu";
import type { RoomItem } from "@/types/room";
import type { TableItem } from "@/types/table";
import type { Order, OrderItem } from "@/types/order";
import { getErrorMessage } from "@/lib/utils/error";
import { parseApiResponse, getApiErrorMessage } from "@/lib/utils/http";
import { isPlaceOccupied } from "@/lib/constants/place-status";

type SelectedPlace =
  | {
      id: string;
      name: string;
      type: "table" | "room";
    }
  | null;

export default function WaiterPage() {
  const { firebaseUser } = useAuth();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [note, setNote] = useState("");

  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [servingId, setServingId] = useState<string | null>(null);
  const previousReadyCountRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);

      const [tablesData, roomsData, menuData] = await Promise.all([
        getTables(),
        getRooms(),
        getMenuItems(),
      ]);

      setTables(tablesData);
      setRooms(roomsData);
      setMenu(menuData);
    } catch (error) {
      console.error(error);
      toast.error("Waiter panel ma’lumotlari yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const unsub = subscribeWaiterReadyOrders(
      firebaseUser.uid,
      (data) => {
        if (
          previousReadyCountRef.current > 0 &&
          data.length > previousReadyCountRef.current
        ) {
          toast.success("Yangi tayyor buyurtma bor");
        }

        previousReadyCountRef.current = data.length;
        setReadyOrders(data);
      },
      () => {
        toast.error("Tayyor buyurtmalar xabari yuklanmadi");
      }
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [firebaseUser?.uid]);

  function addToCart(menuItem: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItem.id);

      if (existing) {
        return prev.map((item) =>
          item.menuItemId === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          total: menuItem.price,
        },
      ];
    });
  }

  function decreaseItem(menuItemId: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                quantity: item.quantity - 1,
                total: (item.quantity - 1) * item.price,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(menuItemId: string) {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  }

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.total, 0),
    [cart]
  );

  async function handleCreateOrder() {
    if (!selectedPlace) {
      toast.error("Avval stol yoki xonani tanlang");
      return;
    }

    if (cart.length === 0) {
      toast.error("Kamida bitta taom tanlang");
      return;
    }

    const user = auth.currentUser;

    if (!user || !firebaseUser) {
      toast.error("Foydalanuvchi aniqlanmadi");
      return;
    }

    setSaving(true);

    try {
      const token = await user.getIdToken();

      const payload = {
        placeType: selectedPlace.type,
        placeId: selectedPlace.id,
        placeName: selectedPlace.name,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        note,
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        toast.error(getApiErrorMessage(data, "Buyurtma saqlanmadi"));
        return;
      }

      toast.success(`Buyurtma yaratildi. Jami: ${data.totalAmount} so‘m`);
      setCart([]);
      setNote("");
      setSelectedPlace(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Buyurtma yaratishda xato");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkServed(orderId: string) {
    setServingId(orderId);

    try {
      await markOrderServedSecure(orderId);
      toast.success("Buyurtma ofitsiant tomonidan qabul qilindi");
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, "Order qabul qilinmadi"));
    } finally {
      setServingId(null);
    }
  }

  return (
    <RoleGuard allowedRoles={["ofitsiant", "admin"]}>
      <AppHeader
        title="Ofitsiant Paneli"
        subtitle="Stol/xona tanlash, buyurtma yaratish va tayyor orderlarni qabul qilish"
      />

      <PageShell>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Yuklanmoqda...
          </div>
        ) : (
          <>
            {readyOrders.length > 0 && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-green-900">
                      Tayyor buyurtmalar
                    </h2>
                    <p className="mt-1 text-sm text-green-700">
                      Oshxonadan chiqqan buyurtmalar
                    </p>
                  </div>

                  <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white">
                    {readyOrders.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 rounded-xl border border-green-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.placeType === "table" ? "Stol" : "Xona"} —{" "}
                          {order.placeName}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {order.items
                            .map(
                              (item) => `${item.name} × ${item.quantity}`
                            )
                            .join(", ")}
                        </p>
                      </div>

                      <button
                        onClick={() => handleMarkServed(order.id)}
                        disabled={servingId === order.id}
                        className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {servingId === order.id
                          ? "Qabul qilinmoqda..."
                          : "Qabul qilindi"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">Stollar</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {tables.length === 0 ? (
                      <p className="col-span-full text-gray-500">Stol yo‘q</p>
                    ) : (
                      tables.map((table) => {
                        const active =
                          selectedPlace?.id === table.id &&
                          selectedPlace?.type === "table";
                        const occupied = isPlaceOccupied(table.status);

                        return (
                          <button
                            key={table.id}
                            disabled={occupied}
                            onClick={() =>
                              setSelectedPlace({
                                id: table.id,
                                name: table.name,
                                type: "table",
                              })
                            }
                            className={`rounded-xl border px-4 py-3 text-left ${
                              active
                                ? "border-blue-600 bg-blue-50"
                                : occupied
                                  ? "cursor-not-allowed border-red-200 bg-red-50 opacity-70"
                                  : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900">
                                {table.name}
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-xs ${occupied ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {occupied ? "Band" : "Bo‘sh"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {table.seats || 0} o‘rin
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">Xonalar</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {rooms.length === 0 ? (
                      <p className="col-span-full text-gray-500">Xona yo‘q</p>
                    ) : (
                      rooms.map((room) => {
                        const active =
                          selectedPlace?.id === room.id &&
                          selectedPlace?.type === "room";
                        const occupied = isPlaceOccupied(room.status);

                        return (
                          <button
                            key={room.id}
                            disabled={occupied}
                            onClick={() =>
                              setSelectedPlace({
                                id: room.id,
                                name: room.name,
                                type: "room",
                              })
                            }
                            className={`rounded-xl border px-4 py-3 text-left ${
                              active
                                ? "border-green-600 bg-green-50"
                                : occupied
                                  ? "cursor-not-allowed border-red-200 bg-red-50 opacity-70"
                                  : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900">
                                {room.name}
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-xs ${occupied ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {occupied ? "Band" : "Bo‘sh"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {room.capacity || 0} kishi
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Menyu</h2>
                    <div className="text-sm text-gray-500">
                      Tanlangan joy:{" "}
                      <span className="font-semibold text-gray-900">
                        {selectedPlace
                          ? `${
                              selectedPlace.type === "table" ? "Stol" : "Xona"
                            } — ${selectedPlace.name}`
                          : "Tanlanmagan"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {menu.length === 0 ? (
                      <p className="text-gray-500">Menyu bo‘sh</p>
                    ) : (
                      menu.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
                        >
                          <p className="font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.category}
                          </p>
                          <p className="mt-3 font-bold text-gray-900">
                            {item.price} so‘m
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">Buyurtma</h2>

                  <div className="mt-4 space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-gray-500">Buyurtma hali bo‘sh</p>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.price} so‘m × {item.quantity}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseItem(item.menuItemId)}
                              className="rounded-lg border border-gray-300 px-3 py-1"
                            >
                              -
                            </button>

                            <span className="min-w-8 text-center font-medium">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => {
                                const menuItem = menu.find(
                                  (m) => m.id === item.menuItemId
                                );
                                if (menuItem) addToCart(menuItem);
                              }}
                              className="rounded-lg border border-gray-300 px-3 py-1"
                            >
                              +
                            </button>

                            <button
                              onClick={() => removeItem(item.menuItemId)}
                              className="rounded-lg bg-red-600 px-3 py-1 text-white"
                            >
                              O‘chirish
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Izoh
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Qo‘shimcha izoh..."
                      className="min-h-24 w-full rounded-xl border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Jami summa</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalAmount} so‘m
                      </p>
                    </div>

                    <button
                      onClick={handleCreateOrder}
                      disabled={saving}
                      className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? "Saqlanmoqda..." : "Buyurtmani yuborish"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </PageShell>
    </RoleGuard>
  );
}