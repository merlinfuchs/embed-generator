use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::ApplicationCommand;
use twilight_model::guild::Permissions;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::{simple_response, InteractionError, InteractionResult};
use crate::bot::webhooks::{get_webhooks_for_guild, CachedWebhook};
use crate::bot::{get_bot_permissions_on_guild, DISCORD_HTTP};
use crate::CONFIG;

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "webhook".into(),
        "Get a webhook for this channel".into(),
        CommandType::ChatInput,
    )
    .default_member_permissions(Permissions::MANAGE_WEBHOOKS)
    .dm_permission(false)
    .build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
) -> InteractionResult {
    if !cmd
        .member
        .unwrap()
        .permissions
        .unwrap()
        .contains(Permissions::MANAGE_WEBHOOKS)
    {
        simple_response(
            &http,
            cmd.id,
            &cmd.token,
            "You need **Manage Webhook** permissions to use this command.".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    let bot_perms = get_bot_permissions_on_guild(cmd.guild_id.unwrap());
    if !bot_perms.contains(Permissions::MANAGE_WEBHOOKS) {
        simple_response(
            &http,
            cmd.id,
            &cmd.token,
            "The bot needs **Manage Webhook** permissions to create webhooks.".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    let existing_webhooks: Vec<CachedWebhook> = get_webhooks_for_guild(cmd.guild_id.unwrap())
        .await?
        .into_iter()
        .filter(|w| w.channel_id == cmd.channel_id)
        .collect();
    let existing_webhook_count = existing_webhooks.len();
    let existing_webhook = existing_webhooks
        .into_iter()
        .find(|w| w.application_id == Some(CONFIG.discord.oauth_client_id));

    let (webhook_id, webhook_token) = if let Some(webhook) = existing_webhook {
        (webhook.id, webhook.token.unwrap())
    } else {
        if existing_webhook_count >= 10 {
            simple_response(
                &http,
                    cmd.id,
                    &cmd.token,
                    "The bot can't create a new webhook because there are already 10 webhooks in this channel."
                        .into(),
                )
                .await?;
            return Err(InteractionError::NoOp);
        } else {
            let webhook = DISCORD_HTTP
                .create_webhook(cmd.channel_id, "Embed Generator")
                .unwrap()
                .exec()
                .await?
                .model()
                .await
                .unwrap();

            (webhook.id, webhook.token.unwrap())
        }
    };

    simple_response(
        &http,
        cmd.id,
        &cmd.token,
        format!(
            "https://discord.com/api/webhooks/{}/{}",
            webhook_id, webhook_token
        )
        .into(),
    )
    .await?;
    Ok(())
}
