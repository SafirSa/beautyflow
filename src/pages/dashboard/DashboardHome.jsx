import StatCard from '../../components/ui/StatCard.jsx';
import {
  bookingRequests,
  clients,
  salon,
  upcomingAppointments,
} from '../../data/mockData.js';

const today = '2026-05-17';
const currentMonth = today.slice(0, 7);

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function DashboardHome() {
  const todaysAppointments = upcomingAppointments.filter(
    (appointment) => appointment.date === today,
  );
  const pendingRequests = bookingRequests.filter((request) => request.status === 'pending');
  const monthlyRevenue = upcomingAppointments
    .filter((appointment) => appointment.date.startsWith(currentMonth))
    .reduce((total, appointment) => total + appointment.price, 0);
  const clientsNeedingFollowUp = clients.filter((client) => client.status === 'inactive');

  return (
    <section className="space-y-5 sm:space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-stone-50 p-5 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-rose-500">
          Welcome back
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-neutral-950 sm:mt-3 sm:text-3xl">
          {salon.name}
        </h2>
        <p className="mt-3 text-neutral-600">
          Here&apos;s what&apos;s happening in your salon today.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={todaysAppointments.length}
          helperText="Scheduled for today"
        />
        <StatCard
          label="Pending booking requests"
          value={pendingRequests.length}
          helperText="Waiting for confirmation"
        />
        <div className="hidden sm:block">
          <StatCard
            label="Monthly revenue"
            value={`${salon.currency}${monthlyRevenue}`}
            helperText="From upcoming appointments"
          />
        </div>
        <StatCard
          label="Clients needing follow-up"
          value={clientsNeedingFollowUp.length}
          helperText="Inactive client list"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-neutral-950">Upcoming appointments</h3>
              <p className="mt-1 text-sm text-neutral-500">Your next booked salon visits.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingAppointments.slice(0, 5).map((appointment, index) => (
              <div
                key={appointment.id}
                className={`grid gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center ${
                  index > 2 ? 'hidden sm:grid' : ''
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-950">{appointment.clientName}</p>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium capitalize text-rose-700">
                      {appointment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{appointment.serviceName}</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {formatDate(appointment.date)} at {appointment.time}
                  </p>
                </div>

                <p className="text-lg font-semibold text-neutral-950">
                  {salon.currency}
                  {appointment.price}
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
            {pendingRequests.slice(0, 3).map((request, index) => (
              <div
                key={request.id}
                className={`rounded-2xl border border-neutral-100 p-4 ${
                  index > 1 ? 'hidden sm:block' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{request.clientName}</p>
                    <p className="mt-1 text-sm text-neutral-600">{request.serviceName}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    Pending
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-neutral-500">
                  <p>
                    {formatDate(request.date)} at {request.time}
                  </p>
                  <p>{request.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardHome;
