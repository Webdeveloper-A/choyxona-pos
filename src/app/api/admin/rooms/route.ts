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
    const capacity = Number(body.capacity || 4);

    if (!name || !Number.isFinite(capacity) || capacity <= 0) {
      return NextResponse.json(
        { error: "Xona nomi va capacity to‘g‘ri bo‘lishi kerak" },
        { status: 400 }
      );
    }

    const ref = await getAdminDb().collection("rooms").add({
      name,
      capacity,
      status: "bo'sh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdDoc = await ref.get();

    await writeAuditLog({
      entityType: "room",
      entityId: ref.id,
      action: "create",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      after: createdDoc.data() || null,
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error: unknown) {
    console.error("ADMIN ROOM CREATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Room create xatosi") },
      { status: 500 }
    );
  }
}
