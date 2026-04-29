import { motion } from 'motion/react';
import React from 'react';
import { legalSiteCopy } from '../content/legalSiteCopy';

const TermsPage = () => {
  const { termsPage } = legalSiteCopy;

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-24 px-8">
      <div className="max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
          <header className="border-b border-stone-200 pb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">{termsPage.header.title}</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold">{termsPage.header.subtitle}</p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <aside className="md:col-span-4 space-y-8">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">{termsPage.aside.ownerLabel}</h4>
                <p className="text-stone-900 font-medium">{termsPage.aside.ownerName}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">{termsPage.aside.addressLabel}</h4>
                <p className="text-stone-600 text-sm leading-relaxed font-light">
                  {termsPage.aside.addressLines.map((line, idx) => (
                    <React.Fragment key={`${idx}-${line}`}>
                      {idx > 0 ? <br /> : null}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </aside>

            <div className="md:col-span-8 space-y-12">
              <div className="prose prose-stone max-w-none dark:prose-invert">
                <h3 className="text-xl font-serif text-stone-900 mb-6">{termsPage.mainTitle}</h3>

                <div className="space-y-10 text-stone-600 font-light leading-relaxed text-sm text-justify [&>div>p+p]:mt-4 [&>div>ul]:mt-4 [&>div>p+ul]:mt-4 [&>div>ul+p]:mt-4">
                  {termsPage.sections.map((sec, idx) => (
                    <React.Fragment key={sec.heading}>
                      <div>
                        <h4 className="text-stone-900 font-medium mb-3 uppercase tracking-wider text-xs">{sec.heading}</h4>
                        {sec.paragraphs.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                      {idx < termsPage.sections.length - 1 ? <div className="h-px bg-stone-200 w-12" /> : null}
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

export default TermsPage;
