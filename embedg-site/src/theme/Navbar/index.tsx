import React from "react";
import clsx from "clsx";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import NavbarMobileSidebar from "@theme/Navbar/MobileSidebar";
import HomeHeader from "../../components/HomeHeader";

import "../../css/tailwind.css";

/**
 * Replaces the default Docusaurus navbar on docs and blog pages with the same
 * header the landing page uses. The Docusaurus mobile sidebar is kept so the
 * docs sidebar stays reachable on small screens.
 */
export default function Navbar(): JSX.Element {
  const mobileSidebar = useNavbarMobileSidebar();

  return (
    <>
      <HomeHeader
        asNavbar
        mobileMenu={{
          open: mobileSidebar.shown,
          onToggle: mobileSidebar.toggle,
        }}
      />
      <div className={clsx(mobileSidebar.shown && "navbar-sidebar--show")}>
        <div
          role="presentation"
          className="navbar-sidebar__backdrop"
          onClick={mobileSidebar.toggle}
        />
        <NavbarMobileSidebar />
      </div>
    </>
  );
}
