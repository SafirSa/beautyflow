import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import { supabase } from '../../lib/supabaseClient.js';

function createBaseSlug(businessName) {
  return businessName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'salon';
}

async function generateUniqueSlug(baseSlug) {
  const { data, error } = await supabase
    .from('businesses')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  if (error) {
    throw error;
  }

  const existingSlugs = new Set((data || []).map((business) => business.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

function isDuplicateSlugError(error) {
  return (
    error?.code === '23505' ||
    error?.message?.includes('businesses_slug_key') ||
    error?.message?.includes('duplicate key')
  );
}

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    instagram: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const baseSlug = createBaseSlug(formData.businessName);
    let uniqueSlug;

    try {
      uniqueSlug = await generateUniqueSlug(baseSlug);
    } catch (slugError) {
      setErrorMessage(`Business profile could not be created: ${slugError.message}`);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      const isExistingEmail = error.message.toLowerCase().includes('already');
      setErrorMessage(
        isExistingEmail
          ? 'An account with this email already exists. Please log in.'
          : `Registration failed: ${error.message}`,
      );
      setIsLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMessage('Registration failed: Supabase did not return a new user.');
      setIsLoading(false);
      return;
    }

    if (Array.isArray(user.identities) && user.identities.length === 0) {
      setErrorMessage('An account with this email already exists. Please log in.');
      setIsLoading(false);
      return;
    }

    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt);
    // Free trial duration is 10 days.
    trialEndsAt.setDate(trialEndsAt.getDate() + 10);

    const businessProfile = {
      owner_id: user.id,
      business_name: formData.businessName,
      slug: uniqueSlug,
      description: '',
      phone: '',
      instagram: formData.instagram.trim(),
      address: '',
      currency: '₪',
      notification_email: formData.email,
      subscription_status: 'trialing',
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      subscription_plan: 'basic',
    };

    let createdBusinessSlug = businessProfile.slug;
    let { error: businessError } = await supabase.from('businesses').insert(businessProfile);

    if (isDuplicateSlugError(businessError)) {
      const retryBusinessProfile = {
        ...businessProfile,
        slug: `${baseSlug}-${Date.now()}`,
      };

      const retryResult = await supabase.from('businesses').insert(retryBusinessProfile);
      businessError = retryResult.error;
      createdBusinessSlug = retryBusinessProfile.slug;
    }

    if (businessError) {
      setErrorMessage(
        'Account was created, but business profile could not be created. Please contact support.',
      );
      setIsLoading(false);
      return;
    }

    const { error: welcomeEmailError } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        to: formData.email,
        ownerName: formData.ownerName,
        businessName: formData.businessName,
        bookingLink: `/salon/${createdBusinessSlug}`,
      },
    });

    if (welcomeEmailError) {
      console.error('Welcome email could not be sent:', welcomeEmailError);
    }

    setIsLoading(false);
    navigate('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-stone-50 px-4 py-10 text-neutral-950">
      <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-6 shadow-xl shadow-rose-100/70 sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-sm font-bold text-rose-700">
            BF
          </div>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-rose-500">
            BeautyFlow
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
            Create your BeautyFlow account
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Start managing your salon bookings, clients, and WhatsApp messages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Business name</span>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="Maya Nails Studio"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Owner name</span>
            <input
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="owner@salon.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Instagram</span>
            <input
              type="url"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="type your instagram username"
            />
            <span className="mt-2 block text-xs leading-5 text-neutral-500">
              Optional. This will appear on your public booking page.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="Create a password"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-rose-700 hover:text-rose-800">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
