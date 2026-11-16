import { Fragment } from "react";
import { parseRich } from "@/lib/content/format";

/** One line of editable text, with **two stars** around a word making it bold. */
export function Inline({ text, strongClassName }: { text: string; strongClassName?: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className={strongClassName}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Paragraphs and bullet points typed in the dashboard (see parseRich). */
export function RichText({
  text,
  paragraphClassName,
  listClassName,
  itemClassName,
}: {
  text: string;
  paragraphClassName?: string;
  listClassName?: string;
  itemClassName?: string;
}) {
  return (
    <>
      {parseRich(text).map((block, index) =>
        block.kind === "p" ? (
          <p key={index} className={paragraphClassName}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                <Inline text={line} />
              </Fragment>
            ))}
          </p>
        ) : (
          <ul key={index} className={listClassName}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className={itemClassName}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}
