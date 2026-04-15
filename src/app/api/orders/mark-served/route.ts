import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getErrorMessage } from "@/lib/utils/error";

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

    if (actorRole !== "ofitsiant" && actorRole !== "admin") {
      return NextResponse.json(
        { error: "Faqat admin yoki ofitsiant ruxsatga ega" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID topilmadi" },
        { status: 400 }
      );
    }

    const orderRef = getAdminDb().collection("orders").doc(orderId);
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

    if (actorRole !== "admin" && orderData.createdByUid !== actorUid) {
      return NextResponse.json(
        { error: "Siz faqat o‘zingiz yaratgan orderni qabul qila olasiz" },
        { status: 403 }
      );
    }

    if (orderData.status !== "ready") {
      return NextResponse.json(
        { error: "Faqat ready order qabul qilinadi" },
        { status: 400 }
      );
    }

    await orderRef.update({
      isServed: true,
      updatedAt: new Date(),
      lastUpdatedByUid: actorUid,
      lastUpdatedByEmail: actorData?.email || decoded.email || "",
    });

    await getAdminDb().collection("audit_logs").add({
      entityType: "order",
      entityId: orderId,
      action: "mark_served",
      actorUid,
      actorEmail: actorData?.email || decoded.email || "",
      actorRole,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      orderId,
    });
  } catch (error: unknown) {
    console.error("MARK SERVED ERROR:", error);

    return NextResponse.json(
      {
        error: "Orderni qabul qilishda server xatosi",
        details: getErrorMessage(error, "unknown"),
      },
      { status: 500 }
    );
  }
}