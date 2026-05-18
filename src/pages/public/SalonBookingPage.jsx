import { useState } from 'react';
import { salon, services } from '../../data/mockData.js';

const timeOptions = ['10:00', '11:30', '13:00', '15:00', '17:00'];

function SalonBookingPage() {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedService = services.find((service) => service.id === selectedServiceId);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setError('');
    setIsSubmitted(false);
  }

  function handleServiceSelect(serviceId) {
    setSelectedServiceId(serviceId);
    setError('');
    setIsSubmitted(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedServiceId || !formData.name || !formData.phone || !formData.date || !formData.time) {
      setError('Please choose a service and fill in your name, phone, date, and time.');
      setIsSubmitted(false);
      return;
    }

    setError('');
    setIsSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="bg-gradient-to-b from-rose-50 via-white to-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-rose-100 bg-white/85 p-6 shadow-sm shadow-rose-100 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-500">
                  BeautyFlow Booking
                </p>
                <h1 className="mt-3 text-4xl font-semibold text-neutral-950 sm:text-5xl">
                  {salon.name}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
                  {salon.description}
                </p>
              </div>

              <div className="rounded-2xl bg-rose-50/70 p-5 text-sm text-neutral-700">
                <p className="font-medium text-neutral-950">{salon.address}</p>
                {salon.instagram ? (
                  <a
                    href={`https://instagram.com/${salon.instagram.replace('@', '')}`}
                    className="mt-2 inline-flex text-rose-600 hover:text-rose-700"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {salon.instagram}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950">Choose a service</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceSelect(service.id)}
                    className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? 'border-rose-300 ring-4 ring-rose-100'
                        : 'border-neutral-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-950">{service.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          {service.description}
                        </p>
                      </div>
                      <span
                        className={`mt-1 h-4 w-4 rounded-full border ${
                          isSelected ? 'border-rose-500 bg-rose-500' : 'border-neutral-300'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">{service.durationMinutes} min</span>
                      <span className="font-semibold text-neutral-950">
                        {salon.currency}
                        {service.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-lg shadow-rose-100/60 sm:p-6"
          >
            <div>
              <h2 className="text-2xl font-semibold text-neutral-950">Request appointment</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {selectedService
                  ? `${selectedService.name} selected`
                  : 'Select a service and preferred time.'}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Client name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Your full name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Phone number</span>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="WhatsApp phone number"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">Date</span>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">Time</span>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  >
                    <option value="">Choose time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Notes</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  placeholder="Anything the salon should know?"
                />
              </label>
            </div>

            {error ? (
              <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            ) : null}

            {isSubmitted ? (
              <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Your appointment request was sent. The salon will confirm by WhatsApp.
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              Request Appointment
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default SalonBookingPage;
