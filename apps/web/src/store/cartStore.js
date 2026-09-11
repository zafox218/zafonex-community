import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { post } from '@/lib/api';

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const key = item.packageId ?? item.id;
        if (get().items.some((i) => (i.packageId ?? i.id) === key)) return;
        set({ items: [...get().items, item] });
      },

      remove: (key) => set({ items: get().items.filter((i) => (i.packageId ?? i.id) !== key) }),
      clear: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + Number(i.priceUsdt) * (i.quantity ?? 1), 0),
      count: () => get().items.length,

      checkout: async (note) => {
        const payload = {
          note,
          items: get().items.map((i) => ({
            kind: i.kind, id: i.id, packageId: i.packageId, quantity: i.quantity ?? 1,
          })),
        };
        const data = await post('/orders/checkout', payload);
        set({ items: [] });
        return data.order;
      },
    }),
    { name: 'zx_cart' }
  )
);
