import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getErrorMessage } from "@/lib/utils/error";
import { ROLES } from "@/lib/constants/roles";
import { PLACE_STATUS, isPlaceOccupied } from "@/lib/constants/place-status";
import type { CreateOrderInputItem, OrderItem, OrderPlaceType } from "@/types/order";

type CreateOrderBody = {
  placeType: OrderPlaceType;
  placeId: string;
  placeName: string;
  items: CreateOrderInputItem[];
  note?: string;
};

function isValidPlaceType(value: unknown): value is OrderPlaceType {
  return value === "table" || value === "room";
}

function isAllowedOrderCreator(role: unknown) {
  return (
    role === ROLES.ADMIN ||
    role === ROLES.WAITER ||
    role === ROLES.CUSTOMER
  );
}

function getPlaceCollection(placeType: OrderPlaceType) {
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
    const uid = decoded.uid;

    const userDoc = await getAdminDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 403 }
      );
    }

    const userData = userDoc.data();
    const role = userData?.role;

    if (!isAllowedOrderCreator(role)) {
      return NextResponse.json(
        { error: "Faqat admin, ofitsiant yoki customer buyurtma yaratishi mumkin" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as CreateOrderBody;

    if (
      !body ||
      !isValidPlaceType(body.placeType) ||
      typeof body.placeId !== "string" ||
      !body.placeId.trim() ||
      typeof body.placeName !== "string" ||
      !body.placeName.trim() ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Buyurtma ma’lumotlari noto‘g‘ri" },
        { status: 400 }
      );
    }

    const builtItems: OrderItem[] = [];

    for (const item of body.items) {
      if (
        !item ||
        typeof item.menuItemId !== "string" ||
        !item.menuItemId.trim() ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          { error: "Buyurtma itemlari noto‘g‘ri" },
          { status: 400 }
        );
      }

      const menuDoc = await getAdminDb().collection("menu").doc(item.menuItemId).get();

      if (!menuDoc.exists) {
        return NextResponse.json(
          { error: `Menu item topilmadi: ${item.menuItemId}` },
          { status: 400 }
        );
      }

      const menuData = menuDoc.data();

      if (
        !menuData ||
        typeof menuData.name !== "string" ||
        typeof menuData.price !== "number"
      ) {
        return NextResponse.json(
          { error: `Menu item ma’lumoti noto‘g‘ri: ${item.menuItemId}` },
          { status: 400 }
        );
      }

      builtItems.push({
        menuItemId: menuDoc.id,
        name: menuData.name,
        price: menuData.price,
        quantity: item.quantity,
        total: menuData.price * item.quantity,
      });
    }

    const totalAmount = builtItems.reduce((sum, item) => sum + item.total, 0);
    const db = getAdminDb();
    const placeCollection = getPlaceCollection(body.placeType);
    const placeRef = db.collection(placeCollection).doc(body.placeId);
    const orderRef = db.collection("orders").doc();

    await db.runTransaction(async (transaction) => {
      const placeSnap = await transaction.get(placeRef);

      if (!placeSnap.exists) {
        throw new Error(
          body.placeType === "table" ? "Tanlangan stol topilmadi" : "Tanlangan xona topilmadi"
        );
      }

      const placeData = placeSnap.data();
      const actualPlaceName = typeof placeData?.name === "string" ? placeData.name : body.placeName;

      if (isPlaceOccupied(placeData?.status)) {
        throw new Error(
          `${body.placeType === "table" ? "Stol" : "Xona"} hozir band`
        );
      }

      transaction.set(orderRef, {
        placeType: body.placeType,
        placeId: body.placeId,
        placeName: actualPlaceName,
        items: builtItems,
        totalAmount,
        status: "new",
        note: typeof body.note === "string" ? body.note.trim() : "",
        createdByUid: uid,
        createdByEmail: userData?.email || decoded.email || "",
        isServed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      transaction.update(placeRef, {
        status: PLACE_STATUS.OCCUPIED,
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      totalAmount,
    });
  } catch (error: unknown) {
    console.error("SERVER CREATE ORDER ERROR:", error);

    const message = getErrorMessage(error, "Buyurtma yaratishda server xatosi");
    const status =
      message.includes("hozir band") ? 409 :
      (message.includes("topilmadi") ? 400 : 500);

    return NextResponse.json(
      {
        error: message,
        details: getErrorMessage(error, "unknown"),
      },
      { status }
    );
  }
}
