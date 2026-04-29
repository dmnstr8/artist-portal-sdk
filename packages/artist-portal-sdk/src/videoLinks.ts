/**
 * @license Apache-2.0
 */

export type VideoLinkItem = { id: string; url: string; label?: string };

function newLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function extractYoutubeVideoId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s, 'https://www.youtube.com');
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split(/[/?#]/)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
      if (embed) return embed[1];
      const shorts = u.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function isValidYoutubeVideoUrl(value: string): boolean {
  return extractYoutubeVideoId(value) !== null;
}

export function validateVideoLinkLabel(raw: string): boolean {
  return raw.trim().length <= 200;
}

export function normalizeVideoLinkItems(raw: unknown): VideoLinkItem[] {
  if (!Array.isArray(raw)) return [];
  const out: VideoLinkItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const url = typeof o.url === 'string' ? o.url.trim() : '';
    if (!isValidYoutubeVideoUrl(url)) continue;
    const idRaw = typeof o.id === 'string' ? o.id.trim() : '';
    const id = idRaw || newLocalId();
    const labelRaw = typeof o.label === 'string' ? o.label.trim() : '';
    const item: VideoLinkItem = { id, url };
    if (labelRaw) item.label = labelRaw;
    out.push(item);
  }
  return out;
}

export function videoLinksToYoutubeIds(items: VideoLinkItem[]): string[] {
  return items.map((i) => extractYoutubeVideoId(i.url)).filter((x): x is string => x !== null);
}
