---
sidebar_position: 1
description: How to send a Discord message with a webhook using Embed Generator. Create the webhook in Discord, paste the URL into the editor, design the embed and send. No bot, no code.
---

# Sending Messages with Webhooks

A Discord webhook is a URL that anyone can post messages to. Discord creates it for a specific channel, and Embed Generator uses it to deliver the message you built in the editor. Webhooks are the quickest way to send an embed: no bot invite, no login required.

## Create a webhook in Discord

You need the **Manage Webhooks** permission in the channel.

1. Open the channel settings, or the server settings.
2. Go to **Integrations** and then **Webhooks**.
3. Click **New Webhook**. Give it a name and avatar if you like, these are the defaults that Embed Generator can override per message.
4. Click **Copy Webhook URL**.

**Anyone with the URL can post to that channel.** Treat it like a password, and delete the webhook in Discord if it ever leaks.

## Send a message with Embed Generator

1. Open the [editor](https://message.style/app).
2. At the top, choose **Webhook** as the target and paste the URL.
3. Build your message: content, embeds, images, or a [Components V2](../features/components-v2) layout. Optionally set a username and avatar for this message.
4. Click **Send Message**.

The message appears in the channel right away. Sending the same message again edits nothing, it posts a new one.

## What webhooks can and can't do

Webhooks can send content, embeds, files and Components V2 layouts, with a custom name and avatar per message.

Webhooks can't handle clicks. Buttons that hand out roles, select menus and slash commands need the Embed Generator bot on your server, because something has to receive the interaction. Log in, invite the bot, and pick a channel as the target instead of a webhook to use [interactive components](./interactive-components).

## Inspect a webhook URL

If you have a webhook URL and don't know where it came from, paste it into the [Webhook Info tool](https://message.style/app/tools/webhook-info). It shows the webhook's name, avatar and who created it.
