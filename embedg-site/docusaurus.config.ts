import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Embed Generator",
  tagline: "The best way to create Discord embeds!",
  favicon: "img/logo.svg",

  // Set the production url of your site here
  url: "https://message.style",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "merlinfuchs", // Usually your GitHub org/user name.
  projectName: "embed-generator", // Usually your repo name.

  headTags: [
    {
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Embed Generator",
        url: "https://message.style",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description:
          "Visual editor for Discord embeds, buttons and select menus. Send messages through webhooks or a bot, save them, schedule them.",
        offers: [
          { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
          {
            "@type": "Offer",
            price: "4.99",
            priceCurrency: "USD",
            name: "Premium",
            description: "Per server, monthly",
          },
        ],
        author: { "@type": "Person", name: "Merlin Fuchs" },
      }),
    },
  ],

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/merlinfuchs/embed-generator/tree/main/embedg-site/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/merlinfuchs/embed-generator/tree/main/embedg-site/",
        },
        sitemap: {
          ignorePatterns: ["/blog/tags/**", "/blog/archive", "/blog/authors"],
        },
        theme: {
          customCss: require.resolve("./src/css/global.css"),
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      metadata: [
        {
          name: "description",
          content:
            "Create embed messages for your Discord server with ease and give them your own branding using webhooks.",
        },
        {
          name: "og:description",
          content:
            "Create embed messages for your Discord server with ease and give them your own branding using webhooks.",
        },
        {
          name: "og:site_name",
          content: "message.style",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "theme-color",
          content: "#1e1f22",
        },
      ],

      colorMode: {
        defaultMode: "dark",
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },

      // Replace with your project's social card
      image: "img/og.png",
      navbar: {
        title: "Embed Generator",
        logo: {
          alt: "Embed Generator",
          src: "img/logo.svg",
          className: "rounded-full",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Docs",
          },
          {
            to: "blog",
            label: "Blog",
            position: "left",
          },
          {
            href: "https://message.style/discord",
            label: "Discord",
            position: "right",
          },
          {
            href: "https://github.com/merlinfuchs/embed-generator",
            label: "GitHub",
            position: "right",
          },
          {
            href: "https://message.style/app",
            label: "Open App",
            position: "right",
            className: "navbar__item--cta",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Product",
            items: [
              { label: "Open App", href: "https://message.style/app" },
              { label: "Premium", href: "https://message.style/premium" },
              { label: "Documentation", to: "/docs" },
              { label: "Blog", to: "/blog" },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "GitHub",
                href: "https://message.style/source",
              },
              {
                label: "Discord",
                href: "https://message.style/discord",
              },
              {
                label: "Status",
                href: "https://status.message.style",
              },
            ],
          },
          {
            title: "Legal",
            items: [
              {
                label: "Terms of Service",
                to: "/terms",
              },
              {
                label: "Privacy Policy",
                to: "/privacy",
              },
              {
                label: "Cookies",
                to: "/cookies",
              },
              {
                label: "Imprint",
                to: "/imprint",
              },
              {
                label: "Cookies",
                to: "/cookies",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Merlin Fuchs & Contributors | Not affiliated with or endorsed by Discord Inc.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    } satisfies Preset.ThemeConfig,

  plugins: [
    async function myPlugin(context, options) {
      return {
        name: "docusaurus-tailwindcss",
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          postcssOptions.plugins.push(require("tailwindcss"));
          postcssOptions.plugins.push(require("autoprefixer"));
          return postcssOptions;
        },
      };
    },
  ],

  scripts: [
    { src: "/js/setupop.js", defer: true },
    { src: "https://openpanel.dev/op1.js", defer: true },
  ],
};

module.exports = config;
