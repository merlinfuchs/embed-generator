import React from "react";
import Head from "@docusaurus/Head";
import HomeHero from "../components/HomeHero";
import HomeHeader from "../components/HomeHeader";
import HomeShowcase from "../components/HomeShowcase";
import HomePremium from "../components/HomePremium";
import HomeSteps from "../components/HomeSteps";
import HomeFAQ, { faq } from "../components/HomeFAQ";
import HomeFooter from "../components/HomeFooter";

import "../css/tailwind.css";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-[100dvh] bg-ink-900 font-sans text-mist-100 antialiased">
      <Head>
        <title>Embed Generator | Discord embeds without the hassle</title>
        <meta
          name="description"
          content="Free Discord embed generator. Design embeds, buttons and select menus in a visual editor and send them through a webhook or bot. Save, schedule and reuse messages."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Head>
      <HomeHeader />
      <main>
        <HomeHero />
        <HomeShowcase />
        <HomeSteps />
        <HomePremium />
        <HomeFAQ />
      </main>
      <HomeFooter />
    </div>
  );
}
