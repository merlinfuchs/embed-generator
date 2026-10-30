---
sidebar_position: 10
description: "Link to a Discord message so it opens in the Embed Generator editor: put the message JSON in the data parameter as URL-safe base64. Discohook links work too."
---

# Message Links

A message link opens a message in the editor, ready to edit and send. Use it to add an **Open in Embed Generator** button to your bot, docs or tool.

```
https://message.style/app/editor/open?data=<message>
```

`<message>` is the message as JSON, encoded as URL-safe base64 without padding. The JSON is what the editor's **JSON Code** view shows: the fields Discord takes for a webhook message, like `content`, `embeds` and `components`, plus `actions` for what buttons and select menus do.

```js
const message = { content: "Hello!", embeds: [{ title: "Welcome" }] };
const bytes = new TextEncoder().encode(JSON.stringify(message));
const data = btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const url = `https://message.style/app/editor/open?data=${data}`;
```

The editor shows a preview first and only replaces the current message when you click **Restore**.

## Discohook links

Links in Discohook's format work too, with the messages in a `messages` list. Replace `discohook.app` with `message.style` and the link opens here. The editor holds one message at a time, so only the first one is opened. See [Migrating from Discohook](./migrating-discohook) for moving your backups over.
