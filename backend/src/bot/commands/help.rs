use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::ApplicationCommand;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "help".into(),
        "Join our Discord Server to get support".into(),
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
        "You can join our Discord Server with the following link: <https://discord.club/discord>"
            .into(),
    )
    .await?;
    Ok(())
}
