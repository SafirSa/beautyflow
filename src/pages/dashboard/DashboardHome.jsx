import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { createWhatsAppLink, normalizePhoneForWhatsApp } from '../../utils/whatsapp.js';

function getTodayDate() {
  return formatDateValue(new Date());
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function formatBookingTime(time) {
  return String(time || '').slice(0, 5);
}

function normalizePhoneForMatch(phone) {
  if (!phone) {
    return '';
  }

  return normalizePhoneForWhatsApp(phone);
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getSunday(date) {
  const startDate = new Date(date);

  startDate.setDate(startDate.getDate() - startDate.getDay());
  startDate.setHours(0, 0, 0, 0);

  return startDate;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatWeekLabel(startDate) {
  const endDate = addDays(startDate, 6);
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
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
  const [isTodayAppointmentsModalOpen, setIsTodayAppointmentsModalOpen] = useState(false);
  const [lastSeenPendingRequestsTimestamp, setLastSeenPendingRequestsTimestamp] = useState('');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getSunday(new Date()));
  const [selectedCalendarAppointment, setSelectedCalendarAppointment] = useState(null);

  const today = getTodayDate();
  const currentMonth = today.slice(0, 7);
  const businessName = business?.business_name || 'BeautyFlow';
  const currency = business?.currency || '₪';
  const hasServices = services.length > 0;
  const hasBookings = bookings.length > 0;
  const bookingLink = business?.slug ? `${window.location.origin}/salon/${business.slug}` : '';
  const hasBookingLink = Boolean(bookingLink);
  const existingClientPhoneNumbers = useMemo(
    () =>
      new Set(
        clients
          .map((client) => normalizePhoneForMatch(client.phone))
          .filter(Boolean),
      ),
    [clients],
  );

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

  function handleViewBookingPage() {
    if (!bookingLink) {
      return;
    }

    window.open(bookingLink, '_blank', 'noreferrer');
  }

  function handlePendingRequestsCardClick() {
    if (business?.id) {
      const lastSeenAt = new Date().toISOString();
      localStorage.setItem(`beautyflow_pending_requests_last_seen_${business.id}`, lastSeenAt);
      setLastSeenPendingRequestsTimestamp(lastSeenAt);
    }

    navigate('/dashboard/bookings');
  }

  function getTodayAppointmentMessage(appointment) {
    return `Hi ${appointment.client_name}, just confirming your appointment today at ${formatBookingTime(appointment.booking_time)} for ${appointment.service_name}. See you soon!`;
  }

  function getCalendarAppointmentMessage(appointment) {
    return `Hi ${appointment.client_name}, just confirming your appointment on ${formatDate(appointment.booking_date)} at ${formatBookingTime(appointment.booking_time)} for ${appointment.service_name}. See you soon!`;
  }

  const dashboardData = useMemo(() => {
    const approvedBookings = bookings.filter((booking) => booking.status === 'approved');
    const approvedBookingsForExistingClients = approvedBookings.filter((booking) =>
      existingClientPhoneNumbers.has(normalizePhoneForMatch(booking.phone)),
    );
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending');

    const todaysAppointments = approvedBookingsForExistingClients.filter(
      (booking) => booking.booking_date === today,
    );

    const monthlyRevenue = approvedBookings
      .filter((booking) => String(booking.booking_date).startsWith(currentMonth))
      .reduce((total, booking) => total + Number(booking.price || 0), 0);

    const pendingPreview = [...pendingBookings]
      .sort((firstBooking, secondBooking) =>
        String(secondBooking.created_at || '').localeCompare(String(firstBooking.created_at || '')),
      )
      .slice(0, 3);

    return {
      todaysAppointments,
      pendingBookings,
      monthlyRevenue,
      pendingPreview,
    };
  }, [bookings, currentMonth, existingClientPhoneNumbers, today]);

  const weeklyCalendarDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(selectedWeekStart, index);
      const dateValue = formatDateValue(date);
      const appointments = bookings
        .filter(
          (booking) =>
            booking.status === 'approved' &&
            booking.booking_date === dateValue &&
            existingClientPhoneNumbers.has(normalizePhoneForMatch(booking.phone)),
        )
        .sort((firstBooking, secondBooking) =>
          String(firstBooking.booking_time || '').localeCompare(
            String(secondBooking.booking_time || ''),
          ),
        );

      return {
        date,
        dateValue,
        appointments,
      };
    });
  }, [bookings, existingClientPhoneNumbers, selectedWeekStart]);

  const weekLabel = formatWeekLabel(selectedWeekStart);

  const newPendingRequests = lastSeenPendingRequestsTimestamp
    ? dashboardData.pendingBookings.filter((booking) =>
        isCreatedAfter(booking, lastSeenPendingRequestsTimestamp),
      )
    : dashboardData.pendingBookings;
  const hasUnseenPendingRequests = newPendingRequests.length > 0;
  const pendingRequestsHelperText =
    newPendingRequests.length === 0
      ? 'Waiting for confirmation'
      : `${newPendingRequests.length} new booking request${
          newPendingRequests.length === 1 ? '' : 's'
        }`;

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
        {hasBookingLink ? (
          <button
            type="button"
            onClick={handleViewBookingPage}
            className="mt-5 inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm shadow-rose-100/70 transition hover:bg-rose-50"
          >
            Booking Page
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 inline-flex cursor-not-allowed rounded-full border border-neutral-200 bg-white/70 px-4 py-2 text-sm font-semibold text-neutral-400"
          >
            Booking Page
          </button>
        )}
      </div>

      {!hasServices ? (
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                <p className="font-semibold text-neutral-950">Complete your business settings</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Add your contact details, address, Instagram, and notification email.
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
                className="mt-4 inline-flex w-full justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:mt-auto"
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

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => setIsTodayAppointmentsModalOpen(true)}
          className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
        >
          <p className="text-sm font-medium text-neutral-500">Today's appointments</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950 sm:mt-3 sm:text-3xl">
            {dashboardData.todaysAppointments.length}
          </p>
          <p className="mt-1 text-sm text-neutral-500 sm:mt-2">Approved for today</p>
        </button>
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
            {pendingRequestsHelperText}
          </p>
        </button>
        <div className="hidden sm:block">
          <StatCard
            label="Monthly revenue"
            value={`${currency}${dashboardData.monthlyRevenue}`}
            helperText="Approved bookings this month"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-neutral-950">Weekly calendar</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Approved appointments for the selected week.
              </p>
            </div>
            <div className="flex items-center justify-between gap-1 rounded-full bg-neutral-50 p-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setSelectedWeekStart((weekStart) => addDays(weekStart, -7))}
                className="rounded-full px-2 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-white hover:shadow-sm sm:px-3 sm:text-sm"
              >
                Previous
              </button>
              <p className="px-1 text-center text-xs font-semibold text-neutral-950 sm:px-2 sm:text-sm">
                {weekLabel}
              </p>
              <button
                type="button"
                onClick={() => setSelectedWeekStart((weekStart) => addDays(weekStart, 7))}
                className="rounded-full px-2 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-white hover:shadow-sm sm:px-3 sm:text-sm"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 lg:hidden">
            {weeklyCalendarDays.map((day) => {
              const isToday = day.dateValue === today;

              return (
                <div
                  key={day.dateValue}
                  className={`flex min-h-36 min-w-0 flex-col rounded-xl border p-1 ${
                    isToday
                      ? 'border-rose-200 bg-rose-50/70 shadow-sm shadow-rose-100/80'
                      : 'border-neutral-100 bg-neutral-50/60'
                  }`}
                >
                  <div>
                    <p className="truncate text-[10px] font-semibold leading-4 text-neutral-950">
                      {new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day.date)}
                    </p>
                    <p className="text-[10px] leading-4 text-neutral-500">
                      {day.date.getDate()}
                    </p>
                  </div>

                  <div className="mt-1 flex-1 space-y-1 overflow-y-auto">
                    {day.appointments.length === 0 ? (
                      <p className="rounded-lg bg-white/70 px-1 py-1 text-[9px] font-medium leading-3 text-neutral-400">
                        No appts
                      </p>
                    ) : null}

                    {day.appointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => setSelectedCalendarAppointment(appointment)}
                        className="w-full rounded-lg border border-rose-100 bg-white p-1 text-left shadow-sm shadow-rose-50 transition hover:border-rose-200"
                      >
                        <p className="text-[10px] font-semibold leading-4 text-rose-700">
                          {formatBookingTime(appointment.booking_time)}
                        </p>
                        <p className="truncate text-[10px] font-semibold leading-4 text-neutral-950">
                          {appointment.client_name}
                        </p>
                        <p className="truncate text-[9px] leading-3 text-neutral-500">
                          {appointment.service_name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 hidden gap-3 lg:grid lg:grid-cols-7">
            {weeklyCalendarDays.map((day) => {
              const isToday = day.dateValue === today;

              return (
                <div
                  key={day.dateValue}
                  className={`flex min-h-52 flex-col rounded-2xl border p-3 lg:min-h-[24rem] ${
                    isToday
                      ? 'border-rose-200 bg-rose-50/70 shadow-sm shadow-rose-100/80'
                      : 'border-neutral-100 bg-neutral-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 lg:block">
                    <p className="text-sm font-semibold text-neutral-950">
                      {new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day.date)}
                    </p>
                    <p className="text-sm text-neutral-500">{formatDate(day.dateValue)}</p>
                  </div>

                  <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                    {day.appointments.length === 0 ? (
                      <p className="rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-neutral-400">
                        No appointments
                      </p>
                    ) : null}

                    {day.appointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => setSelectedCalendarAppointment(appointment)}
                        className="w-full rounded-xl border border-rose-100 bg-white p-3 text-left shadow-sm shadow-rose-50 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                      >
                        <p className="text-sm font-semibold text-rose-700">
                          {formatBookingTime(appointment.booking_time)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {appointment.client_name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          {appointment.service_name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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

      {selectedCalendarAppointment ? (
        <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/35 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl shadow-neutral-950/20 sm:max-w-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">Appointment details</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Approved appointment from the weekly calendar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarAppointment(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-xl leading-none text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
                aria-label="Close appointment details modal"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Client name
                </p>
                <p className="mt-1 font-semibold text-neutral-950">
                  {selectedCalendarAppointment.client_name}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Phone
                </p>
                <p className="mt-1 font-semibold text-neutral-950">
                  {selectedCalendarAppointment.phone}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Service
                </p>
                <p className="mt-1 font-semibold text-neutral-950">
                  {selectedCalendarAppointment.service_name}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Date
                </p>
                <p className="mt-1 font-semibold text-neutral-950">
                  {formatDate(selectedCalendarAppointment.booking_date)}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Time
                </p>
                <p className="mt-1 font-semibold text-neutral-950">
                  {formatBookingTime(selectedCalendarAppointment.booking_time)}
                </p>
              </div>
              {selectedCalendarAppointment.price ? (
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Price
                  </p>
                  <p className="mt-1 font-semibold text-neutral-950">
                    {currency}
                    {selectedCalendarAppointment.price}
                  </p>
                </div>
              ) : null}
            </div>

            {selectedCalendarAppointment.notes ? (
              <div className="mt-3 rounded-2xl bg-rose-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-rose-400">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  {selectedCalendarAppointment.notes}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={createWhatsAppLink(
                  selectedCalendarAppointment.phone,
                  getCalendarAppointmentMessage(selectedCalendarAppointment),
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-xl bg-neutral-950 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setSelectedCalendarAppointment(null)}
                className="w-full rounded-xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isTodayAppointmentsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/35 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl shadow-neutral-950/20 sm:max-w-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">Today’s Appointments</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Approved visits scheduled for today.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTodayAppointmentsModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-xl leading-none text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
                aria-label="Close today appointments modal"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {dashboardData.todaysAppointments.length === 0 ? (
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-5 text-sm text-neutral-500">
                  No appointments scheduled for today.
                </div>
              ) : null}

              {dashboardData.todaysAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-neutral-950">
                        {appointment.client_name}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">{appointment.phone}</p>
                    </div>
                    <p className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                      {formatBookingTime(appointment.booking_time)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                        Service
                      </p>
                      <p className="mt-1 font-medium text-neutral-800">
                        {appointment.service_name}
                      </p>
                    </div>
                    {appointment.price ? (
                      <div className="rounded-2xl bg-neutral-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                          Price
                        </p>
                        <p className="mt-1 font-medium text-neutral-800">
                          {currency}
                          {appointment.price}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {appointment.notes ? (
                    <div className="mt-3 rounded-2xl bg-rose-50/70 p-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-rose-400">
                        Notes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-700">
                        {appointment.notes}
                      </p>
                    </div>
                  ) : null}

                  <a
                    href={createWhatsAppLink(
                      appointment.phone,
                      getTodayAppointmentMessage(appointment),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block w-full rounded-xl border border-neutral-200 px-5 py-4 text-center text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                  >
                    WhatsApp
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}

export default DashboardHome;
