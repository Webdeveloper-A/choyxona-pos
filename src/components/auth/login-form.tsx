"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase/client";
import { getErrorCode } from "@/lib/utils/error";
import { getRedirectPathByRole } from "@/lib/utils/redirect-by-role";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email va parolni kiriting");
      return;
    }

    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let role = "customer";

      if (userSnap.exists()) {
        const data = userSnap.data();
        role =
          typeof data.role === "string"
            ? data.role.trim().toLowerCase()
            : "customer";
      }

      const redirectPath = getRedirectPathByRole(role);

      toast.success("Muvaffaqiyatli kirildi");
      router.push(redirectPath);
    } catch (error: unknown) {
      console.error("LOGIN ERROR:", error);

      const errorCode = getErrorCode(error);
      if (errorCode === "auth/invalid-credential") {
        toast.error("Email yoki parol noto‘g‘ri");
      } else if (errorCode === "auth/invalid-email") {
        toast.error("Email formati noto‘g‘ri");
      } else {
        toast.error("Kirishda xato yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-teal-500"
          placeholder="test@choyxona.uz"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-teal-500"
            placeholder="••••••••"
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
        className="w-full rounded-lg bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {loading ? "Kirilmoqda..." : "Kirish"}
      </button>
    </form>
  );
}