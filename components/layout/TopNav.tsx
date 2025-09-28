import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/workspace", label: "Workspace" },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "#features", label: "Features" }
];

export function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary font-bold">B+</span>
          <span>B+ive</span>
        </Link>
        <ul className="hidden items-center gap-6 text-slate-200 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link className="transition hover:text-brand-accent" href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/auth/login"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
