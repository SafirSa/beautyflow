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

  const bookingLink = formData.slug ? `${window.location.origin}/salon/${formData.slug}` : '';

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
              <p className="mt-1 text-xs text-neutral-500">This is shown on your booking page.</p>
              <input
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Phone</span>
              <p className="mt-1 hidden text-xs text-transparent lg:block" aria-hidden="true">
                This keeps the phone input aligned.
              </p>
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
              <p className="mt-1 text-xs text-neutral-500">
                Optional. Add your salon Instagram profile.
              </p>
              <input
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                placeholder="type your instagram username"
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Address</span>
              <p className="mt-1 text-xs text-neutral-500">
                Optional. Shown on the public booking page.
              </p>
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
              <p className="mt-1 text-xs text-neutral-500">
                New booking request emails will be sent to this address.
              </p>
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
          <p className="mt-2 text-sm text-neutral-500">
            Share this link with clients so they can request appointments.
          </p>
          <div className="mt-4 rounded-2xl bg-rose-50/70 p-4">
            <p className="break-all text-sm font-semibold text-neutral-900">{bookingLink}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              {copyMessage ? <span className="text-sm text-rose-700">{copyMessage}</span> : null}
              <Button type="button" variant="secondary" onClick={handleCopyLink}>
                Copy Link
              </Button>
              <a
                href={bookingLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-neutral-950 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-800 sm:py-2"
              >
                View Booking Page
              </a>
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
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
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
