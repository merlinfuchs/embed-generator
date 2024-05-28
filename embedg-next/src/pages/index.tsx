import Image from "next/image";
import { Inter } from "next/font/google";
import { useTheme } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        Toggle Theme
      </button>
    </div>
  );
}
