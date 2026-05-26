import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { formatPrice } from '../../utils/currency.js';

const emptyServiceForm = {
  name: '',
  description: '',
  durationMinutes: '',
  price: '',
};

function Services() {
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [formData, setFormData] = useState(emptyServiceForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const formatBusinessPrice = (price) => formatPrice(price, business?.currency);

  useEffect(() => {
    async function loadServices() {
      setIsLoading(true);
      setErrorMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErrorMessage('Could not load your services. Please log in again.');
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

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: true });

      if (servicesError) {
        setErrorMessage(`Services could not be loaded: ${servicesError.message}`);
        setIsLoading(false);
        return;
      }

      setBusiness(businessData);
      setServices(servicesData || []);
      setIsLoading(false);
    }

    loadServices();
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setErrorMessage('');
  }

  function openAddForm() {
    setEditingServiceId(null);
    setFormData(emptyServiceForm);
    setErrorMessage('');
    setIsFormOpen(true);
  }

  function openEditForm(service) {
    setEditingServiceId(service.id);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      durationMinutes: String(service.duration_minutes || ''),
      price: String(service.price || ''),
    });
    setErrorMessage('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingServiceId(null);
    setFormData(emptyServiceForm);
  }

  async function handleSaveService(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    const servicePayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      duration_minutes: Number(formData.durationMinutes),
      price: Number(formData.price),
    };

    if (editingServiceId) {
      const { data, error } = await supabase
        .from('services')
        .update(servicePayload)
        .eq('id', editingServiceId)
        .select()
        .single();

      setIsSaving(false);

      if (error) {
        setErrorMessage(`Service could not be updated: ${error.message}`);
        return;
      }

      setServices((currentServices) =>
        currentServices.map((service) =>
          service.id === editingServiceId ? data : service,
        ),
      );
      closeForm();
      return;
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        ...servicePayload,
        business_id: business.id,
      })
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      setErrorMessage(`Service could not be added: ${error.message}`);
      return;
    }

    setServices((currentServices) => [...currentServices, data]);
    closeForm();
  }

  async function handleDeleteService(serviceId) {
    setDeletingServiceId(serviceId);
    setErrorMessage('');

    const { error } = await supabase.from('services').delete().eq('id', serviceId);

    setDeletingServiceId(null);

    if (error) {
      setErrorMessage(`Service could not be deleted: ${error.message}`);
      return;
    }

    setServices((currentServices) =>
      currentServices.filter((service) => service.id !== serviceId),
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-950">Services</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Manage the treatments clients can request from your booking page.
          </p>
        </div>
        <Button onClick={openAddForm}>Add Service</Button>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-neutral-600 shadow-sm">
          Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-neutral-950">No services yet. Add your first service.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.id}
            className="flex min-h-72 flex-col rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-950">{service.name}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{service.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Duration
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    {service.duration_minutes} min
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-rose-400">
                    Price
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    {formatBusinessPrice(service.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => openEditForm(service)}>
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteService(service.id)}
                disabled={deletingServiceId === service.id}
              >
                {deletingServiceId === service.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </article>
        ))}
        </div>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 px-4 py-6">
          <form
            onSubmit={handleSaveService}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">
                  {editingServiceId ? 'Edit service' : 'Add service'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {editingServiceId
                    ? 'Update this treatment in your services list.'
                    : 'Add a new treatment to your services list.'}
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
                <span className="text-sm font-medium text-neutral-700">Service name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Example: Classic Manicure"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Short description clients will understand"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">
                    Duration in minutes
                  </span>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    placeholder="60"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">Price</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    placeholder="160"
                  />
                </label>
              </div>
            </div>

            {errorMessage ? (
              <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={closeForm}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Service'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export default Services;
