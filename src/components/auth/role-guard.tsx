"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getRedirectPathByRole } from "@/lib/utils/redirect-by-role";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function RoleGuard({
  children,
  allowedRoles,
}: RoleGuardProps) {
  const router = useRouter();
  const { loading, isAuthenticated, userDoc } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const currentRole =
      typeof userDoc?.role === "string"
        ? userDoc.role.trim().toLowerCase()
        : "";

    const normalizedAllowedRoles = allowedRoles.map((r) =>
      r.trim().toLowerCase()
    );

    if (!normalizedAllowedRoles.includes(currentRole)) {
      router.replace(getRedirectPathByRole(currentRole || "customer"));
    }
  }, [loading, isAuthenticated, userDoc, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-600">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentRole =
    typeof userDoc?.role === "string"
      ? userDoc.role.trim().toLowerCase()
      : "";

  const normalizedAllowedRoles = allowedRoles.map((r) =>
    r.trim().toLowerCase()
  );

  if (!normalizedAllowedRoles.includes(currentRole)) return null;

  return <>{children}</>;
}