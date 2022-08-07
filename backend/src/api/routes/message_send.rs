use std::collections::HashMap;

use actix_web::post;
use actix_web::web::{Json, ReqData};
use data_url::DataUrl;
use twilight_model::application::component::Component;
use lazy_static::lazy_static;
use twilight_model::channel::ChannelType;
use twilight_model::guild::{Member, Permissions};
use twilight_model::http::attachment::Attachment;
use twilight_model::id::marker::RoleMarker;
use twilight_model::id::Id;
use twilight_util::permission_calculator::PermissionCalculator;

use crate::api::response::{MessageSendError, RouteError, RouteResult};
use crate::api::wire::{MessageSendRequestWire, MessageSendResponseWire, MessageSendTargetWire};
use crate::bot::message::{MessageAction, MessagePayload};
use crate::bot::message::{MessageHashIntegrity, MessageVariablesReplace, ToMessageVariables};
use crate::bot::webhooks::{get_webhooks_for_channel, CachedWebhook};
use crate::bot::{DISCORD_CACHE, DISCORD_HTTP};
use crate::config::CONFIG;
use crate::db::models::{ChannelMessageModel, GuildsWithAccessModel, MessageModel};
use crate::tokens::TokenClaims;
use crate::util::unix_now_mongodb;

const ICON_BYTES: &[u8] = include_bytes!("../../../../frontend/public/logo128.png");

lazy_static! {
    static ref ICON_DATA_URL: String = format!("data:image/png;base64,{}", base64::encode(ICON_BYTES));
}

