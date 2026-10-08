---
sidebar_position: 9
description: Why a channel is greyed out in the Embed Generator channel picker, and how to fix the Discord permissions so you and the bot can send there.
---

# Channel Permissions

To send to a channel through the bot, both you and the Embed Generator bot need the **View Channel** and **Manage Webhooks** permissions in that channel. If either of you is missing one, the channel is greyed out in the picker. Hover the icon next to it to see whether it's you or the bot.

The server owner always has every permission, so for them it's always the bot.

## Why it can be missing even though the role has it

Giving a role Manage Webhooks under **Server Settings > Roles** isn't always enough. Each channel and category has its own permission settings that can take a permission away from a role, and those win over the server settings.

So if the role has Manage Webhooks but a channel is still greyed out, that channel (or its category) most likely has a red X on **Manage Webhooks** or **View Channel** for @everyone or for one of your or the bot's roles.

## Fix it

You need to be able to manage the channel for this. If the icon says *you* are missing the permission and you can't change channel settings, ask a server admin.

1. Hover the channel in Discord, click the gear icon (**Edit Channel**) and open **Permissions**.
2. Under **Advanced permissions**, click the **+** next to Roles/Members and add the role that's missing the permission. For the bot that's the **Embed Generator** role, unless someone renamed it.
3. Give that role a green check for **View Channel** and **Manage Webhooks** and save.

A green check on a role wins over a red X on @everyone or on another role. Don't remove the red X on @everyone for View Channel in a private channel, that makes the channel visible to everyone.

If only some channels in a category work, the others probably have their own settings. The Permissions page says whether a channel is synced with its category. Fix each channel that isn't, or sync it again.

Changes can take up to two minutes to show up in the picker.

## Actions that send to other channels

The [Other Channel](./interactive-components#text-response) target of an action works differently, because the bot posts the message itself instead of through a webhook.

- You need **Manage Webhooks** in **Server Settings > Roles**, on one of your roles or through Administrator. Channel settings don't count here, neither to grant it nor to take it away. Without it every channel in the picker is greyed out.
- The bot needs **Send Messages** in the channel, or **Send Messages in Threads** for a thread. Fix it in the channel's permission settings as described above, with Send Messages instead of Manage Webhooks.
- To send a saved message with embeds, the bot also needs **Embed Links** in the channel. Webhooks don't need it, so it's easy to miss. The editor warns you when it's missing.
- Forum and media channels can't be picked themselves. Pick one of their posts instead.

What counts is the permission of whoever sent the message or saved the command, at the time they did. If the action says its creator is missing the permission, send the message again as someone who has it.
