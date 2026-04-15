"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { toast } from "sonner";
import RoleGuard from "@/components/auth/role-guard";
import AppHeader from "@/components/layout/app-header";
import PageShell from "@/components/layout/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants/collections";
import { getMenuItems } from "@/lib/services/menu.service";
import { getRooms } from "@/lib/services/rooms.service";
import { getTables } from "@/lib/services/tables.service";
import { parseApiResponse, getApiErrorMessage } from "@/lib/utils/http";
import { isPlaceOccupied } from "@/lib/constants/place-status";
import type { MenuItem } from "@/types/menu";
import type { RoomItem } from "@/types/room";
import type { TableItem } from "@/types/table";
import type { Order, OrderItem } from "@/types/order";

type SelectedPlace =
  | {
      id: string;
      name: string;
      type: "table" | "room";
    }
  | null;

function formatMoney(value: number) {
  return `${value.toLocaleString("uz-UZ")} so‘m`;
}

function getStatusLabel(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "new":
      return "Yangi";
    case "preparing":
      return "Tayyorlanmoqda";
    case "ready":
      return "Tayyor";
    case "paid":
      return "To‘langan";
    case "cancelled":
      return "Bekor qilingan";
    default:
      return status || "Noma’lum";
  }
}

function getStatusClass(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "new":
      return "bg-blue-100 text-blue-700";
    case "preparing":
      return "bg-yellow-100 text-yellow-700";
    case "ready":
      return "bg-green-100 text-green-700";
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPlaceStatusBadge(status?: string) {
  if (isPlaceOccupied(status)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-green-100 text-green-700";
}

function getPlaceStatusLabel(status?: string) {
  if (isPlaceOccupied(status)) {
    return "Band";
  }

  return "Bo‘sh";
}

function getTimestampSeconds(value: unknown) {
  if (!value || typeof value !== "object") return 0;

  const record = value as Record<string, unknown>;
  const seconds = record.seconds;

  return typeof seconds === "number" ? seconds : 0;
}

export default function CustomerPage() {
  const { firebaseUser, userDoc } = useAuth();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.total, 0),
    [cart]
  );

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
      setMenu(menuData.filter((item) => item.isActive !== false));
    } catch (error) {
      console.error("CUSTOMER LOAD ERROR:", error);
      toast.error("Customer sahifasi ma’lumotlari yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("createdByUid", "==", firebaseUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const ownOrders: Order[] = snap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Order, "id">),
          }))
          .sort(
            (a, b) =>
              getTimestampSeconds(b.createdAt) - getTimestampSeconds(a.createdAt)
          );

        setOrders(ownOrders);
      },
      (error) => {
        console.error("CUSTOMER ORDERS SUBSCRIBE ERROR:", error);
        toast.error("Buyurtmalar tarixini yuklashda xato");
      }
    );

    return () => unsub();
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

    if (!user) {
      toast.error("Foydalanuvchi topilmadi");
      return;
    }

    setSaving(true);

    try {
      const token = await user.getIdToken();

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          placeType: selectedPlace.type,
          placeId: selectedPlace.id,
          placeName: selectedPlace.name,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
          note,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        toast.error(getApiErrorMessage(data, "Buyurtma yuborilmadi"));
        await loadData();
        return;
      }

      const createdTotal =
        typeof data.totalAmount === "number" ? data.totalAmount : totalAmount;

      toast.success(`Buyurtma yuborildi. Jami: ${formatMoney(createdTotal)}`);
      setCart([]);
      setNote("");
      setSelectedPlace(null);
      await loadData();
    } catch (error) {
      console.error("CUSTOMER CREATE ORDER ERROR:", error);
      toast.error("Buyurtma yaratishda xato yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGuard allowedRoles={["customer", "admin"]}>
      <AppHeader
        title="Customer Panel"
        subtitle="Taom tanlash, buyurtma berish va buyurtmalar tarixini ko‘rish"
      />

      <PageShell>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">Yuklanmoqda...</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">
                  Qayerga buyurtma berasiz?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Faqat bo‘sh stol yoki xonani tanlash mumkin.
                </p>

                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-700">Stollar</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {tables.length === 0 ? (
                      <p className="text-sm text-gray-500">Stollar topilmadi</p>
                    ) : (
                      tables.map((table) => {
                        const active =
                          selectedPlace?.type === "table" &&
                          selectedPlace.id === table.id;
                        const occupied = isPlaceOccupied(table.status);

                        return (
                          <button
                            key={table.id}
                            type="button"
                            disabled={occupied}
                            onClick={() =>
                              setSelectedPlace({
                                id: table.id,
                                name: table.name,
                                type: "table",
                              })
                            }
                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                              active
                                ? "border-teal-600 bg-teal-600 text-white"
                                : occupied
                                  ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500 opacity-80"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-teal-400"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{table.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${getPlaceStatusBadge(
                                  table.status
                                )}`}
                              >
                                {getPlaceStatusLabel(table.status)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700">Xonalar</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {rooms.length === 0 ? (
                      <p className="text-sm text-gray-500">Xonalar topilmadi</p>
                    ) : (
                      rooms.map((room) => {
                        const active =
                          selectedPlace?.type === "room" &&
                          selectedPlace.id === room.id;
                        const occupied = isPlaceOccupied(room.status);

                        return (
                          <button
                            key={room.id}
                            type="button"
                            disabled={occupied}
                            onClick={() =>
                              setSelectedPlace({
                                id: room.id,
                                name: room.name,
                                type: "room",
                              })
                            }
                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                              active
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : occupied
                                  ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500 opacity-80"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-400"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{room.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${getPlaceStatusBadge(
                                  room.status
                                )}`}
                              >
                                {getPlaceStatusLabel(room.status)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {selectedPlace ? (
                  <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                    Tanlangan joy: <span className="font-semibold">{selectedPlace.name}</span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Taom ustiga bossangiz savatga qo‘shiladi.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {menu.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Menu bo‘sh. Admin paneldan taom qo‘shing.
                    </p>
                  ) : (
                    menu.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToCart(item)}
                        className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-500 hover:shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.category || "Asosiy"}
                            </p>
                          </div>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {formatMoney(item.price)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">
                  Buyurtmalar tarixi
                </h2>

                <div className="mt-4 space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Hozircha buyurtmalar yo‘q.
                    </p>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-gray-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {order.placeName}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {order.items.map((item) => item.name).join(", ")}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatMoney(order.totalAmount)}
                            </p>
                          </div>
                        </div>

                        {order.note ? (
                          <p className="mt-3 text-sm text-gray-600">
                            Izoh: {order.note}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">
                  Mening profilim
                </h2>

                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Ism:</span>{" "}
                    {userDoc?.fullName || "Kiritilmagan"}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {userDoc?.email || firebaseUser?.email || "Kiritilmagan"}
                  </div>
                  <div>
                    <span className="font-medium">Rol:</span>{" "}
                    {userDoc?.role || "customer"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Savat</h2>

                {cart.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Savat hozircha bo‘sh.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="rounded-xl border border-gray-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.quantity} x {formatMoney(item.price)}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-gray-900">
                            {formatMoney(item.total)}
                          </p>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => decreaseItem(item.menuItemId)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              addToCart({
                                id: item.menuItemId,
                                name: item.name,
                                price: item.price,
                              })
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.menuItemId)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                          >
                            Olib tashlash
                          </button>
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Izoh
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-teal-500"
                        placeholder="Masalan: achchiq kamroq bo‘lsin"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <span className="font-medium text-gray-700">Jami</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatMoney(totalAmount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateOrder}
                      disabled={saving || !selectedPlace}
                      className="w-full rounded-xl bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                    >
                      {saving ? "Yuborilmoqda..." : "Buyurtma berish"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </RoleGuard>
  );
}
