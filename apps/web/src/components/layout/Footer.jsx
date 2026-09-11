export default function Footer() {
  return (
    <footer className="mt-24 border-t border-edge">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ZAFONEX Community</p>
        <p className="font-mono text-xs">Settled in USDT · built by NovaEmpire</p>
      </div>
    </footer>
  );
}
