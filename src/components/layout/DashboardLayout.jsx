import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/bookings': 'Booking Requests',
  '/dashboard/clients': 'Clients',
  '/dashboard/services': 'Services',
  '/dashboard/messages': 'Messages',
  '/dashboard/settings': 'Settings',
};

const mobileNavigationItems = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Bookings', to: '/dashboard/bookings' },
  { label: 'Clients', to: '/dashboard/clients' },
  { label: 'Services', to: '/dashboard/services' },
];

const moreNavigationItems = [
  { label: 'Messages', to: '/dashboard/messages' },
  { label: 'Settings', to: '/dashboard/settings' },
];

const CHECKOUT_URL =
  'https://beautyflow.lemonsqueezy.com/checkout/buy/22219d50-12a1-4978-b69f-4410a3035efc';

function canAccessDashboard(businessProfile) {
  if (businessProfile?.subscription_status === 'active') {
    return true;
  }

  if (businessProfile?.subscription_status !== 'trialing') {
    return false;
  }

  const trialEndsAt = new Date(businessProfile.trial_ends_at).getTime();

  if (Number.isNaN(trialEndsAt)) {
    return false;
  }

  return trialEndsAt > Date.now();
}

function getTrialInfo(businessProfile) {
  if (businessProfile?.subscription_status !== 'trialing') {
    return null;
  }

  const trialEndsAt = new Date(businessProfile.trial_ends_at);
  const trialEndsTime = trialEndsAt.getTime();

  if (Number.isNaN(trialEndsTime) || trialEndsTime <= Date.now()) {
    return null;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(1, Math.ceil((trialEndsTime - Date.now()) / millisecondsPerDay));
  const formattedEndDate = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(trialEndsAt);

  return {
    daysLeft,
    formattedEndDate,
  };
}

function DashboardLayout() {
  const { pathname } = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
  const [businessError, setBusinessError] = useState('');
  const title = pageTitles[pathname] || 'Dashboard';
  const isMoreActive = moreNavigationItems.some((item) => item.to === pathname);
  const trialInfo = getTrialInfo(businessProfile);

  useEffect(() => {
    async function loadBusinessProfile() {
      setIsLoadingBusiness(true);
      setBusinessError('');

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setBusinessError('No business profile found. Please complete your setup.');
        setIsLoadingBusiness(false);
        return;
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userData.user.id)
        .single();

      if (error || !data) {
        setBusinessProfile(null);
        setBusinessError('No business profile found. Please complete your setup.');
        setIsLoadingBusiness(false);
        return;
      }

      setBusinessProfile(data);
      setIsLoadingBusiness(false);
    }

    loadBusinessProfile();
  }, []);

  if (businessProfile && !canAccessDashboard(businessProfile)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-stone-50 px-4 py-10 text-neutral-950">
        <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-xl shadow-rose-100/70 sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-sm font-bold text-rose-700">
            BF
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-neutral-950">
            Your free trial has ended
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            To continue using BeautyFlow, choose a plan and activate your subscription.
          </p>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full justify-center rounded-xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Subscribe now
          </a>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="lg:flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-4 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-sm font-bold text-rose-700">
              BF
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-950">BeautyFlow</p>
              <p className="text-xs text-neutral-500">Salon workspace</p>
            </div>
          </div>

          <Topbar title={title} businessName={businessProfile?.business_name || 'BeautyFlow'} />

          <main className="px-3 pb-28 pt-4 sm:px-6 sm:py-6 lg:px-8 lg:pb-6">
            <div className="lg:rounded-2xl lg:border lg:border-neutral-200 lg:bg-white lg:p-6 lg:shadow-sm">
              {trialInfo ? (
                <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-neutral-700 shadow-sm shadow-rose-100/60">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-rose-700">
                      Free trial: {trialInfo.daysLeft} day{trialInfo.daysLeft === 1 ? '' : 's'} left
                    </p>
                    <p className="text-xs font-medium text-neutral-500">
                      Trial ends {trialInfo.formattedEndDate}
                    </p>
                  </div>
                </div>
              ) : null}

              {isLoadingBusiness ? (
                <div className="flex min-h-64 items-center justify-center rounded-3xl bg-white text-neutral-600">
                  Loading...
                </div>
              ) : businessError ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
                  <p className="font-medium text-neutral-950">{businessError}</p>
                </div>
              ) : (
                <Outlet context={{ businessProfile }} />
              )}
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-3 pb-3 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setIsMoreOpen(false)}
              className={({ isActive }) =>
                `rounded-2xl px-2 py-3 text-center text-xs font-medium transition ${
                  isActive
                    ? 'bg-rose-100 text-rose-700'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="group relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
              className={`w-full rounded-2xl px-2 py-3 text-center text-xs font-medium transition ${
                isMoreActive
                  ? 'bg-rose-100 text-rose-700'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950'
              }`}
            >
              More
            </button>
            <div
              className={`absolute bottom-full right-0 mb-2 w-40 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg transition ${
                isMoreOpen ? 'visible opacity-100' : 'invisible opacity-0'
              }`}
            >
              {moreNavigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-3 text-sm font-medium ${
                      isActive ? 'bg-rose-50 text-rose-700' : 'text-neutral-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default DashboardLayout;
