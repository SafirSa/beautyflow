import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';

const timeOptions = ['10:00', '11:30', '13:00', '15:00', '17:00'];

function SalonBookingPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const currency = business?.currency || '₪';

  useEffect(() => {
    async function loadSalon() {
      setIsLoading(true);
      setError('');
      setNotFound(false);

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (businessError || !businessData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: true });

      if (servicesError) {
        setError(`Services could not be loaded: ${servicesError.message}`);
        setIsLoading(false);
        return;
      }

      setBusiness(businessData);
      setServices(servicesData || []);
      setIsLoading(false);
    }

    loadSalon();
  }, [slug]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setError('');
    setIsSubmitted(false);
    setSubmittedBooking(null);
  }

  function handleServiceSelect(serviceId) {
    setSelectedServiceId(serviceId);
    setError('');
    setIsSubmitted(false);
    setSubmittedBooking(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedServiceId || !formData.name || !formData.phone || !formData.date || !formData.time) {
      setError('Please choose a service and fill in your name, phone, date, and time.');
      setIsSubmitted(false);
      return;
    }

    setError('');
    setIsSubmitted(false);
    setIsReviewModalOpen(true);
  }

  async function handleConfirmRequest() {
    if (!selectedService || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setIsSubmitted(false);

    const bookingSnapshot = {
      serviceName: selectedService.name,
      clientName: formData.name,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
    };

    const { error: bookingError } = await supabase.from('bookings').insert({
      business_id: business.id,
      client_name: formData.name,
      phone: formData.phone,
      service_id: selectedService.id,
      service_name: selectedService.name,
      booking_date: formData.date,
      booking_time: formData.time,
      status: 'pending',
      notes: formData.notes,
      price: selectedService.price,
    });

    if (bookingError) {
      setError(`Appointment request could not be sent: ${bookingError.message}`);
      setIsSubmitting(false);
      setIsReviewModalOpen(false);
      return;
    }

    if (business.notification_email) {
      const { error: notificationError } = await supabase.functions.invoke(
        'send-booking-notification',
        {
          body: {
            to: business.notification_email,
            businessName: business.business_name,
            clientName: formData.name,
            clientPhone: formData.phone,
            serviceName: selectedService.name,
            bookingDate: formData.date,
            bookingTime: formData.time,
            notes: formData.notes,
          },
        },
      );

      if (notificationError) {
        console.error('Booking notification email could not be sent:', notificationError);
      }
    }

    setIsSubmitting(false);
    setIsReviewModalOpen(false);
    setSubmittedBooking(bookingSnapshot);
    setIsSubmitted(true);
  }

  function handleBackToBookingPage() {
    setSelectedServiceId('');
    setFormData({
      name: '',
      phone: '',
      date: '',
      time: '',
      notes: '',
    });
    setError('');
    setIsSubmitted(false);
    setSubmittedBooking(null);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-neutral-600">
        Loading...
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-center">
        <p className="rounded-3xl border border-neutral-200 bg-white p-8 text-lg font-medium text-neutral-950 shadow-sm">
          Salon not found.
        </p>
      </main>
    );
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
                  {business.business_name}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
                  {business.description}
                </p>
              </div>

              <div className="rounded-2xl bg-rose-50/70 p-5 text-sm text-neutral-700">
                <p className="font-medium text-neutral-950">{business.address}</p>
                {business.instagram ? (
                  <a
                    href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                    className="mt-2 inline-flex text-rose-600 hover:text-rose-700"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {business.instagram}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
``        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950">Choose a service</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {services.length === 0 ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-600 shadow-sm sm:col-span-2">
                  No services available yet.
                </div>
              ) : null}

              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceSelect(service.id)}
                    className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50/70 shadow-rose-100 ring-4 ring-rose-100'
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
                    {isSelected ? (
                      <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                        Selected
                      </span>
                    ) : null}
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">{service.duration_minutes} min</span>
                      <span className="font-semibold text-neutral-950">
                        {currency}
                        {service.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {isSubmitted && submittedBooking ? (
            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-100/60 sm:p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl font-semibold text-emerald-700">
                ✓
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-neutral-950">
                Request sent successfully
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                The salon will confirm your appointment by WhatsApp.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-neutral-500">Service</span>
                    <span className="text-right font-semibold text-neutral-950">
                      {submittedBooking.serviceName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-neutral-500">Date</span>
                    <span className="text-right font-medium text-neutral-800">
                      {submittedBooking.date}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-neutral-500">Time</span>
                    <span className="text-right font-medium text-neutral-800">
                      {submittedBooking.time}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-neutral-500">Client name</span>
                    <span className="text-right font-medium text-neutral-800">
                      {submittedBooking.clientName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-neutral-500">Phone</span>
                    <span className="text-right font-medium text-neutral-800">
                      {submittedBooking.phone}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 rounded-2xl bg-rose-50/70 px-4 py-3 text-sm leading-6 text-neutral-700">
                Please keep your phone available for confirmation.
              </p>

              <button
                type="button"
                onClick={handleBackToBookingPage}
                className="mt-6 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Back to booking page
              </button>
            </div>
          ) : (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              Request Appointment
            </button>
          </form>
          )}
        </div>
      </section>

      {isReviewModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/40 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl shadow-neutral-950/20 sm:max-w-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-rose-500">
                  Almost done
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Review your booking request
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-xl leading-none text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close booking review"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Salon</span>
                  <span className="text-right font-semibold text-neutral-950">
                    {business.business_name}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Client name</span>
                  <span className="text-right font-medium text-neutral-800">
                    {formData.name}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Phone</span>
                  <span className="text-right font-medium text-neutral-800">
                    {formData.phone}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Service</span>
                  <span className="text-right font-semibold text-neutral-950">
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Duration</span>
                  <span className="text-right font-medium text-neutral-800">
                    {selectedService?.duration_minutes} min
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Price</span>
                  <span className="text-right font-medium text-neutral-800">
                    {currency}
                    {selectedService?.price}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Date</span>
                  <span className="text-right font-medium text-neutral-800">
                    {formData.date}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">Time</span>
                  <span className="text-right font-medium text-neutral-800">
                    {formData.time}
                  </span>
                </div>
                {formData.notes ? (
                  <div className="border-t border-rose-100 pt-3">
                    <span className="text-neutral-500">Notes</span>
                    <p className="mt-2 rounded-xl bg-white/75 p-3 text-sm leading-6 text-neutral-700">
                      {formData.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit Details / Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Sending request...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default SalonBookingPage;
