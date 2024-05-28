import { useTheme } from "next-themes";

export default function AppPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        Toggle Theme
      </button>
    </div>
  );
}
