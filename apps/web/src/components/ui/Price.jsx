export default function Price({ value, size = 'md' }) {
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <span className={`font-mono font-medium text-mint ${cls}`}>
      {Number(value).toFixed(2)}
      <span className="ml-1 text-[0.7em] text-mint/60">USDT</span>
    </span>
  );
}
