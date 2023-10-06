import React from "react";
import HomeHero from "../components/HomeHero";
import HomeHeader from "../components/HomeHeader";
import HomeFeatures from "../components/HomeFeatures";
import HomeFooter from "../components/HomeFooter";

import "../css/tailwind.css";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-[100dvh] bg-dark-2">
      <HomeHeader />
      <HomeHero />
      <HomeFeatures />
      <HomeFooter />
    </div>
  );
}
