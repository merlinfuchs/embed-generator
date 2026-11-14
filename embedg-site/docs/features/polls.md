---
sidebar_position: 9
description: Add a Discord poll to a message in the Embed Generator editor. Write the question and answers, pick how long it stays open and send it through a webhook or the bot.
---

# Polls

A poll lets members vote on a question straight from the message. Embed Generator adds one to the message you are building, and Discord shows it below the embeds.

## Add a poll

1. Open the [editor](https://message.style/app/editor) and make sure **Embeds V1** is selected. Polls can't be used with [Components V2](./components-v2).
2. Open the **Poll** section and click **Add Poll**.
3. Write the question and the answers. Each answer can have an emoji next to it.
4. Choose how long the poll stays open, and whether members can pick more than one answer.
5. Send the message. A poll doesn't need any content or embeds, it can be the whole message.

The preview shows the poll the way Discord does before anyone has voted.

## Limits

- A question of up to 300 characters.
- Up to 10 answers, each up to 55 characters.
- A poll stays open for 1 hour up to 32 days. The editor offers the same choices as Discord, from 1 hour to 2 weeks, plus 32 days.
- One poll per message.

## Editing a message with a poll

Discord can't change a poll once the message is sent. Editing the message changes everything else, but the poll stays as it was sent. To change the poll, send the message again as a new message.

**Restore Message** loads the poll of a message back into the editor, so you can send a copy of it. Votes aren't copied.

## Where polls don't work

- Components V2 messages, which Discord doesn't allow a poll in.
- [Fluxer](./fluxer) webhooks. The editor asks you to remove the poll before sending to Fluxer.
- Replies that a button, select menu or command sends, as Discord has no poll in those.
