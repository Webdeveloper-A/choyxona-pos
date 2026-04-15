"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMenuItems } from "@/lib/services/menu.service";
import {
  adminCreateMenu,
  adminDeleteMenu,
} from "@/lib/services/admin-api.service";
import type { MenuItem } from "@/types/menu";

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getMenuItems();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Menyu yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd() {
    if (!name || !price) {
      toast.error("Nomi va narxini kiriting");
      return;
    }

    setSaving(true);
    try {
      await adminCreateMenu({
        name,
        price: Number(price),
        category,
      });
      setName("");
      setPrice("");
      setCategory("");
      toast.success("Yangi taom qo‘shildi");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Taom qo‘shilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Shu taomni o‘chirmoqchimisiz?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await adminDeleteMenu(id);
      toast.success("Taom o‘chirildi");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Taom o‘chirilmadi");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Menyu boshqaruvi</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Taom nomi"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Narxi"
          type="number"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Kategoriya"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Qo‘shish"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-gray-500">Yuklanmoqda...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">Hali menyu yo‘q</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>

              <div className="flex items-center gap-3">
                <p className="font-bold text-gray-900">{item.price} so‘m</p>
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