use twilight_cache_inmemory::model::{CachedEmoji, CachedSticker};
use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandOptionChoice, CommandType};
use twilight_model::application::interaction::application_command::{
    CommandData, CommandOptionValue,
};
use twilight_model::application::interaction::Interaction;
use twilight_model::channel::message::MessageFlags;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_model::id::marker::{InteractionMarker, UserMarker};
use twilight_model::id::Id;
use twilight_model::util::ImageHash;
use twilight_util::builder::command::{
    BooleanBuilder, CommandBuilder, StringBuilder, SubCommandBuilder, UserBuilder,
};
use twilight_util::builder::embed::{EmbedBuilder, ImageSource};

use crate::bot::commands::{simple_response, InteractionResult};
use crate::bot::emojis::EMOJIS;
use crate::bot::DISCORD_CACHE;

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "image",
        "Get the image URL for different entities",
        CommandType::ChatInput,
    )
    .option(
        SubCommandBuilder::new("avatar", "Get the avatar URL for a user")
            .option(
                UserBuilder::new("target", "The user or role you want the avatar URL for")
                    .required(true),
            )
            .option(
                BooleanBuilder::new(
                    "static",
                    "Whether animated avatars should be converted to static images",
                )
                .required(false),
            ),
    )
    .option(
        SubCommandBuilder::new("icon", "Get the icon URL for this server").option(
            BooleanBuilder::new(
                "static",
                "Whether animated icons should be converted to static images",
            )
            .required(false),
        ),
    )
    .option(
        SubCommandBuilder::new("emoji", "Get the image URL for a custom or standard emoji").option(
            StringBuilder::new("target", "The custom emoji you want the image URL for")
                .autocomplete(true)
                .required(true),
        ),
    )
    .option(
        SubCommandBuilder::new("sticker", "Get the image URL for a custom sticker").option(
            StringBuilder::new("target", "The custom sticker you want the image URL for")
                .autocomplete(true)
                .required(true),
        ),
    )
    .build()
}

pub async fn image_response(
    http: &InteractionClient<'_>,
    id: Id<InteractionMarker>,
    token: &str,
    url: String,
) -> InteractionResult {
    http.create_response(
        id,
        token,
        &InteractionResponse {
            kind: InteractionResponseType::ChannelMessageWithSource,
            data: Some(InteractionResponseData {
                flags: Some(MessageFlags::EPHEMERAL),
                embeds: Some(vec![EmbedBuilder::new()
                    .description(url.clone())
                    .image(ImageSource::url(url).unwrap())
                    .build()]),
                ..Default::default()
            }),
        },
    )
    .exec()
    .await?;
    Ok(())
}

pub fn user_avatar_url(
    id: Id<UserMarker>,
    discriminator: u16,
    avatar: Option<ImageHash>,
    force_static: bool,
) -> String {
    match avatar {
        Some(a) => {
            let format = if a.is_animated() && !force_static {
                "gif"
            } else {
                "png"
            };
            format!("https://cdn.discordapp.com/avatars/{}/{}.{}", id, a, format)
        }
        None => format!(
            "https://cdn.discordapp.com/embed/avatars/{}.png",
            discriminator % 5
        ),
    }
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    interaction: Interaction,
    cmd: Box<CommandData>,
) -> InteractionResult {
    let sub_cmd = cmd.options.get(0).unwrap();
    let mut options = match &sub_cmd.value {
        CommandOptionValue::SubCommand(options) => options.clone(),
        _ => unreachable!(),
    };

    match sub_cmd.name.as_str() {
        "avatar" => {
            let user_id = match options.pop().unwrap().value {
                CommandOptionValue::User(u) => u,
                _ => unreachable!(),
            };
            let make_static = options
                .pop()
                .map(|v| match v.value {
                    CommandOptionValue::Boolean(b) => b,
                    _ => unreachable!(),
                })
                .unwrap_or_default();

            let resolved = cmd.resolved.as_ref().unwrap();
            let user = resolved.users.get(&user_id).unwrap();

            let url = user_avatar_url(user.id, user.discriminator, user.avatar, make_static);
            image_response(&http, interaction.id, &interaction.token, url).await?;
        }
        "icon" => {
            let make_static = options
                .pop()
                .map(|v| match v.value {
                    CommandOptionValue::Boolean(b) => b,
                    _ => unreachable!(),
                })
                .unwrap_or_default();

            if let Some(guild_id) = cmd.guild_id {
                let guild = DISCORD_CACHE.guild(guild_id).unwrap();
                if let Some(icon) = guild.icon() {
                    let format = if icon.is_animated() && !make_static {
                        "gif"
                    } else {
                        "png"
                    };
                    let url = format!(
                        "https://cdn.discordapp.com/icons/{}/{}.{}",
                        guild.id(),
                        icon,
                        format
                    );
                    image_response(&http, interaction.id, &interaction.token, url).await?;
                } else {
                    simple_response(
                        &http,
                        interaction.id,
                        &interaction.token,
                        "This server has no icon.".into(),
                    )
                    .await?;
                }
            } else {
                simple_response(
                    &http,
                    interaction.id,
                    &interaction.token,
                    "This command can only be used inside a server.".into(),
                )
                .await?
            }
        }
        "emoji" => {
            let url = match options.pop().unwrap().value {
                CommandOptionValue::String(e) => e,
                _ => unreachable!(),
            };

            image_response(&http, interaction.id, &interaction.token, url).await?;
        }
        "sticker" => {
            let url = match options.pop().unwrap().value {
                CommandOptionValue::String(e) => e,
                _ => unreachable!(),
            };

            image_response(&http, interaction.id, &interaction.token, url).await?;
        }
        _ => {}
    }
    Ok(())
}

