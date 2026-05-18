import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
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

          <Button type="submit" className="w-full">
            Create account
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
