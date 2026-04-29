import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ChevronDown, ArrowRight, CheckCircle2, Download, BookOpen, X, Ticket, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import VideoCarouselLightboxSection from '../components/VideoCarouselLightboxSection';

import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { assetUrl } from '../shared/utils/assetUrl';
import {
  CONTENT_DATA_SOURCE_MODE_EVENT,
  getFaqWithFallback,
  getSettingsWithFallback,
  getWidgetsWithFallback,
} from 'artist-portal-sdk';
import { alertDialog } from '../shared/ui/dialogs';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasConsentFor,
  openConsentPreferences,
} from '../lib/cookieConsent';
import { useSiteCopy } from '../context/SiteCopyContext';

const ContactModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { siteCopy } = useSiteCopy();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const payload = Object.fromEntries(formData.entries());
      
      // 1. Silent backup to cloud database
      try {
        await addDoc(collection(db, 'inquiries'), {
          ...payload,
          createdAt: serverTimestamp(),
          source: 'EducationFAQ'
        });
      } catch (dbError) {
        console.warn('Silent backup to cloud failed:', dbError);
      }

      // 2. Fetch target email from settings
      let targetEmail = "diggs.it.accnt@gmail.com"; // Default for Dev
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists() && settingsSnap.data().contactEmail) {
          targetEmail = settingsSnap.data().contactEmail;
        }
      } catch (err) {
        console.warn("Failed to fetch custom contact email, using default", err);
      }

      // 3. Main Email Submission via FormSubmit
      const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          _subject: siteCopy.educationContactModal.formSubject,
          _template: "table",
          _captcha: "false"
        })
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          setStatus('idle');
        }, 3000);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
      // For simplicity in this UI, we just alert if it fails
      alertDialog(siteCopy.educationContactModal.errorAlert);
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-inquiry-modal-backdrop fixed inset-0 z-[1200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-stone-50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="p-8 md:p-12">
            <h3 className="text-3xl font-serif text-stone-800 mb-2">{siteCopy.educationContactModal.title}</h3>
            <p className="text-stone-500 font-light text-sm mb-8 leading-relaxed">{siteCopy.educationContactModal.intro}</p>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="h-[300px] flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-gold mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-serif text-stone-800">{siteCopy.educationContactModal.successTitle}</h4>
                <p className="text-stone-500 font-light text-sm">{siteCopy.educationContactModal.successBody}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {siteCopy.educationContactModal.nameLabel}
                  </label>
                  <input 
                    required 
                    type="text" 
                    id="name"
                    name="name"
                    disabled={status === 'sending'}
                    className="w-full bg-stone-100 border-none rounded-md px-4 py-3 text-stone-800 text-sm focus:ring-1 focus:ring-gold focus:outline-none transition-shadow disabled:opacity-50" 
                    placeholder={siteCopy.educationContactModal.namePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {siteCopy.educationContactModal.emailLabel}
                  </label>
                  <input 
                    required 
                    type="email" 
                    id="email"
                    name="email"
                    disabled={status === 'sending'}
                    className="w-full bg-stone-100 border-none rounded-md px-4 py-3 text-stone-800 text-sm focus:ring-1 focus:ring-gold focus:outline-none transition-shadow disabled:opacity-50" 
                    placeholder={siteCopy.educationContactModal.emailPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {siteCopy.educationContactModal.messageLabel}
                  </label>
                  <textarea 
                    required 
                    id="message"
                    name="message"
                    rows={4}
                    disabled={status === 'sending'}
                    className="w-full bg-stone-100 border-none rounded-md px-4 py-3 text-stone-800 text-sm focus:ring-1 focus:ring-gold focus:outline-none transition-shadow resize-none disabled:opacity-50" 
                    placeholder={siteCopy.educationContactModal.messagePlaceholder}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={status === 'sending'}
                  className="w-full bg-stone-900 text-stone-50 rounded-md py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gold transition-colors duration-300 disabled:opacity-50 flex justify-center items-center h-[46px]"
                >
                  {status === 'sending' ? (
                    <div className="w-4 h-4 border-2 border-stone-50 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{siteCopy.educationContactModal.send}</span>
                  )}
                </button>
              </form>
            )}
          </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default function EducationFAQ() {
  const { siteCopy } = useSiteCopy();
  const [faqCategories, setFaqCategories] = useState<{ category: string; items: { q: string; a: string }[] }[]>([]);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(true);
  const [paymentWidgetProvider, setPaymentWidgetProvider] = useState<'payhip'>('payhip');
  const [paymentWidgetProductId, setPaymentWidgetProductId] = useState('4GCTc');
  const [allowPaymentWidget, setAllowPaymentWidget] = useState(() => hasConsentFor('functional'));
  const [refreshKey, setRefreshKey] = useState(0);
  const ebookImageRef = React.useRef<HTMLDivElement | null>(null);
  const ebookImageInView = useInView(ebookImageRef, { amount: 0.35 });
  const masterclassImageRef = React.useRef<HTMLDivElement | null>(null);
  const masterclassImageInView = useInView(masterclassImageRef, { amount: 0.35 });

  useEffect(() => {
    const fetchFaq = async () => {
      const [faqCategories, settings, widgets] = await Promise.all([
        getFaqWithFallback(),
        getSettingsWithFallback(),
        getWidgetsWithFallback(),
      ]);
      setFaqCategories(
        faqCategories.map((category) => ({
          category: category.category,
          items: category.items,
        })),
      );
      setShowContactForm(settings.showContactForm !== false);
      setPaymentWidgetProvider(widgets.paymentWidgetProvider === 'payhip' ? 'payhip' : 'payhip');
      setPaymentWidgetProductId(widgets.showPaymentWidget ? String(widgets.paymentWidgetProductId ?? '4GCTc') : '');
    };
    
    fetchFaq();
  }, [refreshKey]);

  useEffect(() => {
    const onChanged = () => setRefreshKey((k) => k + 1);
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
    return () => window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
  }, []);

  useEffect(() => {
    const syncConsent = () => setAllowPaymentWidget(hasConsentFor('functional'));
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    if (paymentWidgetProvider !== 'payhip') return;
    if (!paymentWidgetProductId.trim()) return;
    if (!allowPaymentWidget) return;
    const src = 'https://payhip.com/payhip.js';
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) return;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    document.head.appendChild(script);
    return () => {
      // Keep loaded globally once injected.
    };
  }, [paymentWidgetProvider, paymentWidgetProductId, allowPaymentWidget]);

  const ebookAccessHref =
    paymentWidgetProvider === 'payhip' && paymentWidgetProductId.trim() && allowPaymentWidget
      ? `https://payhip.com/b/${paymentWidgetProductId.trim()}`
      : '#';

  return (
    <div className="pt-32 pb-32 px-8 min-h-[80vh] flex flex-col pt-40">
      <div className="max-w-[1000px] mx-auto w-full">
        {/* Header Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors uppercase tracking-[0.2em] font-bold text-[9px] mb-8">
            <ArrowRight className="w-3 h-3 rotate-180" /> {siteCopy.shared.backToHome}
          </Link>
          <h1 className="text-5xl md:text-7xl tracking-tighter text-stone-800 mb-6">
            {siteCopy.educationFaqPage.titleLine1}
            <br />
            <span className="text-gold italic font-normal">{siteCopy.educationFaqPage.titleAccent}</span>
          </h1>
          <p className="text-stone-500 max-w-lg font-light text-sm">{siteCopy.educationFaqPage.intro}</p>
        </motion.div>

        {/* Ebook Promotional Section */}
        <motion.div 
          id="ebook"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 bg-stone-50 rounded-2xl p-8 md:p-12 border border-stone-200/50 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div ref={ebookImageRef} className="md:col-span-5 relative group">
              <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full scale-90 group-hover:scale-105 transition-transform duration-700"></div>
              <ImageWithFallback 
                src={assetUrl('/media/other/ebook.jpeg')} 
                alt={siteCopy.educationFaqPage.ebookCoverAlt} 
                className={`tablet-scroll-image w-full max-w-sm mx-auto relative z-10 rounded-xl shadow-2xl shadow-stone-900/20 object-cover aspect-[3/4] grayscale transition-[filter] duration-1000 ${ebookImageInView ? 'tablet-scroll-image-in-view' : ''}`}
              />
            </div>
            <div className="md:col-span-7 space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-stone-200/50 text-stone-600 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase">
                  <BookOpen className="w-3 h-3" /> {siteCopy.educationFaqPage.ebookBadge}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-stone-900">{siteCopy.educationFaqPage.ebookTitle}</h2>
                <p className="text-xl text-gold italic font-serif">{siteCopy.educationFaqPage.ebookTagline}</p>
                <p className="text-stone-600 font-light leading-relaxed">{siteCopy.educationFaqPage.ebookBody}</p>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                  {siteCopy.educationFaqPage.ebookInsideLabel}
                </p>
                <ul className="space-y-3">
                  {siteCopy.educationFaqPage.ebookBullets.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-stone-700 font-light text-sm">
                      <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="space-y-1 text-xs text-stone-500 font-light">
                  <p>
                    <strong className="font-medium text-stone-800">{siteCopy.educationFaqPage.ebookFormatLine}</strong>{' '}
                    {siteCopy.educationFaqPage.ebookFormatValue}
                  </p>
                  <p>
                    <strong className="font-medium text-stone-800">{siteCopy.educationFaqPage.ebookLanguageLine}</strong>{' '}
                    {siteCopy.educationFaqPage.ebookLanguageValue}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <a 
                    href={ebookAccessHref}
                    target={allowPaymentWidget ? '_blank' : undefined}
                    rel={allowPaymentWidget ? 'noopener noreferrer' : undefined}
                    onClick={(event) => {
                      if (allowPaymentWidget) return;
                      event.preventDefault();
                      openConsentPreferences();
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-3 px-8 py-4 bg-stone-900 text-stone-50 rounded-md text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gold hover:text-stone-900 transition-colors duration-300 w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" /> {siteCopy.educationFaqPage.ebookCta}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Event Tickets Section */}
        <motion.div 
          id="events"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-24 bg-stone-900 rounded-2xl p-8 md:p-12 border border-stone-800 shadow-xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
            <div className="md:col-span-7 space-y-8 order-2 md:order-1">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-stone-800 text-gold rounded-full text-[10px] font-bold tracking-[0.2em] uppercase border border-gold/20">
                  <Calendar className="w-3 h-3" /> {siteCopy.educationFaqPage.eventsBadge}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-stone-50">
                  {siteCopy.educationFaqPage.eventsTitle}
                  <span className="text-gold">{siteCopy.educationFaqPage.eventsTitleAccent}</span>
                </h2>
                <p className="text-xl text-stone-400 italic font-serif">{siteCopy.educationFaqPage.eventsTagline}</p>
                <p className="text-stone-300 font-light leading-relaxed">{siteCopy.educationFaqPage.eventsBody}</p>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                  {siteCopy.educationFaqPage.eventsHighlightsLabel}
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {siteCopy.educationFaqPage.eventsBullets.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-stone-300 font-light text-sm">
                      <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="space-y-1 text-xs text-stone-400 font-light">
                  <p>
                    <strong className="font-medium text-stone-200">{siteCopy.educationFaqPage.eventsBerlinDates}</strong>{' '}
                    {siteCopy.educationFaqPage.eventsBerlinDatesValue}
                  </p>
                  <p>
                    <strong className="font-medium text-stone-200">{siteCopy.educationFaqPage.eventsNextEu}</strong>{' '}
                    {siteCopy.educationFaqPage.eventsNextEuValue}
                  </p>
                </div>
                <a 
                  href="https://www.eventim-light.com/de/a/66c5d1b85f95d22f84e14f2b" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cta-pulse inline-flex flex-shrink-0 items-center justify-center gap-3 px-8 py-4 bg-gold text-stone-900 rounded-md text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-50 transition-colors duration-300 w-full sm:w-auto"
                >
                  <Ticket className="w-4 h-4" /> {siteCopy.educationFaqPage.eventsTicketCta}
                </a>
              </div>
            </div>
            <div ref={masterclassImageRef} className="md:col-span-5 relative group order-1 md:order-2">
              <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full scale-110 opacity-50"></div>
              <ImageWithFallback 
                src={assetUrl('/media/other/masterclass-image.jpeg')} 
                alt={siteCopy.educationFaqPage.eventsImageAlt} 
                className={`tablet-scroll-image w-full max-w-sm mx-auto relative z-10 rounded-xl shadow-2xl shadow-stone-950/50 object-cover aspect-[3/4] grayscale transition-[filter] duration-1000 ${masterclassImageInView ? 'tablet-scroll-image-in-view' : ''}`}
              />
            </div>
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4 md:space-y-8">
          {faqCategories?.map((category, idx) => {
            const isOpen = activeCategoryIdx === idx;
            return (
              <motion.div 
                key={category.category} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-b border-stone-200"
              >
                <button
                  onClick={() => setActiveCategoryIdx(isOpen ? null : idx)}
                  className={`w-full flex justify-between items-center py-6 px-4 md:px-8 rounded-lg transition-colors duration-300 group ${isOpen ? 'bg-stone-100/50' : 'hover:bg-stone-100'}`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-sans font-bold tracking-[0.4em] text-gold uppercase opacity-40 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-2xl md:text-3xl tracking-tight text-stone-800 font-serif text-left">
                      {category.category}
                    </h3>
                  </div>
                  <ChevronDown className={`w-6 h-6 shrink-0 text-stone-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pb-12 pt-4 px-4 md:px-8 grid grid-cols-1 gap-y-12 pl-16 md:pl-24 pr-4 border-l-2 border-transparent">
                        {category.items?.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex flex-col gap-3">
                            <h4 className="text-lg font-medium text-stone-800 leading-tight">
                              {item.q}
                            </h4>
                            <p className="text-stone-500 text-sm font-light leading-relaxed max-w-2xl text-justify">
                              {item.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20">
          <VideoCarouselLightboxSection />
        </div>

        {showContactForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-24 p-12 bg-stone-900 text-stone-50 rounded-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-gold rounded-full blur-[100px] opacity-10 pointer-events-none" />
            <h3 className="text-3xl font-serif tracking-tight relative z-10">{siteCopy.educationFaqPage.contactSectionTitle}</h3>
            <p className="text-stone-400 font-light max-w-md relative z-10">{siteCopy.educationFaqPage.contactSectionBody}</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="on-dark-surface inline-block mt-4 px-8 py-4 bg-stone-50 text-stone-900 border border-stone-800 rounded-md text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gold hover:text-stone-50 hover:border-gold transition-colors duration-300 relative z-10"
            >
              {siteCopy.educationFaqPage.contactSectionCta}
            </button>
          </motion.div>
        )}
      </div>

      {showContactForm && <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
