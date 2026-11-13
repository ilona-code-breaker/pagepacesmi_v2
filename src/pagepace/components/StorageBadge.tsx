import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function StorageBadge() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800 flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${signedIn ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
      {signedIn
        ? 'Synced to your account • Available on all your devices'
        : 'Guest mode • Saved on this device • Sign in to sync across devices'}
    </span>
  );
}
