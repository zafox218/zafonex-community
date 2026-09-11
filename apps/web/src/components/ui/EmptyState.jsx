export default function EmptyState({ title, hint, action }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="h-10 w-10 rounded-xl border border-edge bg-void animate-float" />
      <h3 className="font-display text-lg text-white">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action}
    </div>
  );
}
