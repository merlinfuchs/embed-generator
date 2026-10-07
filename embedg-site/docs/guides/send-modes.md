---
sidebar_position: 1
description: "Embed Generator sends messages through a Discord webhook URL or through the bot to a channel you pick. What each mode can do, from buttons and editing to scheduling, and which one to use."
---

# Webhook or Channel?

The editor sends a message in one of two ways, picked with the **Webhook** and **Channel** tabs at the top.

- **Webhook**: you paste a webhook URL from Discord and the message goes straight to that channel. No login and no bot needed.
- **Channel**: you log in with Discord, pick a server and channel, and the Embed Generator bot sends the message. The bot has to be on the server.

The message looks the same either way, with your custom name and avatar. The difference is what can happen after it's sent. Clicking a button or picking an option in a select menu sends an interaction to whoever posted the message, and only the bot can receive it. A webhook URL can't.

## What each can do

|                                               | Webhook                       | Channel                                  |
| --------------------------------------------- | ----------------------------- | ---------------------------------------- |
| Login needed                                  | No                            | Yes                                      |
| Bot on the server                             | No                            | Yes                                      |
| Content, embeds, files, Components V2         | Yes                           | Yes                                      |
| Link buttons                                  | Yes                           | Yes                                      |
| Buttons with actions and select menus         | No                            | Yes                                      |
| Custom name and avatar per message            | Yes                           | Yes                                      |
| Edit a sent message                           | Messages sent by that webhook | Messages Embed Generator sent there      |
| Post in an existing thread                    | Yes, with the thread ID       | Yes, pick the thread in the channel list |
| Start a forum post                            | No                            | Yes                                      |
| [Message variables](./variables.md)           | No, they're sent as text      | Yes                                      |
| [Scheduled messages](./scheduled-messages.md) | No                            | Yes                                      |
| Send as [your own bot](./custom-bots.md)      | No                            | Yes, with Premium                        |
| [Fluxer](../features/fluxer.md)               | Yes                           | No                                       |

## Which one to use

Use **Webhook** for messages people only read, like an announcement or a rules post with link buttons. It's the quickest way to send, and nothing besides the webhook gets access to your server. [Sending Messages with Webhooks](./webhooks.md) shows how to create one.

Use **Channel** when the message should do something, like buttons that hand out roles or select menus that reply. It's also the way to go if you want to schedule messages or not deal with webhook URLs at all. Both you and the bot need **View Channel** and **Manage Webhooks** in the channel, see [Channel Permissions](./channel-permissions.md) if a channel is greyed out.

If you start with a webhook and later add a button with an action, the editor shows a warning with a **Switch to Channel** button. The message stays as it is when you switch, you only pick a server and channel instead of the webhook.
