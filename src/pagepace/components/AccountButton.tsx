import { useEffect, useState } from 'react';
import { Cloud, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { startSync, stopSync, finishFirstSync } from '../sync/cloudSync';

const GoogleG = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

export function AccountButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState<number | null>(null);

  useEffect(() => {
    let active: string | null = null;
    const handle = async (uid: string | null, mail: string | null) => {
      if (uid === active) return;
      active = uid;
      setEmail(mail);
      if (!uid) return;
      const r = await startSync(uid);
      if (r.askAbout) setAsk(r.askAbout); else if (r.reload) window.location.reload();
    };
    supabase.auth.getUser().then(({ data }) => handle(data.user?.id ?? null, data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') void handle(session?.user.id ?? null, session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (r.error) alert('Sign-in failed. Please try again.');
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    stopSync();
    window.location.reload();
  };

  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} title={email ? `Synced as ${email}` : 'Not synced — sign in to use on all devices'}
        className={email
          ? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-300 hover:bg-stone-800/60 border border-stone-800 text-xs font-semibold transition-colors'
          : 'flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 text-xs sm:text-sm font-semibold transition-colors'}>
        {email ? (<><Cloud className="w-4 h-4 text-amber-400" /><span className="hidden sm:inline max-w-[8rem] truncate">{email.split('@')[0]}</span></>)
          : (<><LogIn className="w-4 h-4" /><span>Sign in</span></>)}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-stone-800 bg-stone-950 p-3 shadow-xl z-50 text-sm">
          {email ? (
            <>
              <p className="text-stone-300">Synced across your devices</p>
              <p className="text-xs text-stone-500 break-all mb-3">{email}</p>
              <button type="button" onClick={signOut} className="w-full flex items-center justify-center gap-2 rounded-lg border border-stone-700 py-2 text-stone-300 hover:bg-stone-800">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <p className="text-stone-300 mb-1">Use PagePace on all your devices</p>
              <p className="text-xs text-stone-500 mb-3">Without an account, your books stay on this device only. Signing in moves them into your account.</p>
              <button type="button" onClick={signIn} className="w-full flex items-center justify-center gap-[10px] rounded-lg border px-3 py-2 font-medium" style={{ background: '#131314', borderColor: '#8E918F', color: '#E3E3E3' }}>
                <GoogleG /> Continue with Google
              </button>
            </>
          )}
        </div>
      )}
      {ask !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-950 p-5 text-sm">
            <p className="font-semibold text-stone-100 mb-1">Add books from this device?</p>
            <p className="text-stone-400 mb-4">This device has {ask} {ask === 1 ? 'book' : 'books'} that your account doesn't have yet. Books already in your account are never doubled.</p>
            <div className="flex gap-2">
              <button type="button" onClick={async () => { setAsk(null); await finishFirstSync(false); window.location.reload(); }} className="flex-1 rounded-lg border border-stone-700 py-2 text-stone-300 hover:bg-stone-800">Use account only</button>
              <button type="button" onClick={async () => { setAsk(null); await finishFirstSync(true); window.location.reload(); }} className="flex-1 rounded-lg bg-amber-500 py-2 font-semibold text-stone-950 hover:bg-amber-400">Add {ask}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
