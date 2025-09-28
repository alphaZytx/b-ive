"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

const navLinks: Array<{ href: string; label: string; requireAuth?: boolean }> = [
  { href: "/", label: "Home" },
  { href: "/workspace", label: "Workspace", requireAuth: true },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "#features", label: "Features" }
];

export function TopNav() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const primaryRole = session?.user?.roles?.[0];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary font-bold">B+</span>
          <span>B+ive</span>
        </Link>
        <ul className="hidden items-center gap-6 text-slate-200 md:flex">
          {navLinks
            .filter((link) => (link.requireAuth ? isAuthenticated : true))
            .map((link) => (
              <li key={link.href}>
                <Link className="transition hover:text-brand-accent" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
        </ul>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden flex-col text-right text-xs font-medium text-slate-300 sm:flex">
                <span className="text-white">{session?.user?.name ?? session?.user?.email}</span>
                {primaryRole ? <span className="uppercase tracking-wide text-brand-accent">{primaryRole}</span> : null}
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn(undefined, { callbackUrl: "/workspace" })}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
