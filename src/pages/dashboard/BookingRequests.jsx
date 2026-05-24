import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { createWhatsAppLink } from '../../utils/whatsapp.js';

const statusFilters = ['All', 'Pending', 'Approved', 'Rejected'];

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function mergeClientNotes(existingNotes, bookingNotes) {
  if (!bookingNotes) {
    return existingNotes || '';
  }

  if (!existingNotes) {
    return bookingNotes;
  }

  if (existingNotes.includes(bookingNotes)) {
    return existingNotes;
  }

  return `${existingNotes}\n${bookingNotes}`;
}

function BookingRequests() {
  const [business, setBusiness] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);

  const businessName = business?.business_name || 'your salon';
  const filteredRequests =
    statusFilter === 'All'
      ? requests
      : requests.filter((request) => request.status === statusFilter.toLowerCase());
  const emptyStateLabel =
    statusFilter === 'All' ? 'booking requests' : `${statusFilter.toLowerCase()} bookings`;

  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true);
      setErrorMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErrorMessage('Could not load booking requests. Please log in again.');
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

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        setErrorMessage(`Booking requests could not be loaded: ${bookingsError.message}`);
        setIsLoading(false);
        return;
      }

      setBusiness(businessData);
      setRequests(bookingsData || []);
      setIsLoading(false);
    }

    loadBookings();
  }, []);

  async function syncApprovedBookingToClient(booking) {
    const { data: existingClient, error: clientLookupError } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', business.id)
      .eq('phone', booking.phone)
      .limit(1)
      .maybeSingle();

    if (clientLookupError) {
      return clientLookupError;
    }

    if (existingClient) {
      const { error } = await supabase
        .from('clients')
        .update({
          status: 'active',
          last_visit: booking.booking_date,
          notes: mergeClientNotes(existingClient.notes, booking.notes),
        })
        .eq('id', existingClient.id);

      return error;
    }

    const { error } = await supabase.from('clients').insert({
      business_id: business.id,
      name: booking.client_name,
      phone: booking.phone,
      status: 'active',
      last_visit: booking.booking_date,
      total_spent: booking.price || 0,
      notes: booking.notes || '',
    });

    return error;
  }

  async function updateRequestStatus(requestId, status) {
    setUpdatingRequestId(requestId);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    setUpdatingRequestId(null);

    if (error) {
      setErrorMessage(`Booking request could not be updated: ${error.message}`);
      return;
    }

    if (status === 'approved') {
      const clientSyncError = await syncApprovedBookingToClient(data);

      if (clientSyncError) {
        setErrorMessage(`Booking was approved, but the client could not be saved: ${clientSyncError.message}`);
      }
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? data : request,
      ),
    );
  }

  async function handleDeleteRequest() {
    if (!requestToDelete) {
      return;
    }

    setIsDeletingRequest(true);
    setErrorMessage('');

    const { error } = await supabase.from('bookings').delete().eq('id', requestToDelete.id);

    setIsDeletingRequest(false);

    if (error) {
      setErrorMessage(`Booking request could not be deleted: ${error.message}`);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== requestToDelete.id),
    );
    setRequestToDelete(null);
  }

  function getWhatsAppMessage(request) {
    if (request.status === 'approved') {
      return `Hi ${request.client_name}, your appointment for ${request.service_name} at ${businessName} on ${formatDate(request.booking_date)} at ${request.booking_time} is confirmed. See you soon!`;
    }

    if (request.status === 'rejected') {
      return `Hi ${request.client_name}, unfortunately this time is not available for your ${request.service_name} appointment. Would you like to choose another time?`;
    }

    return `Hi ${request.client_name}, I received your appointment request for ${request.service_name} on ${formatDate(request.booking_date)} at ${request.booking_time}. I’ll confirm availability soon.`;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-950">Booking requests</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Review new appointment requests and keep clients updated by WhatsApp.
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {requests.length} total requests
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:flex-none ${
              statusFilter === filter
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'bg-neutral-50 text-neutral-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-neutral-600 shadow-sm">
          Loading booking requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-neutral-950">No booking requests yet.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-neutral-950">No {emptyStateLabel} yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const isPending = request.status === 'pending';

            return (
            <article
              key={request.id}
              className={`relative rounded-3xl border p-4 pr-14 shadow-sm transition sm:p-5 sm:pr-14 ${
                isPending
                  ? 'border-rose-200 bg-rose-50/80 shadow-rose-100/80 ring-4 ring-rose-100/60'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setRequestToDelete(request)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-xl leading-none text-neutral-400 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                aria-label="Delete booking request"
              >
                ×
              </button>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-stretch">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-neutral-950">
                      {request.client_name}
                    </h3>
                    <StatusBadge status={request.status}>{request.status}</StatusBadge>
                    {isPending ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                        New request
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-600 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="hidden text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
                        Phone
                      </p>
                      <p className="mt-1 text-neutral-800">{request.phone}</p>
                    </div>
                    <div>
                      <p className="hidden text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
                        Service
                      </p>
                      <p className="mt-1 text-neutral-800">{request.service_name}</p>
                    </div>
                    <div>
                      <p className="hidden text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
                        Date
                      </p>
                      <p className="mt-1 text-neutral-800">{formatDate(request.booking_date)}</p>
                    </div>
                    <div>
                      <p className="hidden text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
                        Time
                      </p>
                      <p className="mt-1 text-neutral-800">{request.booking_time}</p>
                    </div>
                  </div>

                  {request.notes ? (
                    <div className="mt-4 rounded-2xl bg-neutral-50 p-3 sm:mt-5 sm:p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                        Notes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-700 sm:leading-6">
                        {request.notes}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:w-72 lg:flex-col lg:self-end">
                  <Button
                    className="w-full"
                    disabled={updatingRequestId === request.id}
                    onClick={() => updateRequestStatus(request.id, 'approved')}
                  >
                    {updatingRequestId === request.id ? 'Updating...' : 'Approve'}
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    disabled={updatingRequestId === request.id}
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                  >
                    {updatingRequestId === request.id ? 'Updating...' : 'Reject'}
                  </Button>
                  <a
                    href={createWhatsAppLink(request.phone, getWhatsAppMessage(request))}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:py-2"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {requestToDelete ? (
        <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/40 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full rounded-3xl bg-white p-5 shadow-2xl shadow-neutral-950/20 sm:max-w-md sm:p-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-rose-500">
                Confirm delete
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-neutral-950">
                Delete booking request?
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-rose-50/70 p-4 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-950">{requestToDelete.client_name}</p>
              <p className="mt-1">
                {requestToDelete.service_name} on {formatDate(requestToDelete.booking_date)} at{' '}
                {requestToDelete.booking_time}
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                disabled={isDeletingRequest}
                className="w-full rounded-xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={isDeletingRequest}
                className="w-full rounded-xl bg-rose-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeletingRequest ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default BookingRequests;
