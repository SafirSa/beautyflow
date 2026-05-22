import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import { supabase } from '../../lib/supabaseClient.js';

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultWorkingHours = weekDays.map((day) => ({
  day,
  opensAt: day === 'Saturday' ? '' : '10:00',
  closesAt: day === 'Saturday' ? '' : '18:00',
}));

function Settings() {
  const { businessProfile } = useOutletContext();
  const [formData, setFormData] = useState({
    business_name: businessProfile.business_name || '',
    description: businessProfile.description || '',
    phone: businessProfile.phone || '',
    instagram: businessProfile.instagram || '',
    address: businessProfile.address || '',
    currency: businessProfile.currency || '₪',
    slug: businessProfile.slug || '',
    notification_email: businessProfile.notification_email || '',
  });
  const [ownerId, setOwnerId] = useState(businessProfile.owner_id || '');
  const [workingHours, setWorkingHours] = useState(defaultWorkingHours);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const bookingLink = `/salon/${formData.slug}`;

  useEffect(() => {
    async function loadBusinessSettings() {
      setIsLoadingBusiness(true);
      setErrorMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErrorMessage('Could not load your business settings.');
        setIsLoadingBusiness(false);
        return;
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userData.user.id)
        .single();

      if (error || !data) {
        setErrorMessage('No business profile found. Please complete your setup.');
        setIsLoadingBusiness(false);
        return;
      }

      setOwnerId(userData.user.id);
      setFormData({
        business_name: data.business_name || '',
        description: data.description || '',
        phone: data.phone || '',
        instagram: data.instagram || '',
        address: data.address || '',
        currency: data.currency || '₪',
        slug: data.slug || '',
        notification_email: data.notification_email || '',
      });
      setIsLoadingBusiness(false);
    }

    loadBusinessSettings();
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setSaveMessage('');
    setErrorMessage('');
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

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    const { error } = await supabase
      .from('businesses')
      .update({
        business_name: formData.business_name,
        description: formData.description,
        phone: formData.phone,
        instagram: formData.instagram,
        address: formData.address,
        currency: formData.currency,
        slug: formData.slug,
        notification_email: formData.notification_email,
      })
      .eq('owner_id', ownerId);

    setIsSaving(false);

    if (error) {
      setErrorMessage(`Settings could not be saved: ${error.message}`);
      return;
    }

    setSaveMessage('Settings saved successfully.');
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
                name="business_name"
                value={formData.business_name}
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

            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Notification email</span>
              <input
                type="email"
                name="notification_email"
                value={formData.notification_email}
                onChange={handleInputChange}
                placeholder="Where should new booking notifications be sent?"
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
          {isLoadingBusiness ? (
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
              Loading settings...
            </p>
          ) : null}
          {saveMessage ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
          <Button type="submit" disabled={isSaving || isLoadingBusiness}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
