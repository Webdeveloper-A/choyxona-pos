"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut(auth);
      toast.success("Tizimdan chiqildi");
      router.replace("/login");
    } catch (error) {
      console.error(error);
      toast.error("Chiqishda xato yuz berdi");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
    >
      Chiqish
    </button>
  );
}