---
sidebar_position: 8
description: Send embeds to Fluxer with Embed Generator. Paste a Fluxer webhook URL, build the message with embeds, a custom name and avatar, then send, edit or restore it. No bot required.
---

# Fluxer

[Fluxer](https://fluxer.app) is an open source chat platform whose webhooks take the same messages as Discord's. Embed Generator sends to them too: paste a Fluxer webhook URL where you would paste a Discord one and the editor switches to what Fluxer supports.

## Send a message to Fluxer

1. In Fluxer, create a webhook in the settings of the channel you want to post in and copy its URL. It starts with `https://api.fluxer.app/webhooks/`.
2. Open the [editor](https://message.style/app), choose **Webhook** as the target and paste the URL.
3. Build the message and click **Send Message**.

Paste the link of a message you sent into **Message ID or URL** to edit it later, or click **Restore Message** to load it back into the editor.

## What works on Fluxer

- Content with Markdown, mentions and timestamps
- Up to 10 embeds with every embed field, including images from attachments
- A custom name and avatar for each message
- File attachments

## What doesn't

Fluxer doesn't support components yet, so buttons, select menus and [Components V2](./components-v2) layouts can't be sent there. While a Fluxer webhook is the target, the editor hides them, and a message that already has them can't be sent until they are removed.

Fluxer has no threads, so there is no thread ID to fill in. Editing a message changes its content and embeds but keeps the files it was sent with, as Fluxer can't replace them.

[Interactive components](./interactive-components), [scheduled messages](../guides/scheduled-messages) and [custom commands](../guides/custom-commands) run through the Embed Generator bot, which is only on Discord.
