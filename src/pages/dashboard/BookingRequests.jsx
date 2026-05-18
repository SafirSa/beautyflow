import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { bookingRequests, salon } from '../../data/mockData.js';
import { createWhatsAppLink } from '../../utils/whatsapp.js';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function BookingRequests() {
  const [requests, setRequests] = useState(bookingRequests);

  function updateRequestStatus(requestId, status) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request,
      ),
    );
  }

  function getWhatsAppMessage(request) {
    if (request.status === 'approved') {
      return `Hi ${request.clientName}, your appointment for ${request.serviceName} at ${salon.name} on ${formatDate(request.date)} at ${request.time} is confirmed. See you soon!`;
    }

    if (request.status === 'rejected') {
      return `Hi ${request.clientName}, unfortunately this time is not available for your ${request.serviceName} appointment. Would you like to choose another time?`;
    }

    return `Hi ${request.clientName}, I received your appointment request for ${request.serviceName} on ${formatDate(request.date)} at ${request.time}. I’ll confirm availability soon.`;
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

      <div className="grid gap-4">
        {requests.map((request) => (
          <article
            key={request.id}
            className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-neutral-950">{request.clientName}</h3>
                  <StatusBadge status={request.status}>{request.status}</StatusBadge>
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
                    <p className="mt-1 text-neutral-800">{request.serviceName}</p>
                  </div>
                  <div>
                    <p className="hidden text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
                      Date
                    </p>
                    <p className="mt-1 text-neutral-800">{formatDate(request.date)}</p>
                  </div>
                  <div>
                    <p className="hidden text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
                      Time
                    </p>
                    <p className="mt-1 text-neutral-800">{request.time}</p>
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

              <div className="flex flex-col gap-2 sm:flex-row lg:w-72 lg:flex-col">
                <Button
                  className="w-full"
                  onClick={() => updateRequestStatus(request.id, 'approved')}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => updateRequestStatus(request.id, 'rejected')}
                >
                  Reject
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
        ))}
      </div>
    </section>
  );
}

export default BookingRequests;
