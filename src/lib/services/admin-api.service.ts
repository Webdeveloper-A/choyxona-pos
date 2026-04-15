import { auth } from "@/lib/firebase/client";

async function getAuthHeaders() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Foydalanuvchi topilmadi");
  }

  const token = await user.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(res: Response) {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.details || "Server xatosi");
  }

  return data;
}

export async function adminCreateMenu(payload: {
  name: string;
  price: number;
  category?: string;
}) {
  const res = await fetch("/api/admin/menu", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function adminDeleteMenu(id: string) {
  const res = await fetch(`/api/admin/menu/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  return parseResponse(res);
}

export async function adminCreateTable(payload: {
  name: string;
  seats?: number;
}) {
  const res = await fetch("/api/admin/tables", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function adminDeleteTable(id: string) {
  const res = await fetch(`/api/admin/tables/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  return parseResponse(res);
}

export async function adminCreateRoom(payload: {
  name: string;
  capacity?: number;
}) {
  const res = await fetch("/api/admin/rooms", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function adminDeleteRoom(id: string) {
  const res = await fetch(`/api/admin/rooms/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  return parseResponse(res);
}