const buttonVariants = {
  primary: 'bg-neutral-950 text-white hover:bg-neutral-800',
  secondary: 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
  danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
};

function Button({ children, type = 'button', variant = 'primary', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`rounded-xl px-4 py-3 text-sm font-medium transition sm:py-2 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
