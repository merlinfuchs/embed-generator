import { create } from "zustand";
import { getUniqueId } from ".";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";

interface Toast {
  title: string;
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
    }, toast.timeout || 5000);
  },
}));

export function ToastContainer() {
  const toasts = useToasts((state) => state.toasts);
  return (
    <div className="fixed top-5 right-5 space-y-3 z-50 w-10/12 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-ink-700 border border-white/10 rounded-xl py-3 pl-3 pr-5 shadow-card text-white flex space-x-3 items-center"
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-7 h-7 text-green flex-none" />
          ) : toast.type === "error" ? (
            <ExclamationCircleIcon className="w-7 h-7 text-red flex-none" />
          ) : (
            <InformationCircleIcon className="w-7 h-7 text-azure-400 flex-none" />
          )}
          <div>
            <div className="text-mist-100 mb-1">{toast.title}</div>
            <div className="text-mist-300 text-sm">{toast.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
