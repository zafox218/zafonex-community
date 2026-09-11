import { useEffect, useState } from 'react';
import { useWallet } from '@/store/walletStore';
import Spinner from '@/components/ui/Spinner';
import Price from '@/components/ui/Price';

export default function Wallet() {
  const { balances, entries, meta, loading, load, declareDeposit, requestWithdrawal } = useWallet();
  const [deposit, setDeposit] = useState({ amountUsdt: '', txHash: '' });
  const [withdraw, setWithdraw] = useState({ amountUsdt: '', toAddress: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => { load(); }, [load]);

  const submitDeposit = async (e) => {
    e.preventDefault();
    try {
      const res = await declareDeposit(deposit);
      setMessage(res.message);
      setDeposit({ amountUsdt: '', txHash: '' });
      load();
    } catch (err) { setMessage(err.message); }
  };

  const submitWithdraw = async (e) => {
    e.preventDefault();
    try {
      const res = await requestWithdrawal(withdraw);
      setMessage(res.message);
      setWithdraw({ amountUsdt: '', toAddress: '' });
      load();
    } catch (err) { setMessage(err.message); }
  };

  if (loading && !entries.length) return <Spinner label="Reading ledger" />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="glow-title text-3xl">Wallet</h1>
        <p className="text-sm text-slate-500">{meta.network} · every movement below is a double-entry ledger record.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Available', balances.USER_AVAILABLE, 'text-mint'],
          ['In escrow', balances.USER_ESCROW, 'text-neon'],
          ['Pending release', balances.USER_PENDING, 'text-plasma'],
        ].map(([label, value, accent]) => (
          <div key={label} className="panel p-6">
            <p className="text-xs uppercase tracking-widest text-slate-600">{label}</p>
            <p className={`mt-2 font-mono text-2xl ${accent}`}>{Number(value ?? 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {message && <p className="panel p-4 text-sm text-neon">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={submitDeposit} className="panel space-y-3 p-6">
          <h2 className="font-display text-lg text-white">Top up</h2>
          <p className="text-xs text-slate-500">
            Send USDT ({meta.network}) to:
          </p>
          <code className="block break-all rounded-lg border border-edge bg-void p-3 font-mono text-xs text-neon">
            {meta.depositAddress || 'set USDT_DEPOSIT_ADDRESS in apps/api/.env'}
          </code>
          <input className="field" placeholder="Amount sent" value={deposit.amountUsdt}
            onChange={(e) => setDeposit({ ...deposit, amountUsdt: e.target.value })} required />
          <input className="field" placeholder="Transaction hash" value={deposit.txHash}
            onChange={(e) => setDeposit({ ...deposit, txHash: e.target.value })} required />
          <button className="btn-primary w-full py-3">Declare transfer</button>
        </form>

        <form onSubmit={submitWithdraw} className="panel space-y-3 p-6">
          <h2 className="font-display text-lg text-white">Cash out</h2>
          <p className="text-xs text-slate-500">Minimum {meta.minWithdrawal} USDT.</p>
          <input className="field" placeholder="Amount" value={withdraw.amountUsdt}
            onChange={(e) => setWithdraw({ ...withdraw, amountUsdt: e.target.value })} required />
          <input className="field" placeholder={`Your ${meta.network} address`} value={withdraw.toAddress}
            onChange={(e) => setWithdraw({ ...withdraw, toAddress: e.target.value })} required />
          <button className="btn-plasma w-full py-3">Request payout</button>
        </form>
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg text-white">Ledger history</h2>
        <div className="panel divide-y divide-edge">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div className="min-w-0">
                <p className="truncate text-slate-300">{e.transaction.memo ?? e.transaction.kind}</p>
                <p className="font-mono text-[11px] text-slate-600">
                  {e.account.type} · {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={e.direction === 'CREDIT' ? 'font-mono text-mint' : 'font-mono text-ember'}>
                {e.direction === 'CREDIT' ? '+' : '−'}{Number(e.amount).toFixed(2)}
              </span>
            </div>
          ))}
          {!entries.length && <p className="p-6 text-sm text-slate-600">No movements yet.</p>}
        </div>
      </section>
    </div>
  );
}
