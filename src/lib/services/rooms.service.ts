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
import type { RoomItem } from "@/types/room";

export async function getRooms(): Promise<RoomItem[]> {
  const q = query(collection(db, COLLECTIONS.ROOMS), orderBy("name"));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<RoomItem, "id">),
  }));
}

export async function createRoom(data: {
  name: string;
  capacity?: number;
}) {
  await addDoc(collection(db, COLLECTIONS.ROOMS), {
    name: data.name.trim(),
    capacity: data.capacity || 4,
    status: "bo'sh",
    createdAt: serverTimestamp(),
  });
}

export async function deleteRoom(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.ROOMS, id));
}