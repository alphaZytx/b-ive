import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";

interface LoginPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const callbackUrlParam = typeof searchParams?.callbackUrl === "string" ? searchParams?.callbackUrl : undefined;

  if (session) {
    redirect(callbackUrlParam ?? "/workspace");
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center gap-12 px-6 py-12">
      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-white">Sign in to B+ive</h1>
          <p className="mt-2 text-sm text-slate-300">
            Use the credentials provisioned by the seed script to explore the role-aware workspace. All API routes require an
            authenticated session.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrlParam} />
        <p className="text-xs text-slate-400">
          Demo accounts (password <code className="rounded bg-black/40 px-1 py-0.5 text-[11px]">ChangeMe123!</code>):
          <br />
          <span className="font-medium text-white">Admin</span>: admin@bive.demo · <span>Role: admin</span>
          <br />
          <span className="font-medium text-white">Government</span>: gov@bive.demo · <span>Role: government</span>
          <br />
          <span className="font-medium text-white">Organization</span>: org@bive.demo · <span>Role: organization</span>
          <br />
          <span className="font-medium text-white">Donor</span>: ritu.sharma@example.com · <span>Role: donor</span>
        </p>
      </section>
      <p className="text-center text-sm text-slate-300">
        Want to learn more about the architecture? Review the <Link href="/docs/architecture" className="text-brand-accent">design playbook</Link>.
      </p>
    </main>
  );
}
