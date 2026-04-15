"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

function navigateTo(path: string, router: ReturnType<typeof useRouter>) {
  try {
    router.push(path);
  } catch {
    if (typeof window !== "undefined") {
      window.location.assign(path);
    }
  }
}

export default function HomeCtaButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => navigateTo(ROUTES.REGISTER, router)}
        className="cursor-pointer rounded-lg bg-yellow-500 px-5 py-2 font-medium text-white transition hover:bg-yellow-600"
      >
        Ro‘yxatdan o‘tish
      </button>

      <button
        type="button"
        onClick={() => navigateTo(ROUTES.LOGIN, router)}
        className="cursor-pointer rounded-lg bg-blue-500 px-5 py-2 font-medium text-white transition hover:bg-blue-600"
      >
        Kirish
      </button>
    </div>
  );
}
