use actix_web::post;
use actix_web::web::{Json, ReqData};
use data_url::DataUrl;
use twilight_model::channel::ChannelType;
use twilight_model::guild::{Member, Permissions};
use twilight_model::http::attachment::Attachment;
use twilight_model::id::marker::RoleMarker;
use twilight_model::id::Id;
use twilight_util::permission_calculator::PermissionCalculator;

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::{MessageSendRequestWire, MessageSendResponseWire, MessageSendTargetWire};
use crate::bot::webhooks::{get_webhooks_for_channel, CachedWebhook};
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

    let attachments: Vec<Attachment> = req
        .attachments
        .into_iter()
        .enumerate()
        .filter_map(|(i, a)| {
            let body = DataUrl::process(&a.data_url)
                .ok()
                .map(|d| d.decode_to_vec().ok().map(|b| b.0))
                .flatten();

            let filename = a
                .name
                .chars()
                .filter(|c| (c.is_ascii_alphanumeric() || *c == '.' || *c == '-' || *c == '_'))
                .collect();

            match body {
                Some(body) => Some(Attachment {
                    filename,
                    description: a.description,
                    file: body,
                    id: i as u64,
                }),
                None => None,
            }
        })
        .collect();

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

            let guild = DISCORD_CACHE.guild(guild_id).ok_or(RouteError::NotFound {
                entity: "guild".into(),
            })?;

            let perms = if guild.owner_id() == token.user_id {
                Permissions::all()
            } else {
                let member: Member = DISCORD_HTTP
                    .guild_member(guild_id, token.user_id)
                    .exec()
                    .await?
                    .model()
                    .await
                    .unwrap();

                let everyone_role = DISCORD_CACHE
                    .role(guild_id.cast())
                    .map(|r| r.permissions)
                    .unwrap_or(Permissions::empty());
                let assigned_roles: Vec<(Id<RoleMarker>, Permissions)> = member
                    .roles
                    .into_iter()
                    .filter_map(|role_id| {
                        DISCORD_CACHE
                            .role(role_id)
                            .map(|r| (role_id, r.permissions))
                    })
                    .collect();

                let calculator = PermissionCalculator::new(
                    guild_id,
                    token.user_id,
                    everyone_role,
                    &assigned_roles,
                );
                let overwrites = channel.permission_overwrites.as_deref().unwrap_or(&[]);
                calculator.in_channel(channel.kind, &overwrites)
            };

            if !perms.contains(Permissions::MANAGE_WEBHOOKS) {
                return Err(RouteError::MissingChannelAccess);
            }

            let (channel_id, thread_id) = match channel.kind {
                ChannelType::GuildPrivateThread
                | ChannelType::GuildPublicThread
                | ChannelType::GuildNewsThread => (channel.parent_id.unwrap(), Some(channel.id)),
                ChannelType::GuildText | ChannelType::GuildNews => (channel.id, None),
                _ => return Err(RouteError::UnsupportedChannelType),
            };

            let existing_webhooks: Vec<CachedWebhook> =
                get_webhooks_for_channel(channel_id).await?;
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

        update_req
            .payload_json(req.payload_json.as_bytes())
            .attachments(&attachments)
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
            .attachments(&attachments)
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
