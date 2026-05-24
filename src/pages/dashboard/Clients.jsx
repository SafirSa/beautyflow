import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { createWhatsAppLink } from '../../utils/whatsapp.js';

const statusFilters = ['All', 'New'];

const emptyClientForm = {
  name: '',
  phone: '',
  email: '',
  status: 'new',
  last_visit: '',
  total_spent: '',
  notes: '',
};

function formatDate(date) {
  if (!date) {
    return 'No visits yet';
  }

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

  if (status === 'needs_follow_up' || status === 'needs follow-up' || status === 'inactive') {
    return 'Needs follow-up';
  }

  if (status === 'lost') {
    return 'Lost';
  }

  return 'Active';
}

function Clients() {
  const [business, setBusiness] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [formData, setFormData] = useState(emptyClientForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const businessName = business?.business_name || 'your salon';
  const currency = business?.currency || '₪';

  useEffect(() => {
    async function loadClients() {
      setIsLoading(true);
      setErrorMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErrorMessage('Could not load your clients. Please log in again.');
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

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (clientsError) {
        setErrorMessage(`Clients could not be loaded: ${clientsError.message}`);
        setIsLoading(false);
        return;
      }

      setBusiness(businessData);
      setClients(clientsData || []);
      setIsLoading(false);
    }

    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const statusLabel = getClientStatusLabel(client.status);
      const matchesSearch =
        client.name.toLowerCase().includes(normalizedSearch) ||
        String(client.phone || '').toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || statusLabel === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setErrorMessage('');
  }

  function openAddForm() {
    setEditingClientId(null);
    setFormData(emptyClientForm);
    setErrorMessage('');
    setIsFormOpen(true);
  }

  function openEditForm(client) {
    setEditingClientId(client.id);
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      status: client.status || 'active',
      last_visit: client.last_visit || '',
      total_spent: String(client.total_spent || ''),
      notes: client.notes || '',
    });
    setErrorMessage('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingClientId(null);
    setFormData(emptyClientForm);
  }

  async function handleSaveClient(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    const clientPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      status: formData.status,
      last_visit: formData.last_visit || null,
      total_spent: Number(formData.total_spent || 0),
      notes: formData.notes.trim(),
    };

    if (editingClientId) {
      const { data, error } = await supabase
        .from('clients')
        .update(clientPayload)
        .eq('id', editingClientId)
        .select()
        .single();

      setIsSaving(false);

      if (error) {
        setErrorMessage(`Client could not be updated: ${error.message}`);
        return;
      }

      setClients((currentClients) =>
        currentClients.map((client) => (client.id === editingClientId ? data : client)),
      );
      closeForm();
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientPayload,
        business_id: business.id,
      })
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      setErrorMessage(`Client could not be added: ${error.message}`);
      return;
    }

    setClients((currentClients) => [data, ...currentClients]);
    closeForm();
  }

  async function handleDeleteClient(clientId) {
    setDeletingClientId(clientId);
    setErrorMessage('');

    const { error } = await supabase.from('clients').delete().eq('id', clientId);

    setDeletingClientId(null);

    if (error) {
      setErrorMessage(`Client could not be deleted: ${error.message}`);
      return;
    }

    setClients((currentClients) => currentClients.filter((client) => client.id !== clientId));
  }

  function getFollowUpMessage(client) {
    return `Hi ${client.name}, it’s ${businessName} 😊 Just checking in — would you like to book your next appointment?`;
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {filteredClients.length} shown
          </div>
          <Button onClick={openAddForm}>Add Client</Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

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

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-neutral-600 shadow-sm">
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-neutral-950">No clients yet. Add your first client.</p>
        </div>
      ) : (
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
                    {client.email ? (
                      <p className="mt-1 text-sm text-neutral-500">{client.email}</p>
                    ) : null}
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
                    <p className="mt-1 font-medium text-neutral-800">
                      {formatDate(client.last_visit)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-3 sm:p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                      Total spent
                    </p>
                    <p className="mt-1 font-medium text-neutral-800">
                      {currency}
                      {client.total_spent || 0}
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

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => openEditForm(client)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteClient(client.id)}
                    disabled={deletingClientId === client.id}
                  >
                    {deletingClientId === client.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!isLoading && clients.length > 0 && filteredClients.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-neutral-950">No clients found</p>
          <p className="mt-2 text-sm text-neutral-500">Try a different search or status filter.</p>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 px-4 py-6">
          <form
            onSubmit={handleSaveClient}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">
                  {editingClientId ? 'Edit client' : 'Add client'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {editingClientId
                    ? 'Update this client profile.'
                    : 'Add a new client to your salon list.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Client name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Phone</span>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="0501234567"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="client@email.com"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">Status</span>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  >
                    <option value="new">New</option>
                    <option value="active">Active</option>
                    <option value="needs_follow_up">Needs follow-up</option>
                    <option value="lost">Lost</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">Last visit</span>
                  <input
                    type="date"
                    name="last_visit"
                    value={formData.last_visit}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Total spent</span>
                <input
                  type="number"
                  name="total_spent"
                  value={formData.total_spent}
                  onChange={handleInputChange}
                  min="0"
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="0"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Notes</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Preferences, reminders, or visit notes"
                />
              </label>
            </div>

            {errorMessage ? (
              <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Client'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

    </section>
  );
}

export default Clients;
