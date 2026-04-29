import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vh] bg-gold/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vh] bg-stone-900/40 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center gap-10"
      >
        <div className="space-y-3">
          <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-gold">theSchneider.hair</p>
          <h1 className="text-5xl font-serif text-stone-50 tracking-tight">Admin Portal</h1>
          <p className="text-xs text-stone-500 tracking-[0.25em] uppercase font-medium">
            Content management &amp; site editor
          </p>
        </div>

        <div className="h-px w-16 bg-stone-800" />

        <button
          type="button"
          onClick={() => navigate('/artist-login')}
          className="group flex items-center gap-3 bg-stone-50 text-stone-900 px-8 py-4 rounded-2xl text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-gold hover:text-stone-50 transition-all duration-500 shadow-lg shadow-black/30"
        >
          Go to Admin Site
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </motion.div>

      <div className="fixed bottom-3 right-3 z-50 rounded-md bg-stone-900/80 border border-stone-800 px-2 py-1 text-[9px] font-mono uppercase tracking-wide text-stone-500">
        {import.meta.env.MODE}
      </div>
    </div>
  );
}
