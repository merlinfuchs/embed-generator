import { MoonStarIcon, SunIcon } from "lucide-react";
import NavbarMenu from "./NavbarMenu";
import { useTheme } from "next-themes";
import { useHasMounted } from "@/lib/hooks/mounted";

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  const mounted = useHasMounted();

  return (
    <div className="border-b py-2 px-5 flex justify-between items-center">
      <NavbarMenu />
      {mounted && (
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
      )}
    </div>
  );
}
