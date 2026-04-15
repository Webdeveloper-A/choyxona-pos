import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/services/require-admin";
import { ROLES } from "@/lib/constants/roles";
import { getErrorCode, getErrorMessage } from "@/lib/utils/error";

type StaffRole =
  | typeof ROLES.ADMIN
  | typeof ROLES.WAITER
  | typeof ROLES.CASHIER
  | typeof ROLES.KITCHEN;

type CreateStaffBody = {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
};

function isValidStaffRole(value: unknown): value is StaffRole {
  return (
    typeof value === "string" &&
    [ROLES.ADMIN, ROLES.WAITER, ROLES.CASHIER, ROLES.KITCHEN].includes(
      value as StaffRole
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Xatolik: notog'ri so'rov bodysi" },
        { status: 400 }
      );
    }

    const { fullName, email, password, role } = body as CreateStaffBody;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 6 ||
      !isValidStaffRole(role)
    ) {
      return NextResponse.json(
        {
          error:
            "Xatolik: to'liq ism, amal qilishdagi email, 6+ belgili parol va xodim roli kerak",
        },
        { status: 400 }
      );
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    const newUser = await getAdminAuth().createUser({
      email: trimmedEmail,
      password,
      displayName: trimmedFullName,
    });

    await getAdminDb().collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      email: trimmedEmail,
      fullName: trimmedFullName,
      role,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      uid: newUser.uid,
      email: trimmedEmail,
      role,
    });
  } catch (error: unknown) {
    console.error("SERVER CREATE STAFF ERROR:", error);

    const errorMessage = getErrorMessage(error, "Xodim yaratishda server xatosi");
    const errorCode = getErrorCode(error);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    if (errorMessage.includes("Faqat admin")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    if (errorCode === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Bu email allaqachon mavjud" },
        { status: 400 }
      );
    }

    if (errorCode === "auth/invalid-email") {
      return NextResponse.json(
        { error: "Email formati notog'ri" },
        { status: 400 }
      );
    }

    if (errorCode === "auth/weak-password") {
      return NextResponse.json(
        { error: "Parol kamida 6 ta belgidan iborat bolishi kerak" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Xodim yaratishda server xatosi",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}