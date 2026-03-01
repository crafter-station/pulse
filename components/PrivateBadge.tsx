const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="w-2.5 h-2.5"
  >
    <path
      fillRule="evenodd"
      d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
      clipRule="evenodd"
    />
  </svg>
);

export function PrivateBadge() {
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-black bg-[#737373]/10 text-[#737373] border-2 border-[#737373]/20 flex items-center gap-1 uppercase tracking-wider">
      <LockIcon />
      Private
    </span>
  );
}
