---
slug: fluxer-embeds
title: Send Embeds to Fluxer With Embed Generator
description: Embed Generator now sends messages to Fluxer webhooks. Paste a Fluxer webhook URL, build embeds with a custom name and avatar, and send, edit or restore them without a bot.
authors: [merlin]
tags: [fluxer, webhooks, embeds]
draft: true
---

Embed Generator can now send messages to [Fluxer](https://fluxer.app). Paste a Fluxer webhook URL into the editor where you would paste a Discord one, build your embeds and hit send.

<!--truncate-->

For a while we supported Guilded the same way, until Roblox shut it down in December 2025. Fluxer is a better fit anyway. It's an open source chat platform that launched in January, and its webhooks follow Discord's closely: the same URL shape, the same embed format and the same Markdown, down to `<t:...>` timestamps and `-#` subtext. A message you built for Discord mostly works on Fluxer as it is.

To try it, create a webhook in the settings of a Fluxer channel and copy the URL, which starts with `https://api.fluxer.app/webhooks/`. In the [editor](https://message.style/app), pick Webhook as the target and paste it. The editor recognizes the URL and adjusts to what Fluxer can show. Content, up to 10 embeds with every field, file attachments and a custom name and avatar per message all go through. You can edit a message after sending it by pasting its link, or restore it into the editor to pick up where you left off. The [Webhook Info tool](https://message.style/app/tools/webhook-info) reads Fluxer webhooks as well.

The part that doesn't carry over is components. Fluxer has no buttons, select menus or Components V2 layouts yet, so the editor hides them while a Fluxer webhook is the target and won't send a message that still has them. The same goes for everything that runs through the Embed Generator bot, like buttons that hand out roles, scheduled messages and custom commands, since the bot only lives on Discord. Fluxer's roadmap lists buttons and interactions, and we'll look at it again once they exist.

Two smaller differences: Fluxer has no threads, so the thread ID field disappears, and editing a Fluxer message changes its content and embeds but keeps the original files, because Fluxer's edits can't replace them.

The [Fluxer docs page](/docs/features/fluxer) has the details.
