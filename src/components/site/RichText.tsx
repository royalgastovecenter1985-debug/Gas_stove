import { Fragment } from 'react';
import { paragraphs } from '@/lib/format';

/** Inline text where **double asterisks** mark bold words (admin-editable copy). */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

/** Paragraphs separated by blank lines; single line breaks are kept. */
export function Paragraphs({ text }: { text: string | null | undefined }) {
  return (
    <>
      {paragraphs(text).map((para, i) => (
        <p key={i}>
          {para.split(/\r?\n/).map((line, k, arr) => (
            <Fragment key={k}>
              <Inline text={line} />
              {k < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
