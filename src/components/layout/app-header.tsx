"use client";

import LogoutButton from "@/components/auth/logout-button";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}