import { NotFoundContent } from "@/components/not-found-content";
import { StoreShell } from "@/components/store-shell";

/** Addresses outside every route: no layout above supplies the store's frame, so this one does. */
export default function NotFound() {
  return (
    <StoreShell>
      <NotFoundContent />
    </StoreShell>
  );
}
