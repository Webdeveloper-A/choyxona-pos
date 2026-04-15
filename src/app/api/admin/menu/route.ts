import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getErrorMessage } from "@/lib/utils/error";
import { requireAdmin } from "@/lib/services/require-admin";
import { writeAuditLog } from "@/lib/services/write-audit-log";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin(req);
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "Asosiy";
    const price = Number(body.price);

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Nomi va narxi to‘g‘ri bo‘lishi kerak" },
        { status: 400 }
      );
    }

    const ref = await getAdminDb().collection("menu").add({
      name,
      category,
      price,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdDoc = await ref.get();

    await writeAuditLog({
      entityType: "menu",
      entityId: ref.id,
      action: "create",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      after: createdDoc.data() || null,
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error: unknown) {
    console.error("ADMIN MENU CREATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Menu create xatosi") },
      { status: 500 }
    );
  }
}
