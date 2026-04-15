"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase/client";
import { getErrorCode } from "@/lib/utils/error";

export default function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error("Barcha maydonlarni to‘ldiring");
      return;
    }

    if (password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo‘lsin");
      return;
    }

    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName.trim(),
        role: "customer",
        createdAt: serverTimestamp(),
      });

      toast.success("Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi");
      router.push("/customer");
    } catch (error: unknown) {
      console.error("REGISTER ERROR:", error);

      const errorCode = getErrorCode(error);

      if (errorCode === "auth/email-already-in-use") {
        toast.error("Bu email allaqachon ro‘yxatdan o‘tgan");
      } else if (errorCode === "auth/invalid-email") {
        toast.error("Email formati noto‘g‘ri");
      } else if (errorCode === "auth/weak-password") {
        toast.error("Parol juda oson");
      } else if (errorCode === "permission-denied" || errorCode === "firestore/permission-denied") {
        toast.error("Firestore ruxsatlari ro‘yxatdan o‘tishga to‘sqinlik qilyapti");
      } else if (errorCode === "auth/network-request-failed") {
        toast.error("Tarmoq xatosi. Internetni tekshiring");
      } else {
        toast.error("Ro‘yxatdan o‘tishda xato yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          To‘liq ism
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500"
          placeholder="Ism Familya"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500"
          placeholder="example@gmail.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Parol
        </label>

        <div className="flex gap-2">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-500"
            placeholder="Kamida 6 ta belgi"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            {showPwd ? "Yashirish" : "Ko‘rish"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-yellow-500 py-3 font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
      >
        {loading ? "Ro‘yxatdan o‘tilmoqda..." : "Ro‘yxatdan o‘tish"}
      </button>
    </form>
  );
}