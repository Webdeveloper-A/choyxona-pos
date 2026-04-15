import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getErrorMessage } from "@/lib/utils/error";
import { requireAdmin } from "@/lib/services/require-admin";
import { writeAuditLog } from "@/lib/services/write-audit-log";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const ref = getAdminDb().collection("tables").doc(id);
    const beforeSnap = await ref.get();

    if (!beforeSnap.exists) {
      return NextResponse.json({ error: "Table topilmadi" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.seats !== undefined) {
      const seats = Number(body.seats);
      if (!Number.isFinite(seats) || seats <= 0) {
        return NextResponse.json(
          { error: "Seats noto‘g‘ri" },
          { status: 400 }
        );
      }
      updates.seats = seats;
    }
    if (typeof body.status === "string") updates.status = body.status.trim();

    await ref.update(updates);
    const afterSnap = await ref.get();

    await writeAuditLog({
      entityType: "table",
      entityId: id,
      action: "update",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      before: beforeSnap.data() || null,
      after: afterSnap.data() || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("ADMIN TABLE UPDATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Table update xatosi") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireAdmin(req);
    const { id } = await params;

    const ref = getAdminDb().collection("tables").doc(id);
    const beforeSnap = await ref.get();

    if (!beforeSnap.exists) {
      return NextResponse.json({ error: "Table topilmadi" }, { status: 404 });
    }

    await ref.delete();

    await writeAuditLog({
      entityType: "table",
      entityId: id,
      action: "delete",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      before: beforeSnap.data() || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("ADMIN TABLE DELETE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Table delete xatosi") },
      { status: 500 }
    );
  }
}
