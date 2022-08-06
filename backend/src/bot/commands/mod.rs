use awc::error::{JsonPayloadError, SendRequestError};
use twilight_http::client::InteractionClient;
use twilight_http::response::DeserializeBodyError;
use twilight_model::application::command::Command;
use twilight_model::application::component::ComponentType;
use twilight_model::application::interaction::message_component::MessageComponentInteractionData;
use twilight_model::application::interaction::{Interaction, InteractionData, InteractionType};
use twilight_model::channel::message::MessageFlags;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_model::id::marker::InteractionMarker;
use twilight_model::id::Id;

use crate::bot::DISCORD_HTTP;
use crate::CONFIG;

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
    mut comp: MessageComponentInteractionData,
) -> InteractionResult {
    let response = match comp.component_type {
        ComponentType::Button => Some(comp.custom_id),
        ComponentType::SelectMenu => comp.values.pop(),
        _ => None,
    };

    if let Some(response) = response {
        http.create_response(
            interaction.id,
            &interaction.token,
            &InteractionResponse {
                kind: InteractionResponseType::ChannelMessageWithSource,
                data: Some(InteractionResponseData {
                    content: Some(response),
                    flags: Some(MessageFlags::EPHEMERAL),
                    ..Default::default()
                }),
            },
        )
        .exec()
        .await?;
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

pub type InteractionResult = Result<(), InteractionError>;
