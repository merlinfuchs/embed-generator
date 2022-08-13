use std::collections::HashMap;

use awc::error::{JsonPayloadError, SendRequestError};
use twilight_http::client::InteractionClient;
use twilight_http::response::DeserializeBodyError;
use twilight_model::application::command::Command;
use twilight_model::application::component::ComponentType;
use twilight_model::application::interaction::{Interaction, InteractionData, InteractionType};
use twilight_model::application::interaction::message_component::MessageComponentInteractionData;
use twilight_model::channel::message::MessageFlags;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_model::id::Id;
use twilight_model::id::marker::InteractionMarker;

use crate::bot::DISCORD_HTTP;
use crate::bot::message::{MessageAction, MessagePayload};
use crate::bot::message::{MessageHashIntegrity, ToMessageVariables};
use crate::bot::message::{MessageVariablesReplace, ResponseSavedMessageFlags};
use crate::CONFIG;
use crate::db::models::{ChannelMessageModel, MessageModel};
use crate::db::RedisPoolError;

mod embed;
mod format;
mod help;
mod image;
mod invite;
mod message;
mod message_json_direct;
mod message_restore_direct;
mod webhook;
mod website;

pub fn command_definitions() -> Vec<Command> {
    vec![
        format::command_definition(),
        invite::command_definition(),
        help::command_definition(),
        website::command_definition(),
        message::command_definition(),
        webhook::command_definition(),
        message_restore_direct::command_definition(),
        message_json_direct::command_definition(),
        image::command_definition(),
        embed::command_definition(),
    ]
}

pub async fn handle_interaction(interaction: Interaction) -> InteractionResult {
    let http = DISCORD_HTTP.interaction(CONFIG.discord.oauth_client_id);

    let data = match interaction.data.clone() {
        Some(d) => d,
        None => return Ok(()),
    };

    match data {
        InteractionData::ApplicationCommand(cmd)
            if interaction.kind == InteractionType::ApplicationCommand =>
        {
            match cmd.name.as_str() {
                "format" => format::handle_command(http, interaction, cmd).await?,
                "help" => help::handle_command(http, interaction, cmd).await?,
                "invite" => invite::handle_command(http, interaction, cmd).await?,
                "website" => website::handle_command(http, interaction, cmd).await?,
                "message" => message::handle_command(http, interaction, cmd).await?,
                "webhook" => webhook::handle_command(http, interaction, cmd).await?,
                "image" => image::handle_command(http, interaction, cmd).await?,
                "embed" => embed::handle_command(http, interaction, cmd).await?,
                "Restore Message" => {
                    message_restore_direct::handle_command(http, interaction, cmd).await?
                }
                "Dump Message" => {
                    message_json_direct::handle_command(http, interaction, cmd).await?
                }
                _ => {}
            }
        }
        InteractionData::ApplicationCommand(cmd)
            if interaction.kind == InteractionType::ApplicationCommandAutocomplete =>
        {
            match cmd.name.as_str() {
                "format" => format::handle_autocomplete(http, interaction, cmd).await?,
                "image" => image::handle_autocomplete(http, interaction, cmd).await?,
                _ => {}
            }
        }
        InteractionData::MessageComponent(comp) => match comp.custom_id.as_str() {
            _ => handle_unknown_component(http, interaction, comp).await?,
        },
        InteractionData::ModalSubmit(modal) => match modal.custom_id.as_str() {
            "embed" => embed::handle_modal(http, interaction, modal).await?,
            _ => {}
        },
        _ => {}
    }

    Ok(())
}

async fn handle_unknown_component(
    http: InteractionClient<'_>,
    interaction: Interaction,
    comp: MessageComponentInteractionData,
) -> InteractionResult {
    // we have to check that the message was created by the bot and not manually by using a webhook
    let message = interaction.message.as_ref().unwrap();
    let message_timestamp = message.edited_timestamp.unwrap_or(message.timestamp);

    // message integrity wasn't part of the initial release so we can't expect older messages to have it
    if message_timestamp.as_secs() > 1659880800
        && message.author.id != CONFIG.discord.oauth_client_id.cast()
        && !ChannelMessageModel::exists_by_message_id_and_hash(
            message.id,
            &message.integrity_hash(),
        )
        .await?
    {
        simple_response(
            &http,
            interaction.id,
            &interaction.token,
            "Message integrity could not be validated".into(),
        )
        .await?;
        return Ok(());
    }

    let response = match comp.component_type {
        ComponentType::Button => comp.custom_id.as_str(),
        ComponentType::SelectMenu => match comp.values.get(0) {
            Some(v) => v,
            None => return Ok(()),
        },
        _ => return Ok(()),
    };

    let actions = MessageAction::parse(response);
    if actions.is_empty() {
        let mut response = response.to_string();
        let mut variables = HashMap::new();
        interaction.to_message_variables(&mut variables);
        response.replace_variables(&variables);
        simple_response(&http, interaction.id, &interaction.token, response).await?;
    } else {
        handle_component_actions(&http, &interaction, actions).await?;
    }

    if comp.component_type == ComponentType::SelectMenu {
        // we reset the menu to the initial state
        // TODO: it would be better if this was performed before the actions
        let _ = http
            .update_followup(&interaction.token, message.id)
            .components(Some(&message.components))
            .unwrap()
            .exec()
            .await;
    }

    Ok(())
}

