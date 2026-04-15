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
    const seats = Number(body.seats || 4);

    if (!name || !Number.isFinite(seats) || seats <= 0) {
      return NextResponse.json(
        { error: "Stol nomi va seats to‘g‘ri bo‘lishi kerak" },
        { status: 400 }
      );
    }

    const ref = await getAdminDb().collection("tables").add({
      name,
      seats,
      status: "bo'sh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdDoc = await ref.get();

    await writeAuditLog({
      entityType: "table",
      entityId: ref.id,
      action: "create",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      after: createdDoc.data() || null,
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error: unknown) {
    console.error("ADMIN TABLE CREATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Table create xatosi") },
      { status: 500 }
    );
  }
}
