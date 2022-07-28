import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XIcon,
} from "@heroicons/react/outline";
import { createContext, useContext, useState, ReactNode } from "react";
import { getUniqueId } from "../util";

export interface Alert {
  type: "error" | "success" | "info";
  title: string;
  details: string;
}

const AlertsContext = createContext<(alert: Alert) => void>(() => {});

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<(Alert & { id: number })[]>([]);

  function addAlert(alert: Alert) {
    const id = getUniqueId();
    setAlerts([...alerts, { ...alert, id }]);
    setTimeout(() => {
      setAlerts((alerts) => alerts.filter((a) => a.id !== id));
    }, 3000);
  }

  function removeAlert(id: number) {
    setAlerts((alerts) => alerts.filter((a) => a.id !== id));
  }

  return (
    <AlertsContext.Provider value={addAlert}>
      <div className="fixed w-screen xs:w-auto xs:top-3 xs:right-3 z-50 space-y-5 px-2 py-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="w-full xs:w-80 bg-dark-1 shadow-lg rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {alert.type === "success" ? (
                    <CheckCircleIcon
                      className="h-6 w-6 text-green"
                      aria-hidden="true"
                    />
                  ) : alert.type === "error" ? (
                    <ExclamationCircleIcon
                      className="h-6 w-6 text-red"
                      aria-hidden="true"
                    />
                  ) : (
                    <InformationCircleIcon
                      className="h-6 w-6 text-blurple"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-100">
                    {alert.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-300">{alert.details}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    type="button"
                    className="inline-flex text-gray-300 hover:text-gray-100"
                    onClick={() => removeAlert(alert.id)}
                  >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {children}
    </AlertsContext.Provider>
  );
};

export default function useAlerts() {
  return useContext(AlertsContext);
}
