import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getErrorMessage } from "@/lib/utils/error";
import { PLACE_STATUS } from "@/lib/constants/place-status";

type AllowedStatus = "new" | "preparing" | "ready" | "paid" | "cancelled";

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return (
    value === "new" ||
    value === "preparing" ||
    value === "ready" ||
    value === "paid" ||
    value === "cancelled"
  );
}

function canTransition(role: string, currentStatus: string, nextStatus: string, createdByUid: string, actorUid: string) {
  if (role === "admin") return true;

  if (role === "oshxona") {
    return (
      (currentStatus === "new" && nextStatus === "preparing") ||
      (currentStatus === "preparing" && nextStatus === "ready")
    );
  }

  if (role === "kassa") {
    return currentStatus === "ready" && nextStatus === "paid";
  }

  if (role === "ofitsiant") {
    return (
      createdByUid === actorUid &&
      currentStatus === "new" &&
      nextStatus === "cancelled"
    );
  }

  return false;
}

function getPlaceCollection(placeType: unknown) {
  return placeType === "table" ? "tables" : "rooms";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized (no token)" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const actorUid = decoded.uid;

    const actorDoc = await getAdminDb().collection("users").doc(actorUid).get();

    if (!actorDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 403 }
      );
    }

    const actorData = actorDoc.data();
    const actorRole = actorData?.role;
    const actorEmail = actorData?.email || decoded.email || "";

    const body = await req.json();
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const nextStatus = body.status;

    if (!orderId || !isAllowedStatus(nextStatus)) {
      return NextResponse.json(
        { error: "Order ID yoki status noto‘g‘ri" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: "Order topilmadi" },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();

    if (!orderData) {
      return NextResponse.json(
        { error: "Order ma’lumoti bo‘sh" },
        { status: 500 }
      );
    }

    const currentStatus = orderData.status;
    const createdByUid = orderData.createdByUid || "";

    if (!canTransition(actorRole, currentStatus, nextStatus, createdByUid, actorUid)) {
      return NextResponse.json(
        { error: "Bu status transition sizga ruxsat etilmagan" },
        { status: 403 }
      );
    }

    const shouldReleasePlace = nextStatus === "paid" || nextStatus === "cancelled";

    await db.runTransaction(async (transaction) => {
      const freshOrderSnap = await transaction.get(orderRef);

      if (!freshOrderSnap.exists) {
        throw new Error("Order topilmadi");
      }

      const freshOrderData = freshOrderSnap.data();

      if (!freshOrderData) {
        throw new Error("Order ma’lumoti bo‘sh");
      }

      transaction.update(orderRef, {
        status: nextStatus,
        updatedAt: new Date(),
        lastUpdatedByUid: actorUid,
        lastUpdatedByEmail: actorEmail,
      });

      if (shouldReleasePlace) {
        const placeRef = db
          .collection(getPlaceCollection(freshOrderData.placeType))
          .doc(freshOrderData.placeId);

        const placeSnap = await transaction.get(placeRef);

        if (placeSnap.exists) {
          transaction.update(placeRef, {
            status: PLACE_STATUS.FREE,
            updatedAt: new Date(),
          });
        }
      }
    });

    await db.collection("audit_logs").add({
      entityType: "order",
      entityId: orderId,
      action: "status_update",
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actorUid,
      actorEmail,
      actorRole,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      orderId,
      fromStatus: currentStatus,
      toStatus: nextStatus,
    });
  } catch (error: unknown) {
    console.error("SERVER UPDATE STATUS ERROR:", error);

    return NextResponse.json(
      {
        error: "Status yangilashda server xatosi",
        details: getErrorMessage(error, "unknown"),
      },
      { status: 500 }
    );
  }
}
