"use client";

import Sidebar from "@/components/layout/sidebar";
import { CUSTOMER_NAV_ITEMS } from "@/lib/constants/navigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar title="Foydalanuvchi paneli" items={CUSTOMER_NAV_ITEMS} />
      <div className="flex-1">{children}</div>
    </div>
  );
}