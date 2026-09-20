import React from "react";
import HomeHero from "../components/HomeHero";
import HomeHeader from "../components/HomeHeader";
import HomeFeatures from "../components/HomeFeatures";
import HomePremium from "../components/HomePremium";
import HomeFooter from "../components/HomeFooter";

import "../css/tailwind.css";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-[100dvh] bg-ink-900 font-sans text-mist-100 antialiased">
      <HomeHeader />
      <main>
        <HomeHero />
        <HomeFeatures />
        <HomePremium />
      </main>
      <HomeFooter />
    </div>
  );
}
