import { AlertIcon } from "@/components/admin/icons";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/admin/auth";
import { getDriver } from "@/lib/store/driver";
import { listOrders } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const orders = await listOrders();
  const counts = { pending: orders.filter((order) => order.status === "pending").length };
  const persistent = getDriver().persistent;

  return (
    <div className="lg:pl-60">
      <AdminSidebar counts={counts} />
      {!persistent ? (
        <div className="flex items-start gap-2.5 border-b border-berry-500/20 bg-berry-500/8 px-4 py-2.5 text-[0.78rem] text-berry-600 sm:px-6 lg:px-8">
          <AlertIcon className="mt-px size-4 shrink-0" />
          <p>
            <strong className="font-semibold">Changes are not being saved permanently.</strong> This server has no lasting
            storage. Connect Upstash Redis (set <code>KV_REST_API_URL</code> and <code>KV_REST_API_TOKEN</code>) so orders and
            edits persist.
          </p>
        </div>
      ) : null}
      <main id="main">{children}</main>
    </div>
  );
}
