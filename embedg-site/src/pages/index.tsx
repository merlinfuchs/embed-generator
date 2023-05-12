import React from "react";

import "../css/tailwind.css";
import HomeHero from "../components/HomeHero";
import HomeHeader from "../components/HomeHeader";

export default function Home(): JSX.Element {
  return (
    <div className="h-screen w-screen bg-dark-2">
      <HomeHeader />
      <HomeHero />
    </div>
  );
}
