import { AdminLink } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="font-display text-5xl font-semibold text-gold-500">404</p>
      <h1 className="mt-3 font-sans text-xl font-semibold tracking-normal text-ink-900">Not found</h1>
      <p className="mt-2 text-[0.85rem] text-ink-500">It may have been deleted, or the link is mistyped.</p>
      <AdminLink href="/admin" className="mt-6">
        Back to the dashboard
      </AdminLink>
    </div>
  );
}
