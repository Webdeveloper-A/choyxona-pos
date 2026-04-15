"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTables } from "@/lib/services/tables.service";
import {
  adminCreateTable,
  adminDeleteTable,
} from "@/lib/services/admin-api.service";
import type { TableItem } from "@/types/table";

export default function TableManager() {
  const [items, setItems] = useState<TableItem[]>([]);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getTables();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Stollar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd() {
    if (!name) {
      toast.error("Stol nomini kiriting");
      return;
    }

    setSaving(true);
    try {
      await adminCreateTable({
        name,
        seats: Number(seats) || 4,
      });
      setName("");
      setSeats("");
      toast.success("Yangi stol qo‘shildi");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Stol qo‘shilmadi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Shu stolni o‘chirmoqchimisiz?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await adminDeleteTable(id);
      toast.success("Stol o‘chirildi");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Stol o‘chirilmadi");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Stollar boshqaruvi</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Stol 1"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <input
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          placeholder="O‘rinlar soni"
          type="number"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Qo‘shish"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-gray-500">Yuklanmoqda...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">Hali stol yo‘q</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.seats || 0} o‘rin
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