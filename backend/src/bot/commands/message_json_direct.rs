use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::application_command::CommandData;
use twilight_model::application::interaction::Interaction;
use twilight_model::id::Id;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::message::{
    message_to_dump, VaultbinPasteCreateRequest, VaultbinPasteCreateResponse,
};
use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new("Dump Message", "", CommandType::Message).build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    interaction: Interaction,
    cmd: Box<CommandData>,
) -> InteractionResult {
    let msg_id = Id::new(cmd.target_id.unwrap().get());
    let msg = cmd.resolved.unwrap().messages.remove(&msg_id).unwrap();

    let msg_json = serde_json::to_string_pretty(&message_to_dump(msg))?;

    let client = awc::ClientBuilder::new().finish();

    let resp: VaultbinPasteCreateResponse = client
        .post("https://vaultb.in/api/pastes")
        .send_json(&VaultbinPasteCreateRequest {
            content: msg_json,
            language: "json".into(),
        })
        .await?
        .json()
        .await?;

    simple_response(
        &http,
        interaction.id,
        &interaction.token,
        format!(
            "You can find the JSON code here: <https://vaultb.in/{}>",
            resp.data.id
        ),
    )
    .await?;

    Ok(())
}
