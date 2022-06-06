use actix_web::post;
use actix_web::web::{Json, ReqData};
use twilight_model::channel::ChannelType;

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::{MessageSendRequestWire, MessageSendResponseWire, MessageSendTargetWire};
use crate::bot::webhooks::{get_webhooks_for_guild, CachedWebhook};
use crate::bot::{DISCORD_CACHE, DISCORD_HTTP};
use crate::config::CONFIG;
use crate::db::models::{ChannelMessagesModel, GuildsWithAccessModel};
use crate::tokens::TokenClaims;

#[post("/messages/send")]
pub async fn route_message_send(
    req: Json<MessageSendRequestWire>,
    token: ReqData<TokenClaims>,
) -> RouteResult<MessageSendResponseWire> {
    let req = req.into_inner();

    let (webhook_id, webhook_token, thread_id, message_id) = match req.target {
        MessageSendTargetWire::Webhook {
            webhook_id,
            webhook_token,
            thread_id,
            message_id,
        } => (webhook_id, webhook_token, thread_id, message_id),
        MessageSendTargetWire::Channel {
            guild_id,
            channel_id,
            message_id,
        } => {
            if !GuildsWithAccessModel::check_user_access_to_guild(token.user_id, guild_id).await? {
                return Err(RouteError::MissingGuildAccess);
            }

            let channel = DISCORD_CACHE
                .channel(channel_id)
                .ok_or(RouteError::NotFound {
                    entity: "channel".into(),
                })?;

            if channel.guild_id != Some(guild_id) {
                return Err(RouteError::GuildChannelMismatch);
            }

            let (channel_id, thread_id) = match channel.kind {
                ChannelType::GuildPrivateThread
                | ChannelType::GuildPublicThread
                | ChannelType::GuildNewsThread => (channel.parent_id.unwrap(), Some(channel.id)),
                ChannelType::GuildText | ChannelType::GuildNews => (channel.id, None),
                _ => return Err(RouteError::UnsupportedChannelType),
            };

            let existing_webhooks: Vec<CachedWebhook> = get_webhooks_for_guild(guild_id)
                .await?
                .into_iter()
                .filter(|w| w.channel_id == channel_id)
                .collect();
            let existing_webhook_count = existing_webhooks.len();
            let existing_webhook = existing_webhooks
                .into_iter()
                .find(|w| w.application_id == Some(CONFIG.discord.oauth_client_id));
            if let Some(webhook) = existing_webhook {
                (webhook.id, webhook.token.unwrap(), thread_id, message_id)
            } else {
                if existing_webhook_count >= 10 {
                    return Err(RouteError::ChannelWebhookLimitReached);
                } else {
                    let webhook = DISCORD_HTTP
                        .create_webhook(channel_id, "Embed Generator")
                        .unwrap()
                        .exec()
                        .await?
                        .model()
                        .await
                        .unwrap();

                    (webhook.id, webhook.token.unwrap(), thread_id, message_id)
                }
            }
        }
    };

    if let Some(message_id) = message_id {
        let mut update_req =
            DISCORD_HTTP.update_webhook_message(webhook_id, &webhook_token, message_id);
        if let Some(thread_id) = thread_id {
            update_req = update_req.thread_id(thread_id)
        }

        // TODO: instruct discord to remove existing attachments that aren't provided again
        update_req
            .payload_json(req.payload_json.as_bytes())
            .attachments(&[])
            .unwrap()
            .exec()
            .await?;

        Ok(Json(MessageSendResponseWire { message_id }.into()))
    } else {
        let mut exec_req = DISCORD_HTTP.execute_webhook(webhook_id, &webhook_token);
        if let Some(thread_id) = thread_id {
            exec_req = exec_req.thread_id(thread_id);
        }

        let msg = exec_req
            .payload_json(req.payload_json.as_bytes())
            .attachments(&[])
            .unwrap()
            .wait()
            .exec()
            .await?
            .model()
            .await
            .unwrap();

        ChannelMessagesModel {
            channel_id: msg.channel_id,
            message_ids: vec![msg.id],
        }
        .save()
        .await?;
        Ok(Json(MessageSendResponseWire { message_id: msg.id }.into()))
    }
}
