---
sidebar_position: 4.5
description: "How to ask members for text in Discord with Embed Generator: build a form, open it from a button, select menu or custom command, and use what members typed in a reply."
---

# Forms

Forms are pop-ups that ask a member to fill in some text, like a report, a suggestion, or an application. You build the form once, open it from a button, a select menu or a [custom command](./custom-commands), and choose what happens when a member submits it, for example a reply that includes what they wrote.

Forms are available on every plan. The actions that run when a form is submitted follow the same [limits](../premium) as the actions of buttons and select menus.

## Creating a Form

1. Open **Forms** in the sidebar and select your server at the top.
2. Click **New Form** and give it a **Name**. The name is only for you and what you see when you pick the form later.
3. Set the **Title**. This is the heading of the pop-up in Discord.
4. Add up to 5 **Fields**. Each field has:
   - A **Label** that tells members what to enter or pick.
   - A **Variable Name** that you use to insert the answer into a reply. It follows the label until you change it by hand.
   - A **Type**: **Text** for a text box, **Select Menu**, **Radio Buttons**, **Checkboxes** or a **Single Checkbox** for choices you write yourself, or a select menu that picks a **User**, a **Role**, a **User & Role** or a **Channel**.
   - An optional **Placeholder**, the grey hint text. Text boxes and select menus have one.
   - Whether it is **Required**. A single checkbox is never required.

   A text field also has a **Preset Value**, text that is already in the box when the form opens, a **Style** (a single line or multiple lines for longer answers), and an optional **Min Length** and **Max Length**. Discord allows up to 4000 characters.

   A user, role, mentionable or channel select has **Max Values**, how many a member can pick. It is 1 by default and can be up to 25.

   Select menus, radio buttons and checkboxes have **Options**. Each option has a **Label** that members see, a **Value** that you can use in variables, an optional **Description**, and whether it is picked by default. A select menu can have up to 25 options and picks 1 by default, set **Max Values** to allow more. Radio buttons need 2 to 10 options and members pick exactly one. Checkboxes have 1 to 10 options. **Max Values** limits how many can be checked, and leaving it empty allows all of them.

   A single checkbox is a yes or no question. Tick **Checked by Default** to have it start checked.
5. Add the **Actions** that run when a member submits the form. They work like the actions of a button, for example a text response, a message to another channel, or adding a role.

A server can have 3 forms on the free plan, 25 with Premium and 100 with Ultimate. See [Embed Generator Premium](../premium).

## Opening a Form

A form opens from a button, a select menu option or a custom command that has a **Show Form** action:

1. Open the component or command and click **Add Action**.
2. Set the type to **Show Form** and pick your form.

Opening the form is the reply to the click or command, and a pop-up can only be the first reply. Show Form has to be the last action, and no action before it can reply. Actions before it can still check permissions, or add and remove roles with **Default Response** turned off.

## Using What Members Entered

In the actions of a form, insert the answer of a field with `{{.Form.variable_name}}`, using the variable name of the field. For a text field that is what the member typed. For a select field it is a mention of everything they picked, separated by spaces, like `<@123> <@456>`, so users, roles and channels show up as mentions in your reply. If nothing was picked in an optional field, it is empty.

What you get for the other types:

| Type                          | `{{.Form.variable_name}}`                              | `{{.FormIDs.variable_name}}`                      |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| User, role, channel select    | Mentions of what was picked, separated by spaces       | The IDs, separated by spaces                      |
| Select menu, radio, checkboxes | The labels of the picked options, separated by commas | The values of the picked options, separated by commas |
| Single checkbox               | `Yes` or `No`                                          | `true` or `false`                                 |

For example, `{{if eq .FormIDs.agreed "true"}}Thanks for agreeing!{{end}}` only replies to members who checked a box called `agreed`.

For example, a form with a field called `reason` can reply with:

```
Thanks {{.User.Mention}}, your report was received. You wrote: {{.Form.reason}}
```

To send the answers to your moderators, click **Post Answers to a Channel** under the actions of your form and pick a staff channel. It adds an action that posts every answer under its label, and you can change the text like any other response. Sending to another channel needs [Embed Generator Premium](../premium).

A form with a user select called `target` and a text field called `reason` can post `{{.User.Mention}} reported {{.Form.target}}: {{.Form.reason}}`.

The other [variables](./variables) like the member's name or the server's name work in a form's actions too.

## Sending Answers to Other Tools

A form can send its answers to another tool, like Zapier, n8n, Make or your own server, to save them in a spreadsheet or start a workflow there. This needs [Embed Generator Premium](../premium).

1. In the tool, create a webhook trigger and copy the URL it gives you. The URL has to start with `https://`.
2. In the actions of your form, add a **Send Answers to URL** action and paste the URL.
3. Save the form.

The answers are sent after the member submits the form, and the member doesn't wait for your tool. They get the form's other replies as usual, plus "Thanks, your answers were submitted." unless you turn off **Default Response**. If your tool can't be reached or answers with an error, the form's card on the Forms page shows what went wrong. Saving the form clears it.

Each submission is a `POST` request with a JSON body like this:

```json
{
  "type": "form_submission",
  "form": { "id": "a1b2c3", "name": "Report" },
  "guild_id": "123456789012345678",
  "channel_id": "234567890123456789",
  "user": { "id": "345678901234567890", "username": "ana", "global_name": "Ana" },
  "fields": [
    { "key": "reason", "label": "Reason", "type": "text", "value": "Spam in #general", "ids": [] },
    { "key": "target", "label": "Who", "type": "user", "value": "<@456789012345678901>", "ids": ["456789012345678901"] }
  ],
  "submitted_at": "2026-11-14T12:00:00Z"
}
```

`value` and `ids` have what `{{.Form.variable_name}}` and `{{.FormIDs.variable_name}}` have, with `ids` as a list. `guild_id` is the ID of your server.

### Checking that answers come from Embed Generator

Anyone who knows the URL can send requests to it. To make sure a request comes from Embed Generator, check its signature with the form's **Signing Secret**, which the form shows once it has a Send Answers to URL action. Each request has two headers:

- `X-Signature-Timestamp`, the time it was sent in seconds since 1970.
- `X-Signature-256`, `sha256=` followed by the hex HMAC-SHA256 of the timestamp, a `.`, and the body, using the signing secret as the key.

In Node.js:

```js
const crypto = require("crypto");

function isFromEmbedGenerator(secret, timestamp, signature, rawBody) {
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
  return (
    fresh &&
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}
```

Use the body exactly as it arrived, before parsing it. Rejecting old timestamps stops someone from sending a request they caught again later.

### Limits

- A form can send its answers to one URL.
- A server can send up to 60 submissions a minute. Answers over that aren't sent.
- The URL has to use port 443 or 8443 and point to a public address. Addresses in private networks, like `localhost` or `192.168.0.1`, don't work.
- Redirects aren't followed. Use the final URL.
- Your tool has 10 seconds to answer. If it can't be reached or answers with a status of 429 or 500 and above, the answers are sent once more after 2 seconds.

## Good to Know

- Pinging users from a select field works like any other mention in a reply. Role mentions only ping when the action allows role mentions.
- A form can't open another form, and its actions can't edit a message, because the pop-up has no message of its own.
- Members can type anything, including mentions. Only turn on **Ping Roles** for an action if you want a role in the answer to be pinged.
- If you delete a form, the buttons and commands that open it show an error instead.
