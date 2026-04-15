"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/auth/register-form";
import { useAuth } from "@/hooks/use-auth";
import { getRedirectPathByRole } from "@/lib/utils/redirect-by-role";

export default function RegisterPage() {
  const router = useRouter();
  const { loading, isAuthenticated, userDoc } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      const role =
        typeof userDoc?.role === "string"
          ? userDoc.role.trim().toLowerCase()
          : "customer";

      router.replace(getRedirectPathByRole(role));
    }
  }, [loading, isAuthenticated, userDoc, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-lg font-medium text-gray-600">Yuklanmoqda...</div>
      </main>
    );
  }

  if (isAuthenticated) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-gray-800">
          Ro‘yxatdan o‘tish
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Yangi foydalanuvchi yarating
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}