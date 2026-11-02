# Embed Generator facts sheet

```
Product: Embed Generator
One-line description: A visual editor for Discord messages. Build embeds, buttons, and select menus in the browser, then send them through a webhook or the Embed Generator bot.
Who it's for: Discord server owners, admins, and moderators who post announcements, rules, role menus, and other messages that need to look a certain way.
Reader's technical level: Server admins, mostly non-technical. They know Discord's own words, like server, channel, role, embed, slash command, and permission. Webhook is fine because the editor asks for a webhook URL, but say where to get one. Explain or avoid JSON, bot token, interaction, intent, and API.
Situations that bring people here:
- Posting rules or an announcement that looks better than a plain text message.
- A role menu where members pick their own roles with buttons or a select menu.
- A message that goes out on a schedule, once or every few hours, days, weeks, or months.
- Sending as a webhook with any name and avatar, without adding a bot.
- Moving over from Discohook, or opening a message someone shared as a link.
- A custom slash command, like /rules, that replies with a prepared message.
- Editing a message that was already sent, or copying one from another server.
Main alternatives:
- Discohook, also free and open source. It has welcome and goodbye messages, reaction roles, and flows with conditions. Checked 2026-10-30 for the Discohook comparison post.
- Discord's own message box, which can't build embeds or buttons.
- Writing embed JSON by hand or with a general bot.
Why pick this one: Buttons and select menus that hand out roles, recurring scheduled messages, custom slash commands, and an AI assistant, all set up on one website, with nothing configured through commands in Discord. Free and open source under the MIT license.

Features (feature | what it means for the user | free or paid):
- Visual editor with a live preview | see the message the way Discord shows it before sending | free
- Send through a webhook without logging in | post with any name and avatar, no bot needed | free
- Send to a channel through the bot (Channel mode) | pick a server and channel instead of pasting a webhook URL | free
- Components V2 layouts: containers, sections, separators, media galleries | messages that look more like a page than an embed | free
- Buttons and select menus with actions: add, remove, or toggle roles, reply, send a DM, edit the message, check a permission | role menus and self-service replies without another bot | free, more actions per component on paid plans
- Send a message to another channel from a button, select menu, or command | reports go to a staff channel | paid
- Build the reply message inside the action instead of picking a saved message | one less saved message per reply | paid
- Saved messages | reuse a message instead of rebuilding it | free, more on paid plans
- Earlier versions of a saved message, kept when it's overwritten | go back to an older version | paid
- Variables like the member's name or the server's member count | the message fills in details when it goes out | free
- Scheduled messages: once, on a regular interval, or on a list of dates, with a calendar view | post on time without being online | one-time free, 1 recurring free, more on paid plans
- AI assistant | describe the message and it builds it in the editor | 5 prompts a month free, more on paid plans
- Custom bot | replies to buttons and custom commands use your bot's name and avatar | paid
- Custom commands | slash commands for your members that reply with your messages | paid
- Restore and edit sent messages | fix a typo in a message that's already posted | free
- Import Discohook JSON, backups, and ?data= links | bring existing messages over without rebuilding them | free
- Fluxer webhooks | send the same messages to Fluxer | free
- /embed, /message, /format, and /image in Discord | build or copy messages without opening the website | free

Plan limits are read from the prod config on 2026-11-02. That file is the source of truth. https://message.style/api/premium/plans serves the paid plans from it, but not the free one. embedg.example.toml is the dev config and doesn't match production.

Free plan:
- 25 saved messages, with no earlier versions kept.
- 3 actions per button or select menu.
- 5 scheduled messages, 1 of them recurring.
- 5 AI assistant prompts a month.
- Images up to 1 MB.
- No custom bot, no custom commands, no sending to other channels, no replies built in the action.

Paid plans:
- Premium: $4.99 a month per server. 100 saved messages, 5 versions each. 10 actions per component. 25 scheduled messages, all of them can be recurring. 100 AI prompts a month. Custom bot. 25 custom commands. Images up to 8 MB.
- Ultimate: $9.99 a month per server. Everything in Premium. 500 saved messages, 50 versions each. 15 actions per component. 100 scheduled messages, all of them can be recurring. 250 AI prompts a month. 50 custom commands. Images up to 8 MB.
- Premium Lifetime €99.99 and Ultimate Lifetime €199.99, paid once. The store showed euros, so check the dollar price before quoting one. You buy one and activate it on a server from /premium in the app. It can't be moved to another server after that.
- Don't mention plans that aren't for sale.
- A plan belongs to one server, not to your account.
- Prices are set in Discord's store, not in the config, read from a screenshot of the store on 2026-11-02. The store lists the plans as Premium Server, Ultimate Server, Premium Server Lifetime, and Ultimate Server Lifetime.
- Payment runs through Discord's app subscriptions. message.style/premium opens the Embed Generator store page in Discord.
Trial, refunds, cancellation:
- No trial. The free plan has no time limit and needs no payment details.
- Discord handles refunds under its own rules, because it takes the payment. Point people to Discord support.
- Cancel any time. The subscription is managed in Discord, and "Manage Subscription" on /premium leads there.

Stats (number | what it counts | source | date checked):
- 289,000 | servers the bot is in | guild_count in Discord's app directory | 2026-11-02
- 250,000+ | servers, shown on the landing page and the directory description | rounded down by hand, still true | 2026-11-02
- 3,000,000+ | messages sent
- 717 | GitHub stars on merlinfuchs/embed-generator | GitHub API | 2026-11-02
- 2018 | year the Embed Generator bot was created | creation date in the bot's Discord application ID | 2026-11-02

Main page action: "Open App", which goes to the editor. The bot invite ("Invite the bot") is secondary. /premium leads with the plan buttons.

Exact names of commands, settings, and pages users see:
- /embed
- /message restore, /message dump
- /format text, user, channel, role, emoji
- /image avatar, icon, emoji
- /help, /invite, /website
- Message context menu: Restore Message, Dump Message. User context menu: Avatar Url, Format Mention.
- Send modes: Webhook and Channel.
- App pages: Message Editor, Saved Messages, Scheduled Messages, Commands, Utility Tools, Premium, Settings. The editor is at message.style/app/editor.
- Plans: Free, Premium, and Ultimate.
- Links: message.style/premium, /invite, /discord (support server), /source (GitHub), status.message.style.
- Discord permissions by Discord's names, like Manage Webhooks, which /embed needs.

Words users use:
Words to never use:
- "guild" for a Discord server.
- "EmbedG" or "embedg". Those are code names. The product is Embed Generator. message.style is the domain, not the product name.
- "periodic" or "repeating" for scheduled messages. Say recurring.
- "consumable" or "entitlement". Say lifetime and plan.
- "advanced actions" or "advanced action types". Name what the user can do, like sending to another channel.
- "KV", "key-value", or "template ops".
- "Pro", or any plan name not listed above.

Project-specific rules:
- Say "Embed Generator Premium" on the first mention on a page or in a bot reply, and in anything read out of context: meta descriptions, FAQ answers, blog posts, and the Discord directory text. Say "Premium" after that, and in buttons, table headers, and badges. Ultimate is always "Ultimate".
- A recurring scheduled message is one sent more than once, on a regular interval or on a list of dates. Both count toward the 1 free one. "Repeat" only appears as the name of the tab in the schedule editor.
- Say "buttons and select menus" when it's about what the user builds or clicks. Say "interactive components" when a general term reads better, like in a heading over both. Never "button roles" alone, since the actions do more than roles. "Role menu" is fine for the role use case.
- The feature is "custom bot" in the app, docs, and prose. Marketing pages about it also say "white label" once, in the title, a heading, or the meta description, so people searching for it find the page: "Use a custom bot (white label) for replies and commands." Write "white label" as a noun and "white-label" before a noun, like "white-label bot". Never "whitelabel".
- Limits shown in the app come from /api/premium/plans at runtime. Numbers typed into the site, docs, blog, and the Discord directory description go stale when the config changes. Prefer wording without a number where the number isn't the point, and update these places when a limit changes.
- The Premium price is typed by hand in embedg-site/src/components/HomePremium.tsx, embedg-site/docs/premium.md, the Discohook comparison post, and the Discord directory description. Change all of them together.
- The bot doesn't see members join or leave. Never promise welcome messages, member events, or anything that needs a member list.
- Never claim Embed Generator does everything another product does, or is the only tool that does something.
- Legal pages (terms, privacy, cookies, imprint) are written separately. Don't edit them in a copy pass.

Language notes:
- English only. The site and app have no other locales.
```
