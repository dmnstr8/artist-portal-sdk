import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { CONTENT_DATA_SOURCE_MODE_EVENT, getContentDataSourceMode, getPortalFirebase } from '../index';
import { probeAdminCloudHealthAllSourcesLive } from './cloudHealthProbe';

const copy = {
  databaseSyncing: 'Syncing...',
  databaseCloudIntegrated: 'Cloud Integrated',
  databaseLocalFallback: 'Local Fallback',
  databaseNotAllCloud: 'Not all on cloud',
  title: 'Vault Access',
  subtitle: 'Artist Authentication Portal',
  identityLabel: 'Identity',
  emailPlaceholder: 'salon@email.com',
  secretLabel: 'Secret',
  forgotPassword: 'Forgot?',
  passwordPlaceholder: '••••••••',
  submit: 'Open Portal',
  returnHome: 'Back to home',
  errorInvalidCredentials: 'Invalid identity credentials. Please authenticate again.',
  errorEnterEmailForReset: 'Please enter your identity email first to receive a reset link.',
  infoResetSent: 'A recovery link has been shared to your inbox.',
  errorResetFailed: 'Failed to send recovery link. Verify the email identity.',
} as const;

function DatabaseStatus() {
  const [phase, setPhase] = useState<'checking' | 'ready'>('checking');
  const [allSourcesLive, setAllSourcesLive] = useState(false);

  const runProbe = useCallback(async () => {
    setPhase('checking');
    if (getContentDataSourceMode() !== 'firebase') {
      setAllSourcesLive(false);
      setPhase('ready');
      return;
    }
    const live = await probeAdminCloudHealthAllSourcesLive();
    setAllSourcesLive(live);
    setPhase('ready');
  }, []);

  useEffect(() => {
    void runProbe();
    const onMode = () => void runProbe();
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onMode);
    return () => window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onMode);
  }, [runProbe]);

  const label =
    phase === 'checking'
      ? copy.databaseSyncing
      : allSourcesLive
        ? copy.databaseCloudIntegrated
        : getContentDataSourceMode() === 'local'
          ? copy.databaseLocalFallback
          : copy.databaseNotAllCloud;

  const dotClass =
    phase === 'checking'
      ? 'bg-stone-500 animate-pulse'
      : allSourcesLive
        ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.75)]'
        : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.55)]';

  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-stone-300">{label}</span>
    </div>
  );
}

export default function AdminLoginPage({ portalPath = '/artist-portal' }: { portalPath?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const { auth } = getPortalFirebase();
      await signInWithEmailAndPassword(auth, email, password);
      navigate(portalPath);
    } catch (err: unknown) {
      setError(copy.errorInvalidCredentials);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError(copy.errorEnterEmailForReset); return; }
    setLoading(true);
    setError('');
    try {
      const { auth } = getPortalFirebase();
      await sendPasswordResetEmail(auth, email);
      setInfo(copy.infoResetSent);
    } catch (err: unknown) {
      setError(copy.errorResetFailed);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[100vw] h-[100vh] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[100vh] bg-stone-200/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={loginCardRef}
        className="w-full max-w-md bg-white p-12 rounded-3xl shadow-2xl shadow-stone-900/5 relative z-10 border border-white"
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-stone-900 rounded-full border border-stone-800 shadow-xl">
          <DatabaseStatus />
        </div>

        <div className="text-center space-y-4 mb-12">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto text-gold shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-serif tracking-tight text-stone-900">{copy.title}</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold mt-2">{copy.subtitle}</p>
          </div>
        </div>

        {error ? (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </motion.div>
        ) : null}

        {info ? (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-stone-900 text-gold rounded-xl flex items-center gap-3 border border-stone-800">
            <Mail className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">{info}</p>
          </motion.div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="group space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">{copy.identityLabel}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-gold transition-colors" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:bg-white transition-all outline-none"
                placeholder={copy.emailPlaceholder} />
            </div>
          </div>

          <div className="group space-y-2">
            <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{copy.secretLabel}</label>
              <button type="button" onClick={handleForgotPassword}
                className="text-[9px] uppercase tracking-widest text-stone-300 font-bold hover:text-gold transition-colors">
                {copy.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-gold transition-colors" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:bg-white transition-all outline-none"
                placeholder={copy.passwordPlaceholder} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-stone-900 text-white rounded-2xl py-5 text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-gold hover:text-stone-900 transition-all duration-500 flex items-center justify-center group disabled:opacity-50">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <>{copy.submit}<ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-2 transition-transform" /></>}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button type="button" onClick={() => navigate('/')}
            className="text-[9px] uppercase tracking-widest text-stone-400 font-bold hover:text-stone-900 transition-colors">
            {copy.returnHome}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
