use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use twilight_http::client::InteractionClient;
use twilight_http::error::ErrorType;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::component::Component;
use twilight_model::application::interaction::application_command::{
    CommandDataOption, CommandOptionValue,
};
use twilight_model::application::interaction::ApplicationCommand;
use twilight_model::channel::embed::Embed;
use twilight_model::channel::Message;
use twilight_model::id::marker::{ChannelMarker, MessageMarker};
use twilight_model::id::Id;
use twilight_util::builder::command::{CommandBuilder, StringBuilder, SubCommandBuilder};

use crate::bot::commands::{simple_response, InteractionError, InteractionResult};
use crate::bot::DISCORD_HTTP;

lazy_static! {
    static ref SNOWFLAGE_RE: Regex = Regex::new("^[0-9]+$").unwrap();
    static ref MESSAGE_URL_RE: Regex =
        Regex::new(r"https?://(?:canary\.|ptb\.)?discord\.com/channels/[0-9]+/([0-9]+)/([0-9]+)")
            .unwrap();
}

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "message".into(),
        "Get JSON for or restore a message on Embed Generator".into(),
        CommandType::ChatInput,
    )
    .option(
        SubCommandBuilder::new(
            "restore".into(),
            "Restore a message on Embed Generator".into(),
        )
        .option(
            StringBuilder::new(
                "message_id_or_url".into(),
                "ID or URL of the message you want to restore".into(),
            )
            .required(true),
        ),
    )
    .option(
        SubCommandBuilder::new("dump".into(), "Get the JSON code for a message".into()).option(
            StringBuilder::new(
                "message_id_or_url".into(),
                "ID or URL of the message you want the JSON code for".into(),
            )
            .required(true),
        ),
    )
    .build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
) -> InteractionResult {
    let sub_cmd = cmd.data.options.get(0).unwrap();
    let options = match &sub_cmd.value {
        CommandOptionValue::SubCommand(options) => options.clone(),
        _ => unreachable!(),
    };

    match sub_cmd.name.as_str() {
        "restore" => handle_command_restore(http, cmd, options).await?,
        "dump" => handle_command_dump(http, cmd, options).await?,
        _ => {}
    }
    Ok(())
}

fn parse_message_id_or_url(
    message_id_or_url: &str,
) -> Result<(Option<Id<ChannelMarker>>, Id<MessageMarker>), String> {
    if SNOWFLAGE_RE.is_match(message_id_or_url) {
        Ok((None, message_id_or_url.parse().unwrap()))
    } else {
        match MESSAGE_URL_RE.captures(message_id_or_url) {
            Some(m) => Ok((
                Some(m.get(1).unwrap().as_str().parse().unwrap()),
                m.get(2).unwrap().as_str().parse().unwrap(),
            )),
            None => Err("Invalid message id or url provided".into()),
        }
    }
}

async fn get_message_from_id_or_url(
    http: &InteractionClient<'_>,
    cmd: &ApplicationCommand,
    message_id_or_url: &str,
) -> Result<Message, InteractionError> {
    let (channel_id, message_id) = match parse_message_id_or_url(&message_id_or_url) {
        Ok(v) => v,
        Err(e) => {
            simple_response(&http, cmd.id, &cmd.token, e).await?;
            return Err(InteractionError::NoOp);
        }
    };

    let channel_id = channel_id.unwrap_or(cmd.channel_id);
    if channel_id != cmd.channel_id {
        simple_response(
            &http,
            cmd.id,
            &cmd.token,
            "The message must belong to this channel".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    let msg = match DISCORD_HTTP.message(channel_id, message_id).exec().await {
        Ok(m) => m.model().await?,
        Err(e) => {
            return match e.kind() {
                ErrorType::Response { status, .. } => match status.get() {
                    404 => {
                        simple_response(
                            &http,
                            cmd.id,
                            &cmd.token,
                            "Can't find the message in this channel".into(),
                        )
                        .await?;
                        Err(InteractionError::NoOp)
                    }
                    _ => Err(e.into()),
                },
                _ => Err(e.into()),
            }
        }
    };

    Ok(msg)
}

pub fn message_to_dump(msg: Message) -> MessageDump {
    MessageDump {
        id: msg.id,
        channel_id: msg.channel_id,
        username: msg.author.name,
        avatar_url: msg.author.avatar.map(|a| {
            format!(
                "https://cdn.discordapp.com/avatars/{}/{}.webp",
                msg.author.id, a
            )
        }),
        content: msg.content,
        embeds: msg.embeds,
        components: msg.components,
    }
}

async fn handle_command_restore(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
    mut options: Vec<CommandDataOption>,
) -> InteractionResult {
    let message_id_or_url = match options.pop().unwrap().value {
        CommandOptionValue::String(v) => v,
        _ => unreachable!(),
    };

    let msg = get_message_from_id_or_url(&http, &cmd, &message_id_or_url).await?;
    let msg_dump = message_to_dump(msg);

    let client = awc::ClientBuilder::new().finish();
    let resp: ClubShareCreateResponse = client
        .post("https://api.discord.club/messages/share")
        .send_json(&ClubShareCreateRequest { json: msg_dump })
        .await?
        .json()
        .await?;

    simple_response(
        &http,
        cmd.id,
        &cmd.token,
        format!(
            "You can edit the message here: https://discord.club/share/{}",
            resp.id
        ),
    )
    .await?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct MessageDump {
    pub id: Id<MessageMarker>,
    pub channel_id: Id<ChannelMarker>,
    pub username: String,
    pub avatar_url: Option<String>,
    pub content: String,
    pub components: Vec<Component>,
    pub embeds: Vec<Embed>,
}

async fn handle_command_dump(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
    mut options: Vec<CommandDataOption>,
) -> InteractionResult {
    let message_id_or_url = match options.pop().unwrap().value {
        CommandOptionValue::String(v) => v,
        _ => unreachable!(),
    };

    let msg = get_message_from_id_or_url(&http, &cmd, &message_id_or_url).await?;

    let msg_json = serde_json::to_string_pretty(&message_to_dump(msg))?;

    let client = awc::ClientBuilder::new().finish();

    let resp: VaultbinPasteCreateResponse = client
        .post("https://vaultb.in/api/pastes")
        .send_json(&VaultbinPasteCreateRequest {
            content: msg_json,
            language: "json".into(),
        })
        .await?
        .json()
        .await?;

    simple_response(
        &http,
        cmd.id,
        &cmd.token,
        format!(
            "You can find the JSON code here: <https://vaultb.in/{}>",
            resp.data.id
        ),
    )
    .await?;

    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct VaultbinPasteCreateRequest {
    pub content: String,
    pub language: String,
}

#[derive(Serialize, Deserialize)]
pub struct VaultbinPasteCreateResponse {
    pub data: VaultbinPasteCreateResponseData,
}

#[derive(Serialize, Deserialize)]
pub struct VaultbinPasteCreateResponseData {
    pub id: String,
}

#[derive(Serialize, Deserialize)]
pub struct ClubShareCreateRequest {
    pub json: MessageDump,
}

#[derive(Serialize, Deserialize)]
pub struct ClubShareCreateResponse {
    pub id: String,
}
