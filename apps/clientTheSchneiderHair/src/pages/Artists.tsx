import { motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, Globe, Instagram, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import {
  CONTENT_DATA_SOURCE_MODE_EVENT,
  getArtistProfilesWithFallback,
  getSettingsWithFallback,
} from 'artist-portal-sdk';
import type { ArtistProfile } from '../types/domain';
import { useSiteCopy } from '../context/SiteCopyContext';
import { normalizeMediaStorageRoot, resolveMediaSrc } from '../lib/galleryHome';

export default function Artists() {
  const { siteCopy } = useSiteCopy();
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [mediaStorageRoot, setMediaStorageRoot] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedArtistId, setExpandedArtistId] = useState<string | null>(null);
  const orderedArtists = useMemo(
    () =>
      [...artists]
        .filter((artist) => artist.enabled !== false)
        .sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return `${a.firstName} ${a.lastName}`.trim().localeCompare(`${b.firstName} ${b.lastName}`.trim());
      }),
    [artists]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const items = await getArtistProfilesWithFallback();
      const settings = await getSettingsWithFallback();
      if (!cancelled) setArtists(items);
      if (!cancelled) setMediaStorageRoot(normalizeMediaStorageRoot(settings.mediaStorageRoot));
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const onChanged = () => setRefreshKey((k) => k + 1);
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
    return () => window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
  }, []);

  const handleCardClick = (event: React.MouseEvent<HTMLElement>, artistId: string, hasBio: boolean) => {
    if (!hasBio) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button')) return;
    const isTablet = window.matchMedia(
      '(min-width: 768px) and (max-width: 1199px), (min-width: 1200px) and (max-width: 1400px) and (orientation: landscape)'
    ).matches;
    if (!isTablet) return;
    setExpandedArtistId((current) => (current === artistId ? null : artistId));
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-24 px-8">
      <section className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors uppercase tracking-[0.2em] font-bold text-[9px] mb-8"
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> {siteCopy.shared.backToHome}
          </Link>
          <h1 className="text-5xl md:text-7xl tracking-tighter text-stone-800 mb-5">
            {siteCopy.artistsPage.titleLine1}
            <span className="text-gold italic font-normal">{siteCopy.artistsPage.titleAccent}</span>
          </h1>
          <p className="text-stone-500 max-w-2xl font-light text-sm">{siteCopy.artistsPage.intro}</p>
        </motion.div>

        {orderedArtists.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-stone-200 rounded-2xl text-stone-400 italic">
            {siteCopy.artistsPage.emptyState}
          </div>
        ) : (
          <div className="artists-tablet-columns columns-1 lg:columns-2 [column-gap:1.5rem]">
            {orderedArtists.map((artist, idx) => {
              const displayName = `${artist.firstName} ${artist.lastName}`.trim() || siteCopy.artistsPage.unnamedArtist;
              const instagram = artist.instagramHandle?.trim() || '';
              const instagramHref = instagram
                ? `https://instagram.com/${instagram.replace(/^@/, '')}`
                : '';
              const primaryProfileUrl = artist.personalWebsiteLink || artist.bookingWebsiteLink || '';
              const bookingHref = artist.bookingWebsiteLink?.trim() || '';
              const bioHtml = (artist.bio ?? '').trim();
              const isExpanded = expandedArtistId === artist.id;
              return (
                <div
                  key={artist.id}
                  className={`artists-card-shell relative mb-6 inline-block w-full break-inside-avoid ${bioHtml ? 'artists-card-shell--has-bio h-[calc(380px+1cm)]' : 'h-[220px]'}`}
                >
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={(event) => handleCardClick(event, artist.id, Boolean(bioHtml))}
                  className={`group artists-card absolute inset-x-0 top-0 z-0 flex flex-col bg-white rounded-2xl border border-stone-100 shadow-[0_18px_40px_rgba(28,25,23,0.22)] hover:z-30 hover:shadow-[0_24px_54px_rgba(28,25,23,0.28)] ${
                    bioHtml
                      ? `artists-card--has-bio min-h-[calc(380px+1cm)] max-h-[calc(380px+1cm)] overflow-hidden [will-change:max-height] transition-[max-height,box-shadow] duration-600 ease-in-out hover:max-h-[min(88vh,900px)] hover:overflow-visible ${isExpanded ? 'max-h-[min(88vh,900px)] overflow-visible z-30 shadow-2xl shadow-stone-900/35' : ''}`
                      : 'h-[220px] overflow-hidden transition-shadow duration-300'
                  }`}
                >
                  {bookingHref ? (
                    <a
                      href={bookingHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg ring-2 ring-gold/50 ring-offset-2 ring-offset-white animate-pulse hover:animate-none hover:bg-gold hover:text-stone-900 hover:ring-gold/70"
                      aria-label={`Book with ${displayName}`}
                    >
                      <Calendar className="size-3.5 shrink-0" aria-hidden />
                      {siteCopy.artistsPage.book}
                    </a>
                  ) : null}
                  <div className="flex shrink-0 items-stretch">
                    {primaryProfileUrl ? (
                      <a
                        href={primaryProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="artists-card-photo block h-[220px] w-32 shrink-0 cursor-pointer overflow-hidden rounded-l-2xl rounded-r-2xl bg-stone-100 sm:w-40 md:w-44"
                        aria-label={`Open ${displayName} website`}
                      >
                        {artist.profilePhotoLink ? (
                          <ImageWithFallback
                            src={resolveMediaSrc(artist.profilePhotoLink, 'artist', mediaStorageRoot)}
                            alt={displayName}
                            className="h-full w-full object-cover grayscale transition-[filter] duration-700 ease-out group-hover:grayscale-0"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-stone-400">
                            {siteCopy.artistsPage.noPhoto}
                          </div>
                        )}
                      </a>
                    ) : (
                      <div className="artists-card-photo h-[220px] w-32 shrink-0 overflow-hidden rounded-l-2xl rounded-r-2xl bg-stone-100 sm:w-40 md:w-44">
                        {artist.profilePhotoLink ? (
                          <ImageWithFallback
                            src={resolveMediaSrc(artist.profilePhotoLink, 'artist', mediaStorageRoot)}
                            alt={displayName}
                            className="h-full w-full object-cover grayscale transition-[filter] duration-700 ease-out group-hover:grayscale-0"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-stone-400">
                            {siteCopy.artistsPage.noPhoto}
                          </div>
                        )}
                      </div>
                    )}
                  <div
                    className={`artists-card-content flex-1 space-y-3 overflow-hidden p-5 sm:p-6 h-[220px] ${bookingHref ? 'pr-[5.5rem] sm:pr-28' : ''}`}
                  >
                    <h2 className="text-2xl font-serif text-stone-900 leading-tight">{displayName}</h2>
                    {artist.instagramHandle ? (
                      <p className="text-xs uppercase tracking-wider text-gold font-bold">{artist.instagramHandle}</p>
                    ) : null}

                    <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 overflow-hidden">
                      <div className="space-y-2 min-w-0">
                        {artist.phoneNumber ? (
                          <a
                            href={`tel:${artist.phoneNumber}`}
                            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" /> {artist.phoneNumber}
                          </a>
                        ) : null}

                        {artist.email ? (
                          <a
                            href={`mailto:${artist.email}`}
                            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors break-all"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" /> {artist.email}
                          </a>
                        ) : null}

                        {instagram && instagramHref ? (
                          <a
                            href={instagramHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors"
                          >
                            <Instagram className="w-3.5 h-3.5" /> {instagram}
                          </a>
                        ) : null}

                        {artist.bookingWebsiteLink ? (
                          <a
                            href={artist.bookingWebsiteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors break-all"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" /> {siteCopy.artistsPage.bookingWebsite}
                          </a>
                        ) : null}

                        {artist.personalWebsiteLink ? (
                          <a
                            href={artist.personalWebsiteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors break-all"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" /> {siteCopy.artistsPage.personalWebsite}
                          </a>
                        ) : null}
                      </div>
                      {artist.specialty ? (
                        <div className="self-start sm:justify-self-end rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 max-w-[22rem]">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-stone-400 mb-1">
                            {siteCopy.artistsPage.specialtyLabel}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-stone-700 font-semibold break-words">{artist.specialty}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  </div>
                  {bioHtml ? (
                    <div className="mt-6 shrink-0 px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">{siteCopy.artistsPage.bioLabel}</p>
                        <div
                          className={`max-h-[calc(3.6rem+1cm)] overflow-hidden text-sm text-stone-600 font-light leading-relaxed text-justify [will-change:max-height] transition-[max-height] duration-600 ease-in-out [text-align-last:left] [hyphens:auto] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden group-hover:max-h-[min(88vh,900px)] group-hover:overflow-y-auto [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:underline [&>a]:text-stone-700 hover:[&>a]:text-stone-900 ${isExpanded ? 'max-h-[min(88vh,900px)] overflow-y-auto' : ''}`}
                          dangerouslySetInnerHTML={{ __html: bioHtml }}
                        />
                      </div>
                    </div>
                  ) : null}
                </motion.article>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
