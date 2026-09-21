---
slug: discord-component-embeds
title: Build a Discord Component Embed Without Writing JSON
description: Discord link previews can now be a Components V2 container with markdown, image galleries and link buttons. Build one in Embed Generator and share it as a link, no website or bot required.
authors: [merlin]
tags: [discord, components, embed, link-preview, unfurl, components-v2]
draft: true
---

Discord shipped component embeds: a website can now replace its link preview with a [Components V2](https://discord.com/developers/docs/components/reference) container instead of the usual title, description and thumbnail card. The [documentation PR](https://github.com/discord/discord-api-docs/pull/8606) describes a `discord:component-embed` script tag you add to your page. The feature is live even though that PR hasn't merged yet.

That works if you own a website and can change its server-rendered HTML. If you don't, Embed Generator now builds the whole thing for you and hands you a URL to paste into Discord.

<!--truncate-->

## What a component embed actually is

A normal link preview comes from Open Graph tags. Discord reads `og:title`, `og:description`, `og:image` and friends, then draws a card. A component embed skips that card and renders components instead: markdown text with headings and lists, an accent-colored container, image galleries, thumbnails, separators, and buttons that link out.

It is display only. Buttons can open a URL, but nothing sends an interaction back, so there is no app to create and no bot to invite. Anyone who pastes the link gets the layout, including people who aren't in your server.

## Building one in Embed Generator

Open the [embed links tool](https://message.style/app/tools/embed-links). Fill in the URL you want people to land on, then the title, description, color and image. Those fields are the fallback preview: they are what Slack, Twitter, iMessage and every other platform shows, and what Discord falls back to when it can't render your component.

Turn on **Custom Component** and the editor gives you the same component builder the message editor uses. Add text displays for markdown, a media gallery for screenshots, a section with a thumbnail or a link button beside it, separators between blocks, and rows of link buttons. The preview on the right shows what Discord will render.

Hit **Create Link** and you get a `message.style/e/...` URL. Paste it into any Discord channel and it unfurls into your container.

## What Discord allows inside one

A component embed is a read-only subset of message components, and Discord drops the entire payload if anything falls outside it. The parts you can use are containers, sections, text displays, thumbnails, media galleries, separators, action rows and buttons. Select menus and file components are out.

Buttons have to be link buttons, carrying a `url` and a label or an emoji. A button with a `custom_id` invalidates the payload, and so does an `id` on any component.

The size limits are worth knowing before you design something large. A payload holds at most 40 components. A container holds 1 to 10 children, an action row 1 to 5 buttons, a section 1 to 3 text displays, and a media gallery up to 10 items. Any URL is capped at 2,048 characters. Embed Generator checks all of this before it gives you a link, so a broken payload fails with a message instead of silently falling back.

## If you are adding this to your own site

The tool exists because most people don't want to hand-write this, but the payload itself is small. Put the JSON in a `<script>` in the `<head>` of the HTML your server sends:

```html
<script id="discord:component-embed" type="application/json">
{
  "component": {
    "type": 17,
    "accent_color": 5793266,
    "components": [
      { "type": 10, "content": "# Patch Notes\n- Fixed a bug with treasure chests\n- Improved server stability" }
    ]
  }
}
</script>
```

Four things catch people out. Discord executes no JavaScript, so a tag injected by a client-side framework is never seen. The crawler identifies itself as `Discordbot/2.0` and is routinely blocked by WAF and bot-protection rules, so check that a request with that user agent gets a `200`. The whole fetch, including every image in your payload, has to finish inside 10 seconds. And ship Open Graph tags alongside the payload, because they are what renders anywhere a component embed can't be used.

Previews are cached for about 30 minutes, so editing your tags and resharing the same URL shows the old card. Share it with a new query string like `?v=2` to see changes immediately, or run the URL through Discord's [embed debugger](https://discord.com/developers/embeds). Changing only the `#fragment` does not work, since fragments aren't part of the cache key.
