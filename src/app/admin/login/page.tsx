import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/admin/auth";
import { DEV_PASSWORD, adminPassword } from "@/lib/admin/session";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  const usingDevPassword = !process.env.ADMIN_PASSWORD?.trim() && adminPassword() === DEV_PASSWORD;

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-forest-950 px-4 py-12">
      <div className="pattern-girih-light absolute inset-0 opacity-20" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={64} height={64} className="size-16" priority />
          <p className="mt-4 font-display text-2xl font-semibold text-sand-50">{site.name}</p>
          <p className="mt-1 text-[0.8rem] text-sand-300/80">Store dashboard</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-7">
          <h1 className="font-sans text-lg font-semibold tracking-normal text-ink-900">Sign in</h1>
          <p className="mt-1 mb-5 text-[0.8rem] text-ink-500">Enter the admin password to manage the store.</p>
          {adminPassword() ? (
            <LoginForm next={next} />
          ) : (
            <p role="alert" className="rounded-lg bg-berry-500/8 px-3 py-2.5 text-[0.8rem] leading-relaxed text-berry-600">
              The dashboard is locked. Set <code className="font-semibold">ADMIN_PASSWORD</code> in the hosting environment
              variables, then redeploy.
            </p>
          )}
          {usingDevPassword ? (
            <p className="mt-5 rounded-lg bg-gold-100 px-3 py-2 text-[0.74rem] leading-relaxed text-gold-700">
              Development mode: the password is <code className="font-semibold">{DEV_PASSWORD}</code>. Set{" "}
              <code className="font-semibold">ADMIN_PASSWORD</code> before going live.
            </p>
          ) : null}
        </div>
        <Link href="/" className="mt-6 block text-center text-[0.78rem] text-sand-300/80 transition hover:text-gold-300">
          ← Back to the store
        </Link>
      </div>
    </div>
  );
}
