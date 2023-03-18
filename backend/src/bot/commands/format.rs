use twilight_http::client::InteractionClient;
use twilight_model::application::command::{
    Command, CommandOptionChoice, CommandOptionChoiceValue, CommandType,
};
use twilight_model::application::interaction::application_command::{
    CommandData, CommandOptionValue,
};
use twilight_model::application::interaction::Interaction;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_util::builder::command::{
    ChannelBuilder, CommandBuilder, RoleBuilder, StringBuilder, SubCommandBuilder, UserBuilder,
};

use crate::bot::cache::CacheEmoji;
use crate::bot::commands::{simple_response, InteractionResult};
use crate::bot::emojis::EMOJIS;
use crate::bot::DISCORD_CACHE;

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "format",
        "Get the API format for mentions, channels, roles, & custom emojis",
        CommandType::ChatInput,
    )
    .option(
        SubCommandBuilder::new(
            "text",
            "Get the API format for a text with multiple mentions, channels, & custom emojis",
        )
        .option(
            StringBuilder::new(
                "text",
                "The text that you want to format (usually containing mentions or custom emojis)",
            )
            .required(true),
        ),
    )
    .option(
        SubCommandBuilder::new("user", "Get the API format for mentioning a user")
            .option(UserBuilder::new("target", "The user you want to mention").required(true)),
    )
    .option(
        SubCommandBuilder::new("channel", "Get the API format for mentioning a channel").option(
            ChannelBuilder::new("target", "The channel you want to mention").required(true),
        ),
    )
    .option(
        SubCommandBuilder::new("role", "Get the API format for mentioning a role")
            .option(RoleBuilder::new("target", "The role you want to mention").required(true)),
    )
    .option(
        SubCommandBuilder::new("emoji", "Get the API format for a custom emoji").option(
            StringBuilder::new("target", "The custom emoji you want to use")
                .autocomplete(true)
                .required(true),
        ),
    )
    .build()
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
        "user" => {
            let user_id = match options.pop().unwrap().value {
                CommandOptionValue::User(u) => u,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                interaction.id,
                &interaction.token,
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
                interaction.id,
                &interaction.token,
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
                interaction.id,
                &interaction.token,
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
                interaction.id,
                &interaction.token,
                format!("API format for {0}: ```{0}```", value),
            )
            .await?;
        }
        "text" => {
            let value = match options.pop().unwrap().value {
                CommandOptionValue::String(e) => e,
                _ => unreachable!(),
            };

            simple_response(
                &http,
                interaction.id,
                &interaction.token,
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
    interaction: Interaction,
    cmd: Box<CommandData>,
) -> InteractionResult {
    let options = match &cmd.options.get(0).unwrap().value {
        CommandOptionValue::SubCommand(options) => options.clone(),
        _ => unreachable!(),
    };
    let search = match &options.get(0).unwrap().value {
        CommandOptionValue::Focused(e, _) => e,
        _ => unreachable!(),
    };

    let custom_emojis: Vec<CacheEmoji> = if let Some(guild_id) = interaction.guild_id {
        DISCORD_CACHE
            .guild_emojis(guild_id)
            .map(|e| {
                e.value()
                    .iter()
                    .filter_map(|eid| DISCORD_CACHE.emoji(*eid).map(|e| e.value().clone()))
                    .collect()
            })
            .unwrap_or_default()
    } else {
        vec![]
    };

    let mut choices: Vec<CommandOptionChoice> = custom_emojis
        .into_iter()
        .filter(|e| e.name.contains(search))
        .map(|e| CommandOptionChoice {
            name: e.name.clone(),
            name_localizations: None,
            value: CommandOptionChoiceValue::String(format!(
                "<{}:{}:{}>",
                if e.animated { "a" } else { "" },
                e.name.clone(),
                e.id
            )),
        })
        .collect();

    for (unicode, _, name) in EMOJIS.iter().filter(|(_, _, n)| n.contains(search)) {
        if choices.len() >= 25 {
            break;
        }
        choices.push(CommandOptionChoice {
            name: format!("{} {}", unicode, name),
            name_localizations: None,
            value: CommandOptionChoiceValue::String(unicode.to_string()),
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
    .await?;

    Ok(())
}
