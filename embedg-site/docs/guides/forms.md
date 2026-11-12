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

   Select menus, radio buttons and checkboxes have **Options**. Each option has a **Label** that members see, a **Value** that you can use in variables, an optional **Description**, and whether it is picked by default. A select menu can have up to 25 options and picks 1 by default, set **Max Values** to allow more. Radio buttons need 2 to 10 options and members pick exactly one. Checkboxes have 1 to 10 options, and **Max Values** limits how many can be checked; it is all of them if you leave it empty.

   A single checkbox is a yes or no question. Tick **Checked by Default** to have it start checked.
5. Add the **Actions** that run when a member submits the form. They work like the actions of a button, for example a text response, a message to another channel, or adding a role.

A server can have up to 25 forms.

## Opening a Form

A form opens from a button, a select menu option or a custom command that has a **Show Form** action:

1. Open the component or command and click **Add Action**.
2. Set the type to **Show Form** and pick your form.

Opening the form is the reply to the click or command, so **Show Form has to be the last action**. Actions before it can still check permissions, but they can't reply, because a pop-up can only be the first reply.

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

Send the answers to your moderators by adding a **Text Message to Channel** action that posts `{{.User.Mention}} reported: {{.Form.reason}}` to a staff channel. Sending to another channel needs [Embed Generator Premium](../premium).

A form with a user select called `target` and a text field called `reason` can post `{{.User.Mention}} reported {{.Form.target}}: {{.Form.reason}}`.

The other [variables](./variables) like the member's name or the server's name work in a form's actions too.

## Good to Know

- Pinging users from a select field works like any other mention in a reply. Role mentions only ping when the action allows role mentions.
- A form can't open another form, and its actions can't edit a message, because the pop-up has no message of its own.
- Members can type anything, including mentions. Only turn on **Ping Roles** for an action if you want a role in the answer to be pinged.
- If you delete a form, the buttons and commands that open it show an error instead.
