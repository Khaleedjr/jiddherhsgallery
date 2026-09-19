"use client";

import { useEffect, useState } from "react";
import { WhatsappIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";

/** Floating WhatsApp button — the primary way customers reach the store. */
export function WhatsappFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappLink(`As-salamu alaykum ${site.name}, I would like to ask about a product.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cx(
        "fixed right-4 bottom-4 z-30 grid size-13 place-items-center rounded-full bg-[#25D366] text-[#05321a] shadow-[0_12px_28px_-10px_rgba(5,50,26,0.6)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <WhatsappIcon className="size-6" />
    </a>
  );
}
