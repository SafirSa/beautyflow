function Topbar({ title }) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div>
          <p className="text-sm font-medium text-rose-600">Maya Nails Studio</p>
          <h1 className="mt-1 text-lg font-semibold text-neutral-950 sm:text-2xl">{title}</h1>
        </div>

        <button
          type="button"
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-neutral-950 sm:px-4"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
