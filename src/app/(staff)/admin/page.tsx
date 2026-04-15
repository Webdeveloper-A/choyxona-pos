"use client";

import RoleGuard from "@/components/auth/role-guard";
import AppHeader from "@/components/layout/app-header";
import PageShell from "@/components/layout/page-shell";
import MenuManager from "@/components/admin/menu-manager";
import TableManager from "@/components/admin/table-manager";
import RoomManager from "@/components/admin/room-manager";
import StaffManager from "@/components/admin/staff-manager";

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AppHeader
        title="Admin Panel"
        subtitle="Menyu, stollar va xonalarni boshqarish"
      />

      <PageShell>

       <div className="space-y-6">
        <MenuManager />
        <TableManager />
        <RoomManager />
        <StaffManager />
       </div>
      </PageShell>
    </RoleGuard>
  );
}