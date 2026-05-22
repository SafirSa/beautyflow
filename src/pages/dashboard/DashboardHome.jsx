import { useEffect, useMemo, useState } from 'react';
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

function DashboardHome() {
  const [business, setBusiness] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const today = getTodayDate();
  const currentMonth = today.slice(0, 7);
  const businessName = business?.business_name || 'BeautyFlow';
  const currency = business?.currency || '₪';

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
      setIsLoading(false);
    }

    loadDashboardData();
  }, []);

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

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={dashboardData.todaysAppointments.length}
          helperText="Approved for today"
        />
        <StatCard
          label="Pending booking requests"
          value={dashboardData.pendingBookings.length}
          helperText="Waiting for confirmation"
        />
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

      {services.length === 0 && bookings.length === 0 && clients.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Your dashboard will fill up as you add services, receive booking requests, and save
          clients.
        </div>
      ) : null}
    </section>
  );
}

export default DashboardHome;
