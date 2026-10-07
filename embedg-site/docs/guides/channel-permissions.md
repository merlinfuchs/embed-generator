---
sidebar_position: 8
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
