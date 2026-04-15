import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants/collections";
import type { MenuItem } from "@/types/menu";

export async function getMenuItems(): Promise<MenuItem[]> {
  const q = query(collection(db, COLLECTIONS.MENU), orderBy("name"));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<MenuItem, "id">),
  }));
}

export async function createMenuItem(data: {
  name: string;
  price: number;
  category?: string;
}) {
  await addDoc(collection(db, COLLECTIONS.MENU), {
    name: data.name.trim(),
    price: data.price,
    category: data.category?.trim() || "Asosiy",
    isActive: true,
    createdAt: serverTimestamp(),
  });
}

export async function deleteMenuItem(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.MENU, id));
}