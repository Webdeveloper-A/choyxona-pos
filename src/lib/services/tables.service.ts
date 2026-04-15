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
import type { TableItem } from "@/types/table";

export async function getTables(): Promise<TableItem[]> {
  const q = query(collection(db, COLLECTIONS.TABLES), orderBy("name"));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<TableItem, "id">),
  }));
}

export async function createTable(data: {
  name: string;
  seats?: number;
}) {
  await addDoc(collection(db, COLLECTIONS.TABLES), {
    name: data.name.trim(),
    seats: data.seats || 4,
    status: "bo'sh",
    createdAt: serverTimestamp(),
  });
}

export async function deleteTable(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.TABLES, id));
}