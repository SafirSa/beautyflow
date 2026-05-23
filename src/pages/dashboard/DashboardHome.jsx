import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard.jsx';
import { supabase } from '../../lib/supabaseClient.js';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function isNeedsFollowUp(status) {
  return status === 'needs_follow_up' || status === 'needs follow-up';
}

function isCreatedAfter(record, lastSeenTimestamp) {
  if (!record.created_at) {
    return false;
  }

  const createdAt = new Date(record.created_at).getTime();
  const lastSeenAt = new Date(lastSeenTimestamp).getTime();

  if (Number.isNaN(createdAt) || Number.isNaN(lastSeenAt)) {
    return false;
  }

  return createdAt > lastSeenAt;
}

function DashboardHome() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookingLinkCopied, setIsBookingLinkCopied] = useState(false);
  const [lastSeenPendingRequestsTimestamp, setLastSeenPendingRequestsTimestamp] = useState('');

  const today = getTodayDate();
  const currentMonth = today.slice(0, 7);
  const businessName = business?.business_name || 'BeautyFlow';
  const currency = business?.currency || '₪';
  const hasServices = services.length > 0;
  const hasBookings = bookings.length > 0;
  const shouldShowOnboarding = !hasServices || !hasBookings;
  const bookingLink = business?.slug ? `${window.location.origin}/salon/${business.slug}` : '';

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setErrorMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErrorMessage('Could not load dashboard data. Please log in again.');
        setIsLoading(false);
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userData.user.id)
        .single();

      if (businessError || !businessData) {
        setErrorMessage('No business profile found. Please complete your setup.');
        setIsLoading(false);
        return;
      }

      const [bookingsResult, clientsResult, servicesResult] = await Promise.all([
        supabase.from('bookings').select('*').eq('business_id', businessData.id),
        supabase.from('clients').select('*').eq('business_id', businessData.id),
        supabase.from('services').select('*').eq('business_id', businessData.id),
      ]);

      if (bookingsResult.error) {
        setErrorMessage(`Bookings could not be loaded: ${bookingsResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (clientsResult.error) {
        setErrorMessage(`Clients could not be loaded: ${clientsResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (servicesResult.error) {
        setErrorMessage(`Services could not be loaded: ${servicesResult.error.message}`);
        setIsLoading(false);
        return;
      }

      setBusiness(businessData);
      setBookings(bookingsResult.data || []);
      setClients(clientsResult.data || []);
      setServices(servicesResult.data || []);
      setLastSeenPendingRequestsTimestamp(
        localStorage.getItem(`beautyflow_pending_requests_last_seen_${businessData.id}`) || '',
      );
      setIsLoading(false);
    }

    loadDashboardData();
  }, []);

  async function handleCopyBookingLink() {
    if (!bookingLink) {
      return;
    }

    await navigator.clipboard.writeText(bookingLink);
    setIsBookingLinkCopied(true);
  }

  function handleOpenWhatsAppShare() {
    if (!bookingLink) {
      return;
    }

    const message = `Book your appointment with ${businessName} here: ${bookingLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noreferrer');
  }

  function handlePendingRequestsCardClick() {
    if (business?.id) {
      const lastSeenAt = new Date().toISOString();
      localStorage.setItem(`beautyflow_pending_requests_last_seen_${business.id}`, lastSeenAt);
      setLastSeenPendingRequestsTimestamp(lastSeenAt);
    }

    navigate('/dashboard/bookings');
  }

  const dashboardData = useMemo(() => {
    const approvedBookings = bookings.filter((booking) => booking.status === 'approved');
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending');

    const todaysAppointments = approvedBookings.filter(
      (booking) => booking.booking_date === today,
    );

    const monthlyRevenue = approvedBookings
      .filter((booking) => String(booking.booking_date).startsWith(currentMonth))
      .reduce((total, booking) => total + Number(booking.price || 0), 0);

    const clientsNeedingFollowUp = clients.filter((client) => isNeedsFollowUp(client.status));

    const upcomingAppointments = approvedBookings
      .filter((booking) => booking.booking_date >= today)
      .sort((firstBooking, secondBooking) => {
        const firstDateTime = `${firstBooking.booking_date} ${firstBooking.booking_time}`;
        const secondDateTime = `${secondBooking.booking_date} ${secondBooking.booking_time}`;

        return firstDateTime.localeCompare(secondDateTime);
      });

    const pendingPreview = [...pendingBookings]
      .sort((firstBooking, secondBooking) =>
        String(secondBooking.created_at || '').localeCompare(String(firstBooking.created_at || '')),
      )
      .slice(0, 3);

    return {
      todaysAppointments,
      pendingBookings,
      monthlyRevenue,
      clientsNeedingFollowUp,
      upcomingAppointments,
      pendingPreview,
    };
  }, [bookings, clients, currentMonth, today]);

  const newPendingRequests = lastSeenPendingRequestsTimestamp
    ? dashboardData.pendingBookings.filter((booking) =>
        isCreatedAfter(booking, lastSeenPendingRequestsTimestamp),
      )
    : dashboardData.pendingBookings;
  const hasUnseenPendingRequests = newPendingRequests.length > 0;

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-neutral-600 shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-neutral-950">{errorMessage}</p>
      </div>
    );
  }

  return (
    <section className="space-y-5 sm:space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-stone-50 p-5 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-rose-500">
          Welcome to your salon dashboard
        </p>
        <h2 className="mt-3 text-4xl font-semibold text-neutral-950 sm:text-5xl">
          {businessName}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
          Manage your bookings, clients, and WhatsApp follow-ups from one place.
        </p>
      </div>

      {shouldShowOnboarding ? (
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm shadow-rose-100/60 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-rose-500">
                Getting started
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-neutral-950">
                Set up your salon booking flow
              </h3>
            </div>
            <p className="max-w-md text-sm leading-6 text-neutral-500">
              Complete these simple steps so clients can request appointments from your booking
              link.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            <div className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-rose-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-950">Add your first service</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Add prices and durations clients can choose from.
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-rose-700">
                  {hasServices ? 'Done' : 'Next'}
                </span>
              </div>
              <Link
                to="/dashboard/services"
                className="mt-4 inline-flex w-full justify-center rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:mt-auto sm:w-auto"
              >
                Services
              </Link>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-4">
              <div>
                <p className="font-semibold text-neutral-950">Copy your booking link</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Find your public link and keep it ready to share.
                </p>
              </div>
              <Link
                to="/dashboard/settings"
                className="mt-4 inline-flex w-full justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:mt-auto sm:w-auto"
              >
                Settings
              </Link>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-4">
              <div>
                <p className="font-semibold text-neutral-950">Share your booking link</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Add it to Instagram, WhatsApp, and client conversations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBookingLinkCopied(false);
                  setIsShareModalOpen(true);
                }}
                className="mt-4 inline-flex w-full justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:mt-auto sm:w-auto"
              >
                Share
              </button>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-950">Manage booking requests</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Approve requests and message clients from one place.
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                  {hasBookings ? 'Active' : 'Ready'}
                </span>
              </div>
              <Link
                to="/dashboard/bookings"
                className="mt-4 inline-flex w-full justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:mt-auto sm:w-auto"
              >
                Bookings
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={dashboardData.todaysAppointments.length}
          helperText="Approved for today"
        />
        <button
          type="button"
          onClick={handlePendingRequestsCardClick}
          className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
            hasUnseenPendingRequests
              ? 'border-rose-200 bg-rose-50/80 shadow-rose-100/80 ring-4 ring-rose-100/70'
              : 'border-neutral-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-neutral-500">Pending booking requests</p>
            {hasUnseenPendingRequests ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                New
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-950 sm:mt-3 sm:text-3xl">
            {dashboardData.pendingBookings.length}
          </p>
          <p className="mt-1 text-sm text-neutral-500 sm:mt-2">
            {hasUnseenPendingRequests ? 'New booking request' : 'Waiting for confirmation'}
          </p>
        </button>
        <div className="hidden sm:block">
          <StatCard
            label="Monthly revenue"
            value={`${currency}${dashboardData.monthlyRevenue}`}
            helperText="Approved bookings this month"
          />
        </div>
        <StatCard
          label="Clients needing follow-up"
          value={dashboardData.clientsNeedingFollowUp.length}
          helperText="Marked for follow-up"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-neutral-950">Upcoming appointments</h3>
              <p className="mt-1 text-sm text-neutral-500">Your next approved salon visits.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {dashboardData.upcomingAppointments.length === 0 ? (
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 text-sm text-neutral-500">
                No upcoming approved appointments yet.
              </div>
            ) : null}

            {dashboardData.upcomingAppointments.slice(0, 5).map((appointment, index) => (
              <div
                key={appointment.id}
                className={`grid gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center ${
                  index > 2 ? 'hidden sm:grid' : ''
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-950">{appointment.client_name}</p>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium capitalize text-rose-700">
                      {appointment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{appointment.service_name}</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {formatDate(appointment.booking_date)} at {appointment.booking_time}
                  </p>
                </div>

                <p className="text-lg font-semibold text-neutral-950">
                  {currency}
                  {appointment.price || 0}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h3 className="text-xl font-semibold text-neutral-950">Pending requests</h3>
            <p className="mt-1 text-sm text-neutral-500">Latest requests waiting for review.</p>
          </div>

          <div className="mt-5 space-y-3">
            {dashboardData.pendingPreview.length === 0 ? (
              <div className="rounded-2xl border border-neutral-100 p-4 text-sm text-neutral-500">
                No pending booking requests yet.
              </div>
            ) : null}

            {dashboardData.pendingPreview.map((request, index) => (
              <div
                key={request.id}
                className={`rounded-2xl border border-neutral-100 p-4 ${
                  index > 1 ? 'hidden sm:block' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{request.client_name}</p>
                    <p className="mt-1 text-sm text-neutral-600">{request.service_name}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    Pending
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-neutral-500">
                  <p>
                    {formatDate(request.booking_date)} at {request.booking_time}
                  </p>
                  <p>{request.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isShareModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/35 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full rounded-3xl bg-white p-5 shadow-2xl shadow-neutral-950/20 sm:max-w-md sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">Share your booking link</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Send clients straight to your booking page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-xl leading-none text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
                aria-label="Close share modal"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-rose-50/70 p-4 text-sm font-medium text-neutral-700 break-words">
              {bookingLink}
            </div>

            {isBookingLinkCopied ? (
              <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Copied!
              </p>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={handleCopyBookingLink}
                className="w-full rounded-xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsAppShare}
                className="w-full rounded-xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
              >
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}

export default DashboardHome;
