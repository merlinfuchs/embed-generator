import SettingsGeneral from "../components/SettingsGeneral";
import SettingsCustomBot from "../components/SettingsCustomBot";

export default function SettingsView() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="max-w-5xl w-full mx-auto px-4 my-5 lg:my-20 space-y-10">
        <SettingsGeneral />
        <SettingsCustomBot />
      </div>
    </div>
  );
}
