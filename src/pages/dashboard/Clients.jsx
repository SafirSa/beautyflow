import { useMemo, useState } from 'react';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { clients, salon } from '../../data/mockData.js';
import { createWhatsAppLink } from '../../utils/whatsapp.js';

const statusFilters = ['All', 'New', 'Active', 'Needs follow-up', 'Lost'];

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function getClientStatusLabel(status) {
  if (status === 'new') {
    return 'New';
  }

  if (status === 'inactive') {
    return 'Needs follow-up';
  }

  if (status === 'lost') {
    return 'Lost';
  }

  return 'Active';
}

function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const statusLabel = getClientStatusLabel(client.status);
      const matchesSearch =
        client.name.toLowerCase().includes(normalizedSearch) ||
        client.phone.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || statusLabel === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  function getFollowUpMessage(client) {
    return `Hi ${client.name}, it’s ${salon.name} 😊 Just checking in — would you like to book your next appointment?`;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-950">Clients</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Search your client list and send simple follow-up messages.
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {filteredClients.length} shown
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="block">
          <span className="sr-only">Search clients</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by client name or phone"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                statusFilter === filter
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredClients.map((client) => {
          const statusLabel = getClientStatusLabel(client.status);

          return (
            <article
              key={client.id}
              className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-neutral-950">{client.name}</h3>
                    <StatusBadge status={statusLabel.toLowerCase()}>{statusLabel}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{client.phone}</p>
                </div>

                <a
                  href={createWhatsAppLink(client.phone, getFollowUpMessage(client))}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:w-auto sm:py-2"
                >
                  WhatsApp follow-up
                </a>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:mt-5">
                <div className="rounded-2xl bg-neutral-50 p-3 sm:p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Last visit
                  </p>
                  <p className="mt-1 font-medium text-neutral-800">{formatDate(client.lastVisit)}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-3 sm:p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Total spent
                  </p>
                  <p className="mt-1 font-medium text-neutral-800">
                    {salon.currency}
                    {client.totalSpent}
                  </p>
                </div>
              </div>

              {client.notes ? (
                <div className="mt-4 rounded-2xl bg-rose-50/60 p-3 sm:p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-rose-400">
                    Notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{client.notes}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {filteredClients.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-neutral-950">No clients found</p>
          <p className="mt-2 text-sm text-neutral-500">Try a different search or status filter.</p>
        </div>
      ) : null}
    </section>
  );
}

export default Clients;
