---
sidebar_position: 10
description: Build several Discord messages in the Embed Generator editor and send them together, one after the other, through a webhook or the bot.
---

# Multiple Messages

Some posts need more than one message, like a rules channel with a banner, the rules and a role menu. The editor can hold up to 10 messages and send them together, in order.

## Add a message

1. Open the [editor](https://message.style/app/editor) and click **Add Message** in the menu bar.
2. Pick a template or start from a blank message, the same way as when you clear the editor.
3. Tabs for **Message 1**, **Message 2** and so on show up above the menu bar. Click a tab to edit that message.

Only one message is in the editor at a time, and the preview shows the one that's open. Each message keeps its own attachments and its own Message ID.

Next to the tabs you can move the open message left or right, duplicate it, or delete it. A duplicate is a new message, so it isn't linked to a message that was already sent.

## Send them together

With more than one message, the send menu shows **Messages to send**. Untick the ones you don't want to send this time. Clicking **Send** sends the ticked messages one after the other, in the order of the tabs.

If a message can't be sent, for example because it has errors or a webhook can't send its buttons, nothing is sent and the editor opens that message. If a message fails partway through, the messages before it stay sent.

When you send to a forum or media channel, the first message creates the post and the others are sent into it.

## Edit them later

After sending, each message remembers the message it was sent as. Once every ticked message has one, **Edit Messages** updates all of them in place. The Message ID field always belongs to the message that's open, so you can also point a single tab at a message that's already in Discord.

## Limits

- Up to 10 messages in the editor at once.
- Attachments are kept until you close or reload the page, like the attachments of a single message.
- Saved messages, shared links and the JSON editor work on the message that's open.
