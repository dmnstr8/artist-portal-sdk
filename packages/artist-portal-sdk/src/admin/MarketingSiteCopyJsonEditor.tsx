import { useEffect, useRef } from 'react';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import './MarketingSiteCopyJsonEditor.css';

type Props = {
  /** Pretty-printed JSON string shown in the editor (captured on mount; parent remounts via `key` when it changes externally). */
  value: string;
  /** Called when the user edits the document. */
  onChangeText: (text: string) => void;
};

/**
 * jsoneditor (josdejong) for marketing site copy in the admin panel.
 * Remount with a new `key` whenever `value` is replaced from outside (load defaults, cloud, tab data fetch).
 */
export function MarketingSiteCopyJsonEditor({ value, onChangeText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const onChangeRef = useRef(onChangeText);
  onChangeRef.current = onChangeText;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let initial: unknown = {};
    try {
      const raw = value.trim();
      initial = raw ? JSON.parse(raw) : {};
    } catch {
      initial = {};
    }

    const editor = new JSONEditor(el, {
      modes: ['tree', 'code', 'text', 'preview'],
      mode: 'tree',
      limitDragging: true,
      sortObjectKeys: false,
      onClassName: (params) =>
        params.path.length === 1 ? 'msc-jsoneditor-root-key' : undefined,
      onChange: () => {
        if (syncingRef.current) return;
        try {
          onChangeRef.current(JSON.stringify(editor.get(), null, 2));
        } catch {
          try {
            onChangeRef.current(editor.getText());
          } catch {
            /* ignore */
          }
        }
      },
    });

    syncingRef.current = true;
    try {
      editor.set(initial);
    } catch {
      editor.set({});
    }
    syncingRef.current = false;

    return () => {
      editor.destroy();
    };
    // `value` is read only on mount; parent bumps `key` when replacing JSON from outside.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, []);

  return (
    <div
      className="marketing-site-copy-jsoneditor max-w-5xl overflow-hidden rounded-xl bg-transparent [&_.jsoneditor]:min-h-[480px] [&_.jsoneditor-menu]:rounded-t-xl"
      ref={containerRef}
    />
  );
}
