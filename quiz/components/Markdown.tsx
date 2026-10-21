import { Fragment } from "react";

/** Renders Typeform-style copy: `*text*` = bold, `\n` = line break. */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line.split(/(\*[^*]+\*)/g).map((seg, j) =>
            seg.startsWith("*") && seg.endsWith("*") && seg.length > 1 ? (
              <strong key={j}>{seg.slice(1, -1)}</strong>
            ) : (
              <Fragment key={j}>{seg}</Fragment>
            ),
          )}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
