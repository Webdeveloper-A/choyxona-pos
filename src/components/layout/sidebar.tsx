"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  href: string;
  label: string;
};

type SidebarProps = {
  title: string;
  items: SidebarItem[];
};

export default function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full border-r border-gray-200 bg-white lg:w-72">
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}