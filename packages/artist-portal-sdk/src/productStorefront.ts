import type { ProductStorefrontCategory } from './domain';

export function normalizeProductStorefrontCategory(raw: unknown, id: string): ProductStorefrontCategory {
  const r = raw as Record<string, unknown> | null | undefined;
  const countRaw = r?.count ?? r?.itemCount;
  const n = typeof countRaw === 'number' ? countRaw : Number.parseInt(String(countRaw ?? '0'), 10);
  return {
    id,
    slug: String(r?.slug ?? '').trim(),
    title: String(r?.title ?? '').trim(),
    count: Number.isFinite(n) ? n : 0,
    image: String(r?.image ?? '').trim(),
    link: String(r?.link ?? '').trim(),
    enabled: r?.enabled !== false,
    order: typeof r?.order === 'number' && Number.isFinite(r.order) ? r.order : undefined,
  };
}

export function sortProductStorefrontCategoriesByOrder(
  items: ProductStorefrontCategory[],
): ProductStorefrontCategory[] {
  return [...items].sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

export function reindexProductStorefrontCategories(
  items: ProductStorefrontCategory[],
): ProductStorefrontCategory[] {
  return items.map((row, index) => ({ ...row, order: index }));
}

export function slugifyStorefrontTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.slice(0, 96) || `category-${Date.now()}`;
}
