import { motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import { getPageTextSiteEditorSettings, SITE_EDITOR_SETTINGS_CHANGED } from 'artist-portal-sdk';
import { legalSiteCopy } from '../content/legalSiteCopy';
import { GdprSectionBlocksView, type GdprSectionBlocks } from '../content/GdprSectionBlocks';

const LegalPage = () => {
  const [siteEditorKey, setSiteEditorKey] = useState(0);
  useEffect(() => {
    const onChange = () => setSiteEditorKey((k) => k + 1);
    window.addEventListener(SITE_EDITOR_SETTINGS_CHANGED, onChange);
    return () => window.removeEventListener(SITE_EDITOR_SETTINGS_CHANGED, onChange);
  }, []);
  const pt = useMemo(() => getPageTextSiteEditorSettings(), [siteEditorKey]);
  const addressLines = pt.impressumAddressLines.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-24 px-8">
      <div className="max-w-[1000px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
        >
          <header className="border-b border-stone-200 pb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">{legalSiteCopy.legalPage.header.title}</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold">{legalSiteCopy.legalPage.header.subtitle}</p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <aside className="md:col-span-4 space-y-8">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">
                  {legalSiteCopy.legalPage.aside.ownerLabel}
                </h4>
                <p className="text-stone-900 font-medium">{pt.impressumOwnerName}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">
                  {legalSiteCopy.legalPage.aside.addressLabel}
                </h4>
                <p className="text-stone-600 text-sm leading-relaxed font-light">
                  {pt.impressumTradingName}
                  {addressLines.map((line, idx) => (
                    <React.Fragment key={`${idx}-${line}`}>
                      <br />
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">
                  {legalSiteCopy.legalPage.aside.contactLabel}
                </h4>
                <p className="text-stone-600 text-sm font-light">
                  {legalSiteCopy.legalPage.aside.emailPrefix}{' '}
                  <a href={`mailto:${pt.impressumContactEmail}`} className="underline hover:text-stone-900">
                    {pt.impressumContactEmail}
                  </a>
                  <br />
                  {legalSiteCopy.legalPage.aside.phonePrefix} {pt.impressumContactPhone}
                </p>
              </div>
            </aside>

            <div className="md:col-span-8 space-y-12">
              <div className="prose prose-stone max-w-none dark:prose-invert">
                <h3 className="text-xl font-serif text-stone-900 mb-6">{legalSiteCopy.legalPage.privacyMainTitle}</h3>
                
                <div className="space-y-10 text-stone-600 font-light leading-relaxed text-sm text-justify [&>div>p+p]:mt-4 [&>div>ul]:mt-4 [&>div>p+ul]:mt-4 [&>div>ul+p]:mt-4">
                  <div>
                    <h4 className="text-stone-900 font-medium mb-3 uppercase tracking-wider text-xs">
                      {legalSiteCopy.legalPage.dataControllerHeading}
                    </h4>
                    <p>{pt.impressumTradingName}</p>
                    <p>{pt.impressumOwnerName}</p>
                    {addressLines.map((line, idx) => (
                      <p key={`${idx}-${line}`}>{line}</p>
                    ))}
                    <p>
                      {legalSiteCopy.legalPage.gdprEmailPrefix}{' '}
                      <a href={`mailto:${pt.impressumContactEmail}`} className="underline">
                        {pt.impressumContactEmail}
                      </a>
                    </p>
                    <p>
                      {legalSiteCopy.legalPage.aside.phonePrefix} {pt.impressumContactPhone}
                    </p>
                  </div>

                  {legalSiteCopy.legalPage.gdprSections.map((section) => (
                    <React.Fragment key={section.heading}>
                      <div className="h-px bg-stone-200 w-12" />
                      <div>
                        <GdprSectionBlocksView section={section as GdprSectionBlocks} />
                        {section.heading === '9. Your Rights' ? (
                          <p>
                            <a href={`mailto:${pt.impressumContactEmail}`} className="underline">
                              {pt.impressumContactEmail}
                            </a>
                          </p>
                        ) : null}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default LegalPage;
