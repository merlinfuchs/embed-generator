use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::application_command::CommandData;
use twilight_model::application::interaction::Interaction;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "invite",
        "Invite Embed Generator to your server",
        CommandType::ChatInput,
    )
    .build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    interaction: Interaction,
    _cmd: &CommandData,
) -> InteractionResult {
    simple_response(
        &http,
        interaction.id,
        &interaction.token,
        "You can invite Embed Generator with the following link: <https://discord.club/invite>"
            .into(),
    )
    .await?;
    Ok(())
}
