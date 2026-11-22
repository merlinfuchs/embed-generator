---
sidebar_position: 4.5
description: "How to make a form in Discord with Embed Generator: ask members for text or choices, open the form from a button, select menu, or custom command, and use the answers in a reply."
---

# Forms

Forms are pop-ups that ask members for an answer, like a report, a suggestion, or an application. Members can type text or pick from options, members, roles, or channels. You build the form once and open it from a button, a select menu, or a [custom command](./custom-commands). Then you choose what happens when someone submits it, like a reply that quotes what they wrote.

Every plan can use forms. A server can have 3 forms for free, 10 with [Embed Generator Premium](../premium), and 25 with Ultimate. The actions that run when a form is submitted have the same [limits](../premium) as the actions of buttons and select menus.

## Creating a Form

1. Open **Forms** in the sidebar and pick your server at the top.
2. Click **New Form** and give it a **Name**. Only you see the name, when you pick the form later.
3. Set the **Title**. It's the heading of the pop-up in Discord.
4. Add up to 5 **Fields**, one for each question. [Field Settings](#field-settings) lists what each one can do.
5. Add the **Actions** that run when a member submits the form. They work like the actions of a button, for example a text response, a message to another channel, or adding a role.

## Field Settings

Every field has:

- A **Label**, the question members see.
- A **Variable Name** that puts the answer into a reply. It follows the label until you change it yourself.
- A **Type**. Pick **Text** for a text box. Pick **Select Menu**, **Radio Buttons**, **Checkboxes**, or **Single Checkbox** for choices you write yourself. Pick **User Select**, **Role Select**, **User & Role Select**, or **Channel Select** to let members pick from your server.
- An optional **Placeholder**, the grey hint text. Text boxes and select menus have one.
- **Required**, for questions members have to answer before they can submit. A single checkbox is never required.

Text fields also have:

- A **Preset Value**, text that's already in the box when the form opens.
- A **Style**, **Single Line** or **Multiple Lines** for longer answers.
- An optional **Min Length** and **Max Length**. Discord allows up to 4000 characters.

User, role, and channel selects have **Max Values**, how many a member can pick. It's 1 by default and goes up to 25.

Select menus, radio buttons, and checkboxes have **Options**. Each option has a **Label** that members see, a **Value** you can use in variables, an optional **Description**, and whether it's picked by default.

- A select menu has up to 25 options. Members pick 1 unless you raise **Max Values**.
- Radio buttons need 2 to 10 options, and members pick exactly one.
- Checkboxes have 1 to 10 options. **Max Values** limits how many can be checked. Leave it empty to allow all of them.

A single checkbox is a yes or no question. Tick **Checked by Default** to have it start checked.

## Opening a Form

A form opens from a button, a select menu option, or a custom command with a **Show Form** action:

1. Open the button, option, or command and click **Add Action**.
2. Set the type to **Show Form** and pick your form.

Discord only shows a pop-up as the first answer to a click or command. So Show Form has to be the last action, and no action before it can send a reply. Actions before it can still check permissions, or add and remove roles with **Default Response** turned off.

## Using What Members Entered

In a form's actions, `{{.Form.variable_name}}` puts in the answer to a field, using the field's variable name. For a text field, it's what the member typed. If an optional field was left empty, the variable is empty too.

For the other types:

| Type                           | `{{.Form.variable_name}}`                                             | `{{.FormIDs.variable_name}}`                          |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| User, role, channel select     | Mentions of what was picked, separated by spaces, like `<@123> <@456>` | The IDs, separated by spaces                          |
| Select menu, radio, checkboxes | The labels of the picked options, separated by commas                 | The values of the picked options, separated by commas |
| Single checkbox                | `Yes` or `No`                                                         | `true` or `false`                                     |

Picks from a user, role, or channel select show up as mentions in your reply.

A form with a field called `reason` can reply with:

```
Thanks {{.User.Mention}}, your report was received. You wrote: {{.Form.reason}}
```

`{{.FormIDs.variable_name}}` helps in conditions. `{{if eq .FormIDs.agreed "true"}}Thanks for agreeing!{{end}}` only replies to members who checked a box called `agreed`.

The other [variables](./variables), like the member's name or the server's name, work in a form's actions too.

To send the answers to your moderators, click **Post Answers to a Channel** under your form's actions and pick a staff channel. It adds an action that posts every answer under its question, and you can edit the text like any other response. Sending to another channel needs [Premium](../premium).

A form with a user select called `target` and a text field called `reason` can post `{{.User.Mention}} reported {{.Form.target}}: {{.Form.reason}}`.

## Sending Answers to Other Tools

A form can send its answers to another tool, like Zapier, n8n, Make, or your own server. That's how answers end up in a spreadsheet or start a workflow there. This needs [Premium](../premium).

1. In the tool, create a webhook trigger and copy the URL it gives you. The URL has to start with `https://`.
2. In your form's actions, add a **Send Answers to URL** action and paste the URL.
3. Save the form.

The answers go out after the member submits the form, and the member doesn't wait for your tool. They get the form's other replies as usual. Unless you turn off **Default Response**, they also see "Thanks, your answers were submitted."

If your tool can't be reached or answers with an error, the form's card on the Forms page shows what went wrong. Saving the form clears it.

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

`value` and `ids` hold what `{{.Form.variable_name}}` and `{{.FormIDs.variable_name}}` give you, with `ids` as a list. `guild_id` is your server's ID.

### Checking That Answers Come From Embed Generator

Anyone who knows the URL can send requests to it. To make sure a request comes from Embed Generator, check its signature with the form's **Signing Secret**. The form shows it once it has a Send Answers to URL action. Each request has two headers:

- `X-Signature-Timestamp`, when it was sent, in seconds since 1970.
- `X-Signature-256`, `sha256=` followed by the hex HMAC-SHA256 of the timestamp, a `.`, and the body, with the signing secret as the key.

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
- The URL has to use port 443 or 8443 and point to a public address. Addresses in private networks, like `localhost` or `192.168.0.1`, don't work.
- Redirects aren't followed, so use the final URL.
- Your tool has 10 seconds to answer. If it can't be reached, or answers with a status of 429 or 500 and above, the answers are sent once more after 2 seconds.

## Good to Know

- Members can type anything into a text field, including mentions. Roles in an answer only get pinged when the action has **Ping Roles** turned on, so leave it off unless you want that.
- Mentions of users picked in a select field work like any other mention in a reply.
- A form can't open another form. Its actions can't edit a message either, because the pop-up has no message of its own.
- If you delete a form, the buttons and commands that open it show an error instead.
