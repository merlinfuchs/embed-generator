use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::ApplicationCommand;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "Dump Message".into(),
        "".into(),
        CommandType::Message,
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
        "Dump message"
            .into(),
    )
    .await?;
    Ok(())
}
