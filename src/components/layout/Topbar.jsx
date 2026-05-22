import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';

function Topbar({ title, businessName }) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    navigate('/login');
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div>
          <p className="bg-gradient-to-r from-rose-600 via-pink-500 to-amber-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
            {businessName}
          </p>
          <h1 className="mt-1 text-sm font-medium text-neutral-500 sm:text-base">{title}</h1>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-neutral-950 sm:px-4"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}

export default Topbar;
