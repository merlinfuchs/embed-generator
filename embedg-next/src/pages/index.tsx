import Image from "next/image";
import { Inter } from "next/font/google";
import { useTheme } from "next-themes";
import HomeLayout from "@/components/common/HomeLayout";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <HomeLayout>
      <div>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          Toggle Theme
        </button>
      </div>
    </HomeLayout>
  );
}
