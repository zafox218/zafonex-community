import { create } from 'zustand';
import { get as apiGet, post } from '@/lib/api';

export const useWallet = create((set) => ({
  balances: {},
  entries: [],
  meta: {},
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const data = await apiGet('/wallet');
      set({
        balances: data.balances,
        entries: data.entries,
        meta: { currency: data.currency, network: data.network, depositAddress: data.depositAddress, minWithdrawal: data.minWithdrawal },
      });
    } finally {
      set({ loading: false });
    }
  },

  declareDeposit: (payload) => post('/wallet/deposits', payload),
  requestWithdrawal: (payload) => post('/wallet/withdrawals', payload),
}));
