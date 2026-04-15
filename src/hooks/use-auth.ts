"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

type AppUserDoc = {
  uid: string;
  email: string;
  fullName?: string;
  role?: string;
};

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<AppUserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);

      if (!user) {
        setUserDoc(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as AppUserDoc;

          const normalizedRole =
            typeof data.role === "string"
              ? data.role.trim().toLowerCase()
              : "customer";

          const normalizedDoc: AppUserDoc = {
            uid: user.uid,
            email: user.email || data.email || "",
            fullName: data.fullName || "",
            role: normalizedRole,
          };

          setUserDoc(normalizedDoc);
        } else {
          const fallbackDoc: AppUserDoc = {
            uid: user.uid,
            email: user.email || "",
            fullName: "",
            role: "customer",
          };

          setUserDoc(fallbackDoc);
        }
      } catch (error) {
        console.error("USEAUTH ERROR:", error);
        setUserDoc({
          uid: user.uid,
          email: user.email || "",
          fullName: "",
          role: "customer",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return {
    firebaseUser,
    userDoc,
    loading,
    isAuthenticated: !!firebaseUser,
  };
}