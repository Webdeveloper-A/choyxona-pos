import { auth } from "@/lib/firebase/client";

export async function updateOrderStatusSecure(orderId: string, status: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Foydalanuvchi topilmadi");
  }

  const token = await user.getIdToken();

  const res = await fetch("/api/orders/update-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      status,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || data?.details || "Status yangilanmadi");
  }

  return data;
}

export async function markOrderServedSecure(orderId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Foydalanuvchi topilmadi");
  }

  const token = await user.getIdToken();

  const res = await fetch("/api/orders/mark-served", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || data?.details || "Order qabul qilinmadi");
  }

  return data;
}