function StatCard({ label = 'Stat', value = '0', helperText }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950 sm:mt-3 sm:text-3xl">{value}</p>
      {helperText ? <p className="mt-1 text-sm text-neutral-500 sm:mt-2">{helperText}</p> : null}
    </div>
  );
}

export default StatCard;
