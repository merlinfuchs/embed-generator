use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::application_command::CommandData;
use twilight_model::application::interaction::Interaction;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "website",
        "Embed Generator is primarily used through its website",
        CommandType::ChatInput,
    )
    .build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    interaction: Interaction,
    _cmd: Box<CommandData>,
) -> InteractionResult {
    simple_response(
        &http,
        interaction.id,
        &interaction.token,
        "You can find the website of Embed Generator at: <https://discord.club>".into(),
    )
    .await?;
    Ok(())
}