async fn handle_component_actions(
    http: &InteractionClient<'_>,
    interaction: &Interaction,
    actions: Vec<MessageAction>,
) -> InteractionResult {
    for action in actions {
        match action {
            MessageAction::Unknown => {}
            MessageAction::ResponseSavedMessage { message_id, flags } => {
                match MessageModel::find_by_id(&message_id).await? {
                    Some(model) => {
                        match serde_json::from_str::<MessagePayload>(&model.payload_json) {
                            Ok(mut payload) => {
                                let mut variables = HashMap::new();
                                interaction.to_message_variables(&mut variables);
                                payload.replace_variables(&variables);

                                let response_kind = if flags.contains(ResponseSavedMessageFlags::EDIT) {
                                    InteractionResponseType::UpdateMessage
                                } else {
                                    InteractionResponseType::ChannelMessageWithSource
                                };

                                http.create_response(
                                    interaction.id,
                                    &interaction.token,
                                    &InteractionResponse {
                                        kind: response_kind,
                                        data: Some(InteractionResponseData {
                                            content: payload.content,
                                            components: Some(payload.components),
                                            embeds: Some(
                                                payload
                                                    .embeds
                                                    .into_iter()
                                                    .map(|e| e.into())
                                                    .collect(),
                                            ),
                                            flags: Some(MessageFlags::EPHEMERAL),
                                            ..Default::default()
                                        }),
                                    },
                                )
                                .exec()
                                .await?;
                            }
                            Err(_) => {
                                simple_response(
                                    http,
                                    interaction.id,
                                    &interaction.token,
                                    "Invalid response message".into(),
                                )
                                .await?;
                            }
                        };
                    }
                    None => {
                        simple_response(
                            http,
                            interaction.id,
                            &interaction.token,
                            "Response message not found".into(),
                        )
                        .await?;
                    }
                }
            }
            MessageAction::RoleToggle { role_id } => {
                let member = interaction.member.as_ref().unwrap();
                let user_id = member.user.as_ref().unwrap().id;
                let guild_id = interaction.guild_id.unwrap();
                if member.roles.contains(&role_id) {
                    match DISCORD_HTTP
                        .remove_guild_member_role(guild_id, user_id, role_id)
                        .exec()
                        .await
                    {
                        Ok(_) => {
                            simple_response(
                                http,
                                interaction.id,
                                &interaction.token,
                                format!("You no longer have the <@&{}> role", role_id),
                            )
                            .await?;
                        }
                        Err(_) => {
                            simple_response(
                                http,
                                interaction.id,
                                &interaction.token,
                                "Failed to remove role. Does the bot have permissions to remove this role?".into(),
                            )
                            .await?;
                        }
                    }
                } else {
                    match DISCORD_HTTP
                        .add_guild_member_role(guild_id, user_id, role_id)
                        .exec()
                        .await
                    {
                        Ok(_) => {
                            simple_response(
                                http,
                                interaction.id,
                                &interaction.token,
                                format!("You now have the <@&{}> role", role_id),
                            )
                            .await?;
                        }
                        Err(_) => {
                            simple_response(
                                http,
                                interaction.id,
                                &interaction.token,
                                "Failed to add role. Does the bot have permissions to remove this role?".into(),
                            )
                            .await?;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

pub async fn simple_response(
    http: &InteractionClient<'_>,
    id: Id<InteractionMarker>,
    token: &str,
    text: String,
) -> InteractionResult {
    http.create_response(
        id,
        token,
        &InteractionResponse {
            kind: InteractionResponseType::ChannelMessageWithSource,
            data: Some(InteractionResponseData {
                content: Some(text),
                flags: Some(MessageFlags::EPHEMERAL),
                ..Default::default()
            }),
        },
    )
    .exec()
    .await?;
    Ok(())
}

#[derive(Debug)]
pub enum InteractionError {
    NoOp,
    DiscordHttp(twilight_http::Error),
    DiscordDeserialize(DeserializeBodyError),
    JsonSerialize(serde_json::error::Error),
    AwcDeserialize(awc::error::JsonPayloadError),
    AwcRequest(SendRequestError),
    Database(mongodb::error::Error),
    Redis(RedisPoolError),
}

impl From<twilight_http::Error> for InteractionError {
    fn from(e: twilight_http::Error) -> Self {
        Self::DiscordHttp(e)
    }
}

impl From<DeserializeBodyError> for InteractionError {
    fn from(e: DeserializeBodyError) -> Self {
        Self::DiscordDeserialize(e)
    }
}

impl From<serde_json::error::Error> for InteractionError {
    fn from(e: serde_json::Error) -> Self {
        Self::JsonSerialize(e)
    }
}

impl From<awc::error::JsonPayloadError> for InteractionError {
    fn from(e: JsonPayloadError) -> Self {
        Self::AwcDeserialize(e)
    }
}

impl From<SendRequestError> for InteractionError {
    fn from(e: SendRequestError) -> Self {
        Self::AwcRequest(e)
    }
}

impl From<mongodb::error::Error> for InteractionError {
    fn from(e: mongodb::error::Error) -> Self {
        Self::Database(e)
    }
}

impl From<RedisPoolError> for InteractionError {
    fn from(e: RedisPoolError) -> Self {
        Self::Redis(e)
    }
}

pub type InteractionResult = Result<(), InteractionError>;
