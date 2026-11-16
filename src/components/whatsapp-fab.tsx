"use client";

import { useEffect, useState } from "react";
import { WhatsappIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import { useSiteText } from "@/components/site-text-provider";
import { whatsappHref } from "@/lib/content/format";

/** Floating WhatsApp button — the primary way customers reach the store. */
export function WhatsappFab() {
  const { layout, store } = useSiteText();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappHref(store.whatsapp, layout.fabMessage)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cx(
        "tone-ink fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-coal-900 text-gold-500 shadow-[0_14px_30px_-12px_rgba(20,17,10,0.7)] ring-2 ring-gold-500 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <WhatsappIcon className="size-6" />
    </a>
  );
}
