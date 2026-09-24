import { create } from "zustand";

interface CollapsedStatesStore {
  states: { [key: string]: boolean };
  getCollapsed: (key: string, def?: boolean) => boolean;
  toggleCollapsed: (key: string, def?: boolean) => void;
}

export const useCollapsedStatesStore = create<CollapsedStatesStore>()(
  (set, get) => ({
    states: {},
    getCollapsed: (key: string, def: boolean = false) => {
      const state = get().states[key];
      return state === undefined ? def : state;
    },
    toggleCollapsed: (key: string, def: boolean = false) => {
      const states = get().states;
      const current = states[key] === undefined ? def : states[key];
      states[key] = !current;
      set({ states });
    },
  }),
);

export const useCollapsedState = (key: string, def: boolean = false) => {
  const collapsed = useCollapsedStatesStore((state) =>
    state.getCollapsed(key, def),
  );
  const toggleCollapsed = useCollapsedStatesStore(
    (state) => state.toggleCollapsed,
  );
  const wrappedToggleCollapsed = () => toggleCollapsed(key, def);

  return [collapsed, wrappedToggleCollapsed] as const;
};
