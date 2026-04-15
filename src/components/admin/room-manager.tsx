"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRooms } from "@/lib/services/rooms.service";
import {
  adminCreateRoom,
  adminDeleteRoom,
} from "@/lib/services/admin-api.service";
import type { RoomItem } from "@/types/room";

export default function RoomManager() {
  const [items, setItems] = useState<RoomItem[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getRooms();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Xonalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd() {
    if (!name) {
      toast.error("Xona nomini kiriting");
      return;
    }

    setSaving(true);
    try {
      await adminCreateRoom({
        name,
        capacity: Number(capacity) || 4,
      });
      setName("");
      setCapacity("");
      toast.success("Yangi xona qo‘shildi");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Xona qo‘shilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Shu xonani o‘chirmoqchimisiz?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await adminDeleteRoom(id);
      toast.success("Xona o‘chirildi");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Xona o‘chirilmadi");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Xonalar boshqaruvi</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: VIP xona"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <input
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Sig‘imi"
          type="number"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Qo‘shish"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-gray-500">Yuklanmoqda...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">Hali xona yo‘q</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.capacity || 0} kishi
                </p>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-700">{item.status}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId === item.id ? "O‘chirilmoqda..." : "O‘chirish"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}