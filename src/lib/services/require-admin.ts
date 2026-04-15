import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized (no token)");
  }

  const token = authHeader.split("Bearer ")[1];
  const decoded = await getAdminAuth().verifyIdToken(token);

  const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const userData = userDoc.data();

  if (userData?.role !== "admin") {
    throw new Error("Faqat admin ruxsatga ega");
  }

  return {
    uid: decoded.uid,
    email: userData?.email || decoded.email || "",
    role: userData?.role || "",
  };
}