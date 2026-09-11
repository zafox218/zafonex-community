import { useFetch } from '@/hooks/useFetch';
import { post } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function Admin() {
  const { data: stats, loading } = useFetch('/admin/stats');
  const { data: deposits, reload: reloadDeposits } = useFetch('/admin/deposits');
  const { data: audit } = useFetch('/admin/ledger/audit');

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="glow-title text-3xl">Control room</h1>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(stats ?? {}).map(([k, v]) => (
          <div key={k} className="panel p-5">
            <p className="text-xs uppercase tracking-widest text-slate-600">{k.replace(/Usdt$/, ' USDT')}</p>
            <p className="mt-1 font-mono text-xl text-white">{v}</p>
          </div>
        ))}
      </div>

      <div className={`panel p-4 text-sm ${audit?.healthy ? 'text-mint' : 'text-ember'}`}>
        Ledger audit: {audit ? (audit.healthy ? `${audit.checked} transactions, all balanced` : `UNBALANCED: ${audit.unbalanced.join(', ')}`) : '…'}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-white">Deposits awaiting confirmation</h2>
        {!deposits?.deposits?.length ? (
          <p className="panel p-6 text-sm text-slate-500">Queue is clear.</p>
        ) : deposits.deposits.map((d) => (
          <div key={d.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm text-white">@{d.user.username} · {Number(d.amountUsdt).toFixed(2)} USDT</p>
              <p className="break-all font-mono text-[11px] text-slate-600">{d.txHash}</p>
            </div>
            <button
              className="btn-primary"
              onClick={async () => { await post(`/wallet/deposits/${d.id}/confirm`); reloadDeposits(); }}
            >
              Credit wallet
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
