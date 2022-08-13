use std::time::Duration;

use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::application_command::CommandData;
use twilight_model::application::interaction::Interaction;
use twilight_model::id::Id;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::message::message_to_dump;
use crate::bot::commands::{simple_response, InteractionResult};
use crate::db::models::SharedMessageModel;
use crate::util::get_unique_id;

pub fn command_definition() -> Command {
    CommandBuilder::new("Restore Message", "", CommandType::Message).build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    interaction: Interaction,
    cmd: Box<CommandData>,
) -> InteractionResult {
    let msg_id = Id::new(cmd.target_id.unwrap().get());
    let msg = cmd.resolved.unwrap().messages.remove(&msg_id).unwrap();

    let msg_dump = message_to_dump(msg);

    let share_id = get_unique_id();
    let expiry = Duration::from_secs(60 * 60 * 24);

    let model = SharedMessageModel {
        id: share_id.clone(),
        payload_json: serde_json::to_string(&msg_dump)?,
    };
    model.save(expiry).await?;

    simple_response(
        &http,
        interaction.id,
        &interaction.token,
        format!(
            "You can edit the message here: https://message.style?share={}",
            share_id
        ),
    )
    .await?;

    Ok(())
}