fn parse_component_actions(components: &[Component]) -> Vec<MessageAction> {
    let mut result = vec![];

    for component in components {
        match component {
            Component::ActionRow(a) => {
                result.extend(parse_component_actions(&a.components).into_iter())
            }
            Component::Button(b) => {
                if let Some(custom_id) = &b.custom_id {
                    result.extend(MessageAction::parse(custom_id).into_iter())
                }
            }
            Component::SelectMenu(s) => {
                result.extend(MessageAction::parse(&s.custom_id).into_iter());
                for option in &s.options {
                    result.extend(MessageAction::parse(&option.value).into_iter())
                }
            }
            _ => {}
        }
    }

    result
}

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

    let mut variables = HashMap::new();
    let mut payload: MessagePayload = serde_json::from_str(&req.payload_json).unwrap();

    let (webhook_id, webhook_token, channel_id, thread_id, message_id) = match req.target {
        MessageSendTargetWire::Webhook {
            webhook_id,
            webhook_token,
            thread_id,
            message_id,
        } => {
            payload.components = vec![]; // Manual webhooks don't support components
            (webhook_id, webhook_token, None, thread_id, message_id)
        }
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

            let (perms, is_owner, highest_role) = if guild.owner_id() == token.user_id {
                (Permissions::all(), true, 0)
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

                let mut highest_role = 0;
                let assigned_roles: Vec<(Id<RoleMarker>, Permissions)> = member
                    .roles
                    .into_iter()
                    .filter_map(|role_id| {
                        DISCORD_CACHE.role(role_id).map(|r| {
                            if r.position > highest_role {
                                highest_role = r.position;
                            }
                            (role_id, r.permissions)
                        })
                    })
                    .collect();

                let calculator = PermissionCalculator::new(
                    guild_id,
                    token.user_id,
                    everyone_role,
                    &assigned_roles,
                );
                let overwrites = channel.permission_overwrites.as_deref().unwrap_or(&[]);
                let perms = calculator.in_channel(channel.kind, &overwrites);

                (perms, false, highest_role)
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

            let actions = parse_component_actions(&payload.components);
            for action in actions {
                match action {
                    MessageAction::Unknown => {
                        return Err(RouteError::NotFound {
                            entity: "action".into(),
                        })
                    }
                    MessageAction::ResponseSavedMessage { message_id } => {
                        if !MessageModel::exists_by_owner_id_and_id(token.user_id, &message_id)
                            .await?
                        {
                            return Err(RouteError::InvalidMessageAction {
                                details:
                                    "Response message doesn't exist or is owned by someone else"
                                        .into(),
                            });
                        }
                    }
                    MessageAction::RoleToggle { role_id } => {
                        if !is_owner {
                            if !perms.contains(Permissions::MANAGE_ROLES) {
                                return Err(RouteError::MissingChannelAccess);
                            }

                            match DISCORD_CACHE.role(role_id) {
                                Some(role) => {
                                    if role.guild_id() != guild_id {
                                        return Err(RouteError::InvalidMessageAction {
                                            details: "Role to toggle is not in this guild".into(),
                                        });
                                    }
                                    if role.position > highest_role {
                                        return Err(RouteError::InvalidMessageAction {
                                            details: "You don't have permissions to toggle that role".into(),
                                        });
                                    }
                                }
                                None => {
                                    return Err(RouteError::InvalidMessageAction {
                                        details: "Unknown role to toggle".into(),
                                    });
                                }
                            }
                        }
                    }
                }
            }

            channel.to_message_variables(&mut variables);
            guild.to_message_variables(&mut variables);

            let existing_webhooks: Vec<CachedWebhook> =
                get_webhooks_for_channel(channel_id).await?;
            let existing_webhook_count = existing_webhooks.len();
            let existing_webhook = existing_webhooks
                .into_iter()
                .find(|w| w.application_id == Some(CONFIG.discord.oauth_client_id));
            if let Some(webhook) = existing_webhook {
                (
                    webhook.id,
                    webhook.token.unwrap(),
                    Some(channel_id),
                    thread_id,
                    message_id,
                )
            } else {
                if existing_webhook_count >= 10 {
                    return Err(RouteError::ChannelWebhookLimitReached);
                } else {
                    let webhook = DISCORD_HTTP
                        .create_webhook(channel_id, "Embed Generator")
                        .unwrap()
                        .avatar(&ICON_DATA_URL)
                        .exec()
                        .await?
                        .model()
                        .await
                        .unwrap();

                    (
                        webhook.id,
                        webhook.token.unwrap(),
                        Some(channel_id),
                        thread_id,
                        message_id,
                    )
                }
            }
        }
    };

    payload.replace_variables(&variables);
    let payload_json = serde_json::to_vec(&payload).unwrap();
    let res = if let Some(message_id) = message_id {
        let mut update_req =
            DISCORD_HTTP.update_webhook_message(webhook_id, &webhook_token, message_id);
        if let Some(thread_id) = thread_id {
            update_req = update_req.thread_id(thread_id)
        }

        update_req
            .payload_json(&payload_json)
            .attachments(&attachments)
            .unwrap()
            .exec()
            .await
            .map_err(|e| MessageSendError::from(e))?;

        Ok(message_id)
    } else {
        let mut exec_req = DISCORD_HTTP.execute_webhook(webhook_id, &webhook_token);
        if let Some(thread_id) = thread_id {
            exec_req = exec_req.thread_id(thread_id);
        }

        let msg = exec_req
            .payload_json(&payload_json)
            .attachments(&attachments)
            .unwrap()
            .wait()
            .exec()
            .await
            .map_err(|e| MessageSendError::from(e))?
            .model()
            .await
            .unwrap();

        Ok(msg.id)
    };

    match res {
        Ok(message_id) => {
            if let Some(channel_id) = channel_id {
                ChannelMessageModel {
                    channel_id,
                    message_id,
                    hash: payload.integrity_hash(),
                    updated_at: unix_now_mongodb(),
                    created_at: unix_now_mongodb(),
                }
                .update_or_create()
                .await?;
            }

            Ok(Json(MessageSendResponseWire { message_id }.into()))
        }
        Err(e) => Err(e),
    }
}
