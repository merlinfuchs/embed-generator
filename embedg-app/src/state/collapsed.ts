import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CollapsedStatesStore {
  states: { [key: string]: boolean };
  getCollapsed: (key: string, def?: boolean) => boolean;
  toggleCollapsed: (key: string, def?: boolean) => void;
  clearCollapsed: (key: string) => void;
}

export const useCollapsedStatesStore = create<CollapsedStatesStore>()(
  persist(
    (set, get) => ({
      states: {},
      getCollapsed: (key: string, def: boolean = false) =>
        get().states[key] || def,
      toggleCollapsed: (key: string, def: boolean = false) => {
        const states = get().states;
        const current = states[key] || def;
        states[key] = !current;
        set({ states });
      },
      clearCollapsed: (key: string) => {
        const states = get().states;
        delete states[key];
        set({ states });
      },
    }),
    { name: "collapsed-states" }
  )
);

export const useCollapsedState = (key: string, def: boolean = false) => {
  const collapsed = useCollapsedStatesStore((state) =>
    state.getCollapsed(key, def)
  );
  const toggleCollapsed = useCollapsedStatesStore(
    (state) => state.toggleCollapsed
  );
  const wrappedToggleCollapsed = () => toggleCollapsed(key, def);

  return [collapsed, wrappedToggleCollapsed] as const;
};
