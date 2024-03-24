import { create } from "zustand";

export interface ActivityStateStore {
  loading: boolean;
  error: string | null;
  setError(error: string | null): void;
  setLoading(loading: boolean): void;
}

export const useActivityStateStore = create<ActivityStateStore>()(
  (set, get) => ({
    loading: false,
    error: null,
    setError: (error) => {
      set({ error });
    },
    setLoading: (loading) => {
      set({ loading });
    },
  })
);
