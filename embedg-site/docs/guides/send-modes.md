---
sidebar_position: 1
description: "Embed Generator sends messages through the bot to a channel you pick, or through a Discord webhook URL. What each mode can do, from buttons and editing to scheduling, and which one to use."
---

# Webhook or Channel?

The editor sends a message in one of two ways, picked with the **Webhook** and **Channel** tabs at the top. We recommend Channel, it supports every feature. Webhook is for when you don't want to log in or add the bot to your server.

- **Channel**: you log in with Discord, pick a server and channel, and the Embed Generator bot sends the message. The bot has to be on the server.
- **Webhook**: you paste a webhook URL from Discord and the message goes straight to that channel. No login and no bot needed.

Channel mode uses a webhook under the hood too. The first time you send to a channel, the bot creates a webhook there and keeps using it, so you never copy a URL. That's why both you and the bot need the **Manage Webhooks** permission, and why the message looks the same in both modes, with your custom name and avatar. The one exception is [your own bot](./custom-bots.md): without a custom name or avatar, it sends the message as itself.

What the bot adds is everything that happens around the message. Clicking a button or picking an option in a select menu sends an interaction to the bot, and a webhook URL can't receive it. The bot also fills in variables, runs schedules and can edit any message Embed Generator sent in a channel.

## What each can do

|                                               | Channel                                  | Webhook                       |
| --------------------------------------------- | ---------------------------------------- | ----------------------------- |
| Login needed                                  | Yes                                      | No                            |
| Bot on the server                             | Yes                                      | No                            |
| Content, embeds, files, Components V2         | Yes                                      | Yes                           |
| Link buttons                                  | Yes                                      | Yes                           |
| Buttons with actions and select menus         | Yes                                      | No                            |
| Custom name and avatar per message            | Yes                                      | Yes                           |
| Edit a sent message                           | Messages Embed Generator sent there      | Messages sent by that webhook |
| Post in an existing thread                    | Yes, pick the thread in the channel list | Yes, with the thread ID       |
| Start a forum post                            | Yes                                      | No                            |
| [Message variables](./variables.md)           | Yes                                      | No, they're sent as text      |
| [Scheduled messages](./scheduled-messages.md) | Yes                                      | No                            |
| Send as [your own bot](./custom-bots.md)      | Yes, with Premium                        | No                            |
| [Fluxer](../features/fluxer.md)               | No                                       | Yes                           |

## Which one to use

Use **Channel** unless you have a reason not to. Everything in the table except Fluxer works there, and you never have to handle webhook URLs. Both you and the bot need **View Channel** and **Manage Webhooks** in the channel, see [Channel Permissions](./channel-permissions.md) if a channel is greyed out.

Use **Webhook** if you don't want to log in, or can't add the bot to the server. Content, embeds, link buttons and Components V2 all work, which covers announcements and rules posts. [Sending Messages with Webhooks](./webhooks.md) shows how to create one. It's also the only way to send to [Fluxer](../features/fluxer.md).

If you start with a webhook and later add a button with an action, the editor shows a warning with a **Switch to Channel** button. The message stays as it is when you switch, you only pick a server and channel instead of the webhook.
