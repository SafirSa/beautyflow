import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import { salon } from '../../data/mockData.js';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultWorkingHours = weekDays.map((day) => ({
  day,
  opensAt: day === 'Saturday' ? '' : '10:00',
  closesAt: day === 'Saturday' ? '' : '18:00',
}));

function Settings() {
  const [formData, setFormData] = useState({
    name: salon.name,
    description: salon.description,
    phone: salon.phone,
    instagram: salon.instagram,
    address: salon.address,
    currency: salon.currency,
    slug: salon.slug,
  });
  const [workingHours, setWorkingHours] = useState(defaultWorkingHours);
  const [saveMessage, setSaveMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const bookingLink = `/salon/${formData.slug}`;

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setSaveMessage('');
  }

  function handleHoursChange(day, field, value) {
    setWorkingHours((currentHours) =>
      currentHours.map((hours) =>
        hours.day === day ? { ...hours, [field]: value } : hours,
      ),
    );
    setSaveMessage('');
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopyMessage('Copied!');
    } catch {
      setCopyMessage('Copy unavailable');
    }
  }

  function handleSave(event) {
    event.preventDefault();
    setSaveMessage('Settings saved locally for demo.');
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-950">Settings</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Manage your salon details, booking link, and working hours.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-neutral-950">Business settings</h3>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Business name</span>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Phone</span>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Instagram</span>
              <input
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Address</span>
              <input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Currency</span>
              <input
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Booking page slug</span>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-neutral-950">Booking Page Link</h3>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-rose-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-all text-sm font-medium text-neutral-800">{bookingLink}</p>
            <div className="flex items-center gap-3">
              {copyMessage ? <span className="text-sm text-rose-700">{copyMessage}</span> : null}
              <Button type="button" variant="secondary" onClick={handleCopyLink}>
                Copy Link
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-neutral-950">Working Hours</h3>
          <div className="mt-5 space-y-3">
            {workingHours.map((hours) => (
              <div
                key={hours.day}
                className="grid gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 sm:grid-cols-[1fr_160px_160px] sm:items-center"
              >
                <p className="font-medium text-neutral-950">{hours.day}</p>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Opens
                  </span>
                  <input
                    type="time"
                    value={hours.opensAt}
                    onChange={(event) =>
                      handleHoursChange(hours.day, 'opensAt', event.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Closes
                  </span>
                  <input
                    type="time"
                    value={hours.closesAt}
                    onChange={(event) =>
                      handleHoursChange(hours.day, 'closesAt', event.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {saveMessage ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveMessage}
            </p>
          ) : null}
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
