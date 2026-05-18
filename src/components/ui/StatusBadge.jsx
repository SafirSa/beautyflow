const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  confirmed: 'bg-rose-100 text-rose-700',
  new: 'bg-sky-50 text-sky-700',
  active: 'bg-emerald-50 text-emerald-700',
  regular: 'bg-emerald-50 text-emerald-700',
  vip: 'bg-rose-100 text-rose-700',
  inactive: 'bg-amber-50 text-amber-700',
  'needs follow-up': 'bg-amber-50 text-amber-700',
  lost: 'bg-neutral-200 text-neutral-700',
};

function StatusBadge({ children = 'Status', status }) {
  const normalizedStatus = status || String(children).toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
        statusStyles[normalizedStatus] || 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {children}
    </span>
  );
}

export default StatusBadge;
