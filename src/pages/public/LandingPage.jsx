import { Link } from 'react-router-dom';
import landingHero from '../../assets/landing-hero.png';

const features = [
  {
    title: 'Personal booking link',
    description: 'Give clients one polished link they can open from Instagram, WhatsApp, or your bio.',
  },
  {
    title: 'Booking requests dashboard',
    description: 'See new requests, approve times, reject unavailable slots, and keep the day organized.',
  },
  {
    title: 'Client list / CRM',
    description: 'Keep client details, visit notes, and follow-up opportunities in one simple place.',
  },
  {
    title: 'WhatsApp confirmations and follow-ups',
    description: 'Open ready-to-send WhatsApp messages for confirmations, reminders, and client care.',
  },
  {
    title: 'Automatic email notifications',
    description: 'Get an email when a client requests an appointment, so no new booking slips by.',
  },
];

const steps = [
  'Create your salon profile',
  'Add your services and prices',
  'Share your booking link on Instagram and WhatsApp',
  'Approve requests and message clients',
];

const planFeatures = [
  'Personal booking page for your salon',
  'Booking requests dashboard',
  'Services and prices management',
  'Client list / CRM',
  'WhatsApp buttons with ready messages',
  'Automatic email notifications',
  'Mobile-friendly dashboard',
];

function LandingPage() {
  return (
    <main className="bg-white text-neutral-950">
      <section className="relative overflow-hidden bg-rose-50/40 md:min-h-[88vh]">
        <img
          src={landingHero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60 sm:opacity-65 md:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/46 to-white/82 md:from-white/55 md:via-white/24 md:to-white/68" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white via-white/72 to-white/0 md:via-white/58 md:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/48 to-transparent md:h-32" />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-sm font-bold text-rose-700">
              BF
            </span>
            <span className="text-lg font-semibold">BeautyFlow</span>
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Log in
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex max-w-6xl px-4 pb-12 pt-6 sm:px-6 md:min-h-[calc(88vh-84px)] md:items-center md:pb-20 md:pt-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-600">
              Beauty salon booking software
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-neutral-950 sm:text-6xl lg:text-7xl">
              Simple booking website for beauty salons
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
              Give your salon a booking link, manage client requests, and send WhatsApp
              confirmations and follow-ups from one easy dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-xl bg-neutral-950 px-6 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-neutral-900/10 transition hover:bg-neutral-800"
              >
                Start 14-day free trial
              </Link>
              <Link
                to="/salon/maya-nails"
                className="rounded-xl border border-neutral-200 bg-white/90 px-6 py-4 text-center text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
              >
                View demo booking page
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-rose-500">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-neutral-950 sm:text-4xl">
              Everything your salon needs to take requests without chaos
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              When a client requests an appointment, BeautyFlow saves the request and sends the
              salon owner an email notification.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="h-2 w-12 rounded-full bg-rose-200" />
                <h3 className="mt-5 text-lg font-semibold text-neutral-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-rose-500">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-neutral-950 sm:text-4xl">
                From salon profile to booked calendar
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map((step, index) => (
                <article key={step} className="rounded-3xl bg-white p-5 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-sm font-semibold text-rose-700">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-neutral-950">{step}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-100 bg-white p-6 shadow-xl shadow-rose-100/70 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-rose-500">
            Simple pricing
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-neutral-950">BeautyFlow</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
                Everything a small beauty business needs to manage bookings, clients, and
                WhatsApp follow-ups.
              </p>
              <p className="mt-2 text-sm font-medium text-rose-700">
                Try BeautyFlow free for 14 days. No credit card required.
              </p>
            </div>
            <p className="text-4xl font-semibold text-neutral-950">₪99/month</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {planFeatures.map((feature) => (
              <div key={feature} className="rounded-2xl bg-rose-50/70 px-4 py-3 text-sm text-neutral-700">
                {feature}
              </div>
            ))}
          </div>

          <Link
            to="/register"
            className="mt-8 block rounded-xl bg-neutral-950 px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Start 14-day free trial
          </Link>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-neutral-950 px-6 py-12 text-center text-white sm:px-8">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold sm:text-4xl">
            Ready to give your salon a professional booking link?
          </h2>
          <Link
            to="/register"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-4 text-sm font-semibold text-neutral-950 transition hover:bg-rose-50"
          >
            Start 14-day free trial
          </Link>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
