import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Embed Generator | Discord embeds without the hassle",
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
          content: "summary",
        },
        {
          name: "theme-color",
          content: "#237feb",
        },
      ],

      colorMode: {
        defaultMode: "dark",
      },

      // Replace with your project's social card
      image: "img/logo-256.png",
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
            label: "Tutorial",
          },
          {
            to: "blog",
            label: "Blog",
            position: "left",
          },
          // { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://github.com/merlinfuchs/embed-generator",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Tutorial",
                to: "/docs",
              },
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
                href: "/privacy",
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
    { src: "/swetrix.js", defer: true },
    { src: "js/setupswetrix.js", defer: true },
  ],
};

module.exports = config;
