import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Booking Requests', to: '/dashboard/bookings' },
  { label: 'Clients', to: '/dashboard/clients' },
  { label: 'Services', to: '/dashboard/services' },
  { label: 'Messages', to: '/dashboard/messages' },
  { label: 'Settings', to: '/dashboard/settings' },
];

function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-neutral-200 bg-white px-5 py-6 lg:block">
      <div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-lg font-bold text-rose-700">
          BF
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-950">BeautyFlow</h2>
        <p className="mt-1 text-sm text-neutral-500">Salon workspace</p>
      </div>

      <nav className="mt-8 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-rose-50 text-rose-700 shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
export { navigationItems };
