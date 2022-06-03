use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::ApplicationCommand;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "invite".into(),
        "Invite Embed Generator to your server".into(),
        CommandType::ChatInput,
    )
    .build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
) -> InteractionResult {
    simple_response(
        &http,
        cmd.id,
        &cmd.token,
        "You can invite Embed Generator with the following link: <https://discord.club/invite>"
            .into(),
    )
    .await?;
    Ok(())
}
