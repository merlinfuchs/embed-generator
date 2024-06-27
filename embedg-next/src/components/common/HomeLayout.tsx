import { ReactNode } from "react";
import Navbar from "./Navbar";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <div className="flex-none">
        <Navbar />
      </div>
      <div className="flex-auto overflow-hidden">{children}</div>
    </div>
  );
}
