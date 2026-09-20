import { useEffect } from "react";
import { useSettingsStore } from "../state/settings";

export default function ConfirmOnExit() {
  const confirmOnExit = useSettingsStore((s) => s.confirmOnExit);

  useEffect(() => {
    if (!confirmOnExit) {
      return;
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave?";
      return e.returnValue;
    }

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [confirmOnExit]);

  return null;
}
