import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import { salon, services as mockServices } from '../../data/mockData.js';

const emptyServiceForm = {
  name: '',
  description: '',
  durationMinutes: '',
  price: '',
};

function Services() {
  const [services, setServices] = useState(mockServices);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyServiceForm);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  function handleAddService(event) {
    event.preventDefault();

    const newService = {
      id: `service-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      durationMinutes: Number(formData.durationMinutes),
      price: Number(formData.price),
    };

    setServices((currentServices) => [...currentServices, newService]);
    setFormData(emptyServiceForm);
    setIsFormOpen(false);
  }

  function handleDeleteService(serviceId) {
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
        <Button onClick={() => setIsFormOpen(true)}>Add Service</Button>
      </div>

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
                    {service.durationMinutes} min
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-rose-400">
                    Price
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    {salon.currency}
                    {service.price}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="secondary">Edit</Button>
              <Button variant="danger" onClick={() => handleDeleteService(service.id)}>
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 px-4 py-6">
          <form
            onSubmit={handleAddService}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">Add service</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Add a new treatment to your local service list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
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

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Service</Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export default Services;
