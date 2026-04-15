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

    const ref = getAdminDb().collection("menu").doc(id);
    const beforeSnap = await ref.get();

    if (!beforeSnap.exists) {
      return NextResponse.json({ error: "Menu topilmadi" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.category === "string") updates.category = body.category.trim();
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: "Narx noto‘g‘ri" },
          { status: 400 }
        );
      }
      updates.price = price;
    }
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    await ref.update(updates);
    const afterSnap = await ref.get();

    await writeAuditLog({
      entityType: "menu",
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
    console.error("ADMIN MENU UPDATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Menu update xatosi") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireAdmin(req);
    const { id } = await params;

    const ref = getAdminDb().collection("menu").doc(id);
    const beforeSnap = await ref.get();

    if (!beforeSnap.exists) {
      return NextResponse.json({ error: "Menu topilmadi" }, { status: 404 });
    }

    await ref.delete();

    await writeAuditLog({
      entityType: "menu",
      entityId: id,
      action: "delete",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      before: beforeSnap.data() || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("ADMIN MENU DELETE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Menu delete xatosi") },
      { status: 500 }
    );
  }
}
