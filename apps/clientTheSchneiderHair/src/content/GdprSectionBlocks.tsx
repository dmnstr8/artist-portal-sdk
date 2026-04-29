import React from 'react';

export type GdprPlinkPart = { text: string; href?: string };

export type GdprElement =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'plink'; parts: GdprPlinkPart[] };

export type GdprSectionBlocks = {
  heading: string;
  elements: GdprElement[];
};

export function GdprSectionBlocksView({ section }: { section: GdprSectionBlocks }) {
  return (
    <div>
      <h4 className="text-stone-900 font-medium mb-3 uppercase tracking-wider text-xs">{section.heading}</h4>
      {section.elements.map((el, i) => {
        if (el.type === 'p') {
          return (
            <p key={i}>
              {el.text}
            </p>
          );
        }
        if (el.type === 'ul') {
          return (
            <ul key={i} className="list-disc list-inside space-y-1">
              {el.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        if (el.type === 'plink') {
          return (
            <p key={i}>
              {el.parts.map((part, j) =>
                part.href ? (
                  <a key={j} href={part.href} target="_blank" rel="noreferrer" className="underline">
                    {part.text}
                  </a>
                ) : (
                  <React.Fragment key={j}>{part.text}</React.Fragment>
                ),
              )}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
