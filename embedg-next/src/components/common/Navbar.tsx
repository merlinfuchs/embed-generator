import { MoonStarIcon, SunIcon } from "lucide-react";
import NavbarMenu from "./NavbarMenu";
import { useTheme } from "next-themes";
import { useAfterMounted, useHasMounted } from "@/lib/hooks/mounted";

export default function Navbar() {
  const { theme, setTheme } = useAfterMounted(useTheme(), {
    theme: "light",
    setTheme: () => {},
  });

  return (
    <div className="border-b py-2 px-5 flex justify-between items-center">
      <NavbarMenu />
      <div>
        {theme === "dark" ? (
          <MoonStarIcon
            className="w-6 h-6 cursor-pointer"
            onClick={() => setTheme("light")}
          />
        ) : (
          <SunIcon
            className="w-6 h-6 cursor-pointer"
            onClick={() => setTheme("dark")}
          />
        )}
      </div>
    </div>
  );
}
