use twilight_cache_inmemory::model::CachedEmoji;
use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandOptionChoice, CommandType};
use twilight_model::application::interaction::application_command::CommandOptionValue;
use twilight_model::application::interaction::{
    ApplicationCommand, ApplicationCommandAutocomplete,
};
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_util::builder::command::{
    ChannelBuilder, CommandBuilder, RoleBuilder, StringBuilder, SubCommandBuilder, UserBuilder,
};

use crate::bot::commands::{simple_response, InteractionResult};
use crate::bot::emojis::EMOJIS;
use crate::bot::DISCORD_CACHE;

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "format".into(),
        "Get the API format for mentions, channels, roles, & custom emojis".into(),
        CommandType::ChatInput,
    )
    .option(
        SubCommandBuilder::new(
            "text".into(),
            "Get the API format for a text with multiple mentions, channels, & custom emojis"
                .into(),
        )
        .option(
            StringBuilder::new(
                "text".into(),
                "The text that you want to format (usually containing mentions or custom emojis)"
                    .into(),
            )
            .required(true),
        ),
    )
    .option(
        SubCommandBuilder::new(
            "user".into(),
            "Get the API format for mentioning a user".into(),
        )
        .option(
            UserBuilder::new("target".into(), "The user you want to mention".into()).required(true),
        ),
    )
    .option(
        SubCommandBuilder::new(
            "channel".into(),
            "Get the API format for mentioning a channel".into(),
        )
        .option(
            ChannelBuilder::new("target".into(), "The channel you want to mention".into())
                .required(true),
        ),
    )
    .option(
        SubCommandBuilder::new(
            "role".into(),
            "Get the API format for mentioning a role".into(),
        )
        .option(
            RoleBuilder::new("target".into(), "The role you want to mention".into()).required(true),
        ),
    )
    .option(
        SubCommandBuilder::new(
            "emoji".into(),
            "Get the API format for a custom emoji".into(),
        )
        .option(
            StringBuilder::new("target".into(), "The custom emoji you want to use".into())
                .autocomplete(true)
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
    let mut options = match &sub_cmd.value {
        CommandOptionValue::SubCommand(options) => options.clone(),
        _ => unreachable!(),
    };

    match sub_cmd.name.as_str() {
        "user" => {
            let user_id = match options.pop().unwrap().value {
                CommandOptionValue::User(u) => u,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                cmd.id,
                &cmd.token,
                format!("API format for <@{0}>: ```<@{0}>```", user_id),
            )
            .await?;
        }
        "role" => {
            let role_id = match options.pop().unwrap().value {
                CommandOptionValue::Role(r) => r,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                cmd.id,
                &cmd.token,
                format!("API format for <@&{0}>: ```<@&{0}>```", role_id),
            )
            .await?;
        }
        "channel" => {
            let channel_id = match options.pop().unwrap().value {
                CommandOptionValue::Channel(c) => c,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                cmd.id,
                &cmd.token,
                format!("API format for <#{0}>: ```<#{0}>```", channel_id),
            )
            .await?;
        }
        "emoji" => {
            let value = match options.pop().unwrap().value {
                CommandOptionValue::String(e) => e,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                cmd.id,
                &cmd.token,
                format!("API format for {0}: ```{0}```", value),
            )
            .await?;
        },
        "text" => {
            let value = match options.pop().unwrap().value {
                CommandOptionValue::String(e) => e,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                cmd.id,
                &cmd.token,
                format!("API format for the provided text: ```{0}```", value),
            )
            .await?;
        }
        _ => {}
    }
    Ok(())
}

pub async fn handle_autocomplete(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommandAutocomplete>,
) -> InteractionResult {
    let sub_cmd = cmd.data.options.get(0).unwrap();
    let search = match &sub_cmd.options.get(0).unwrap().value {
        Some(e) => e,
        _ => unreachable!(),
    };

    let custom_emojis: Vec<CachedEmoji> = if let Some(guild_id) = cmd.guild_id {
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

    let mut choices: Vec<CommandOptionChoice> = custom_emojis
        .into_iter()
        .filter(|e| e.name().contains(search))
        .map(|e| CommandOptionChoice::String {
            name: e.name().to_string(),
            name_localizations: None,
            value: format!(
                "<{}:{}:{}>",
                if e.animated() { "a" } else { "" },
                e.name(),
                e.id()
            ),
        })
        .collect();

    for (unicode, _, name) in EMOJIS.iter().filter(|(_, _, n)| n.contains(search)) {
        if choices.len() >= 25 {
            break;
        }
        choices.push(CommandOptionChoice::String {
            name: format!("{} {}", unicode, name),
            name_localizations: None,
            value: unicode.to_string(),
        })
    }

    choices.truncate(25);
    http.create_response(
        cmd.id,
        &cmd.token,
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

    Ok(())
}
