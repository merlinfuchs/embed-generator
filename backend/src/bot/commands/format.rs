use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::{ApplicationCommand, ApplicationCommandAutocomplete};
use twilight_util::builder::command::{
    ChannelBuilder, CommandBuilder, MentionableBuilder, RoleBuilder, StringBuilder,
    SubCommandBuilder,
};

use crate::bot::commands::InteractionResult;

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
            "mention".into(),
            "Get the API format for mentioning a user".into(),
        )
        .option(
            MentionableBuilder::new(
                "target".into(),
                "The user or role you want to mention".into(),
            )
            .required(true),
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
    _: InteractionClient<'_>,
    _: Box<ApplicationCommand>,
) -> InteractionResult {
    Ok(())
}

pub async fn handle_autocomplete(_: InteractionClient<'_>, _: Box<ApplicationCommandAutocomplete>) -> InteractionResult {
    Ok(())
}
