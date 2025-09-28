"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/workspace", label: "Overview" },
  { href: "/workspace/admin", label: "Admin" },
  { href: "/workspace/organization", label: "Organization" },
  { href: "/workspace/donor", label: "Donor" },
  { href: "/workspace/actions", label: "Actions" }
];

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/40"
                : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
