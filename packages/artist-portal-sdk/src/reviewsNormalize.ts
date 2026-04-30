/**
 * Normalize reviews from local JSON (legacy string[] or aggregate { items }) and Firestore
 * (per-doc legacy or single aggregate doc with items[]).
 * @license Apache-2.0
 */

import type { QueryDocumentSnapshot } from 'firebase/firestore';

import type { Review } from './domain';

/** Admin UI row; aggregate docs carry Firestore parent id + raw item for round-trip writes. */
export type AdminReviewRow = Review & {
  _aggregateDocId?: string;
  /** Index inside `reviews/{_aggregateDocId}.items` (only when `_aggregateDocId` is set). */
  _itemIndex?: number;
  _aggregateRawItem?: Record<string, unknown>;
};

function reviewTextFromItem(item: Record<string, unknown>): string {
  return String(item.text ?? item.quote ?? '').trim();
}

function cloneJson<T>(v: T): T {
  try {
    return JSON.parse(JSON.stringify(v)) as T;
  } catch {
    return v;
  }
}

/**
 * Parse `public/data/reviews.json`: string[], object[], or { schemaVersion?, items: [...] }.
 */
export function parseReviewsJsonPayload(parsed: unknown, idPrefix: 'temp' | 'err' = 'temp'): AdminReviewRow[] {
  if (parsed == null) return [];

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return [];
    if (typeof parsed[0] === 'string') {
      return (parsed as string[]).map((text, i) => ({
        id: `${idPrefix}-${i}`,
        text,
        isLocal: true,
      }));
    }
    return (parsed as Record<string, unknown>[]).map((item, i) => ({
      id: String(item?.id ?? `${idPrefix}-${i}`),
      text: reviewTextFromItem(item as Record<string, unknown>),
      isLocal: true,
      createdAt:
        typeof item?.createdAt === 'string'
          ? item.createdAt
          : typeof item?.dateAdded === 'string'
            ? item.dateAdded
            : undefined,
    }));
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const o = parsed as Record<string, unknown>;
    if (Array.isArray(o.items)) {
      return (o.items as Record<string, unknown>[]).map((item, i) => ({
        id: String(item?.id ?? `${idPrefix}-${i}`),
        text: reviewTextFromItem(item),
        isLocal: true,
        createdAt:
          typeof item?.createdAt === 'string'
            ? item.createdAt
            : typeof item?.dateAdded === 'string'
              ? item.dateAdded
              : undefined,
        _aggregateDocId: 'home',
        _itemIndex: i,
        _aggregateRawItem: cloneJson(item),
      }));
    }
  }

  return [];
}

/**
 * Flatten Firestore `reviews` collection into card rows (legacy one doc per quote, or aggregate `items[]`).
 */
export function flattenReviewsFromFirestoreDocs(docs: QueryDocumentSnapshot[]): AdminReviewRow[] {
  const out: AdminReviewRow[] = [];

  for (const d of docs) {
    const data = d.data() as Record<string, unknown>;
    const items = data.items;

    if (Array.isArray(items)) {
      if (items.length > 0) {
        items.forEach((raw, i) => {
          const item = raw as Record<string, unknown>;
          const text = reviewTextFromItem(item);
          if (!text) return;
          out.push({
            id: String(item.id ?? `${d.id}__${i}`),
            text,
            createdAt:
              typeof item.createdAt === 'string'
                ? item.createdAt
                : typeof item.dateAdded === 'string'
                  ? item.dateAdded
                  : undefined,
            _aggregateDocId: d.id,
            _itemIndex: i,
            _aggregateRawItem: cloneJson(item),
          });
        });
      } else {
        const legacyText = String(data.text ?? data.quote ?? '');
        if (legacyText.trim() !== '') {
          out.push({
            id: d.id,
            text: legacyText,
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
          });
        }
      }
    } else {
      const text = String(data.text ?? data.quote ?? '').trim();
      out.push({
        id: d.id,
        text,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
      });
    }
  }

  return out;
}

/** Strip admin-only fields for public `Review[]` consumers. */
export function toPublicReviews(rows: AdminReviewRow[]): Review[] {
  return rows.map(({ id, text, createdAt, isLocal }) => ({
    id,
    text,
    createdAt,
    isLocal,
  }));
}

/** Build `items` payload for an aggregate `reviews/{docId}` document from admin rows (preserves extra fields). */
export function rebuildAggregateReviewItems(rows: AdminReviewRow[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const base =
      r._aggregateRawItem && typeof r._aggregateRawItem === 'object'
        ? { ...r._aggregateRawItem }
        : ({} as Record<string, unknown>);
    const t = String(r.text ?? '').trim();
    return { ...base, text: t, quote: t };
  });
}
