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
          className="bg-dark-2 rounded-md py-3 pl-3 pr-5 shadow-lg text-white flex space-x-3 items-center"
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-7 h-7 text-green flex-none" />
          ) : toast.type === "error" ? (
            <ExclamationCircleIcon className="w-7 h-7 text-red flex-none" />
          ) : (
            <InformationCircleIcon className="w-7 h-7 tex-blurple flex-none" />
          )}
          <div>
            <div className="text-gray-200 mb-1">{toast.title}</div>
            <div className="text-gray-300 text-sm">{toast.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
