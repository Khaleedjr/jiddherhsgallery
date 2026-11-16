"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { RichText } from "@/components/rich-text";
import { cx } from "@/components/ui";

export function Accordion({ items }: { items: Array<{ question: string; answer: string }> }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-sand-200 overflow-hidden rounded-xl border border-sand-200 bg-white">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={index}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : index)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[0.92rem] font-semibold text-coal-900 transition hover:bg-sand-50 sm:px-6"
              >
                {item.question}
                <ChevronDownIcon
                  className={cx("size-4 shrink-0 text-ink-500 transition", expanded && "rotate-180")}
                />
              </button>
            </h3>
            {expanded ? (
              <div className="animate-fade space-y-3 px-5 pb-5 text-[0.86rem] leading-relaxed text-ink-600 sm:px-6">
                <RichText text={item.answer} listClassName="list-disc space-y-1 pl-5" />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
