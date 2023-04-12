import { create } from "zustand";
import { getUniqueId } from ".";

interface Toast {
  message: string;
  type?: "success" | "error" | "info";
  timeout?: number;
}

interface ToastWithId extends Toast {
  id: number;
}

interface ToastStore {
  toasts: ToastWithId[];
  create(toast: Toast): void;
}

export const useToasts = create<ToastStore>()((set) => ({
  toasts: [],
  create: (toast) => {
    const id = getUniqueId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id,
        },
      ],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.timeout || 3000);
  },
}));

export function ToastContainer() {
  const toasts = useToasts((state) => state.toasts);
  return (
    <div className="fixed top-5 right-5 space-y-3 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-dark-2 rounded-md p-3 shadow-lg text-white"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
