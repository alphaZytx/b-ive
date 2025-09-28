"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<{ href: string; label: string; roles?: string[] }> = [
  { href: "/workspace", label: "Overview" },
  { href: "/workspace/admin", label: "Admin", roles: ["admin", "government"] },
  { href: "/workspace/government", label: "Government", roles: ["government", "admin"] },
  { href: "/workspace/organization", label: "Organization", roles: ["organization", "admin"] },
  { href: "/workspace/donor", label: "Donor", roles: ["donor", "recipient", "admin"] },
  { href: "/workspace/actions", label: "Actions", roles: ["admin", "organization"] }
];

export function WorkspaceNav({ roles }: { roles: string[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {links
        .filter((link) => !link.roles || link.roles.some((role) => roles.includes(role)))
        .map((link) => {
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