pub async fn handle_autocomplete(
    http: InteractionClient<'_>,
    interaction: Interaction,
    cmd: Box<CommandData>,
) -> InteractionResult {
    let sub_cmd = cmd.options.get(0).unwrap();
    let options = match &sub_cmd.value {
        CommandOptionValue::SubCommand(options) => options.clone(),
        _ => unreachable!(),
    };
    let search = match &options.get(0).unwrap().value {
        CommandOptionValue::Focused(e, _) => e,
        _ => unreachable!(),
    };

    match sub_cmd.name.as_str() {
        "emoji" => {
            let emojis: Vec<CachedEmoji> = if let Some(guild_id) = interaction.guild_id {
                DISCORD_CACHE
                    .guild_emojis(guild_id)
                    .map(|e| {
                        e.value()
                            .iter()
                            .filter_map(|eid| {
                                DISCORD_CACHE
                                    .emoji(*eid)
                                    .map(|e| e.value().resource().clone())
                            })
                            .collect()
                    })
                    .unwrap_or_default()
            } else {
                vec![]
            };

            let mut choices: Vec<CommandOptionChoice> = emojis
                .into_iter()
                .filter(|e| e.name().contains(search))
                .map(|e| CommandOptionChoice::String {
                    name: e.name().to_string(),
                    name_localizations: None,
                    value: format!(
                        "https://cdn.discordapp.com/emojis/{}.{}",
                        e.id(),
                        if e.animated() { "gif" } else { "png" },
                    ),
                })
                .collect();

            for (unicode, seq, name) in EMOJIS.iter().filter(|(_, _, n)| n.contains(search)) {
                if choices.len() >= 25 {
                    break;
                }
                choices.push(CommandOptionChoice::String {
                    name: format!("{} {}", unicode, name),
                    name_localizations: None,
                    value: format!("https://twemoji.maxcdn.com/v/13.1.0/72x72/{}.png", seq),
                })
            }

            choices.truncate(25);
            http.create_response(
                interaction.id,
                &interaction.token,
                &InteractionResponse {
                    kind: InteractionResponseType::ApplicationCommandAutocompleteResult,
                    data: Some(InteractionResponseData {
                        choices: Some(choices),
                        ..Default::default()
                    }),
                },
            )
            .exec()
            .await?;
        }
        "sticker" => {
            let stickers: Vec<CachedSticker> = if let Some(guild_id) = cmd.guild_id {
                DISCORD_CACHE
                    .guild_stickers(guild_id)
                    .map(|s| {
                        s.value()
                            .iter()
                            .filter_map(|eid| {
                                DISCORD_CACHE
                                    .sticker(*eid)
                                    .map(|e| e.value().resource().clone())
                            })
                            .collect()
                    })
                    .unwrap_or_default()
            } else {
                vec![]
            };

            let mut choices: Vec<CommandOptionChoice> = stickers
                .into_iter()
                .filter(|s| s.name().contains(search))
                .map(|s| CommandOptionChoice::String {
                    name: s.name().to_string(),
                    name_localizations: None,
                    value: format!("https://cdn.discordapp.com/stickers/{}.png", s.id(),),
                })
                .collect();

            choices.truncate(25);
            http.create_response(
                interaction.id,
                &interaction.token,
                &InteractionResponse {
                    kind: InteractionResponseType::ApplicationCommandAutocompleteResult,
                    data: Some(InteractionResponseData {
                        choices: Some(choices),
                        ..Default::default()
                    }),
                },
            )
            .exec()
            .await?;
        }
        _ => {}
    }

    Ok(())
}
