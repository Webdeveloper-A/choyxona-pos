"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { getErrorMessage } from "@/lib/utils/error";
import { getApiErrorMessage, parseApiResponse } from "@/lib/utils/http";

export default function StaffManager() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ofitsiant");
  const [saving, setSaving] = useState(false);

  async function handleCreateStaff() {
    if (!fullName || !email || !password || !role) {
      toast.error("Barcha maydonlarni to‘ldiring");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      toast.error("Avval tizimga kiring");
      return;
    }

    setSaving(true);

    try {
      // 🔐 TOKEN OLAMIZ
      const token = await user.getIdToken();

      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        toast.error(getApiErrorMessage(data, "Xodim yaratilmadi"));
        return;
      }

      // ✅ SUCCESS
      toast.success("Yangi xodim yaratildi");

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("ofitsiant");
    } catch (error) {
      console.error("CREATE STAFF FRONT ERROR:", error);
      toast.error(getErrorMessage(error, "Server bilan bog‘lanishda xato"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">
        Yangi xodim qo‘shish
      </h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="To‘liq ism"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parol"
          type="password"
          className="rounded-xl border border-gray-300 px-4 py-3"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-3"
        >
          <option value="ofitsiant">Ofitsiant</option>
          <option value="oshxona">Oshxona</option>
          <option value="kassa">Kassa</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleCreateStaff}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60 md:col-span-2"
        >
          {saving ? "Yaratilmoqda..." : "Xodim yaratish"}
        </button>
      </div>
    </div>
  );
}