use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::ApplicationCommand;
use twilight_model::id::Id;
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::message::{
    message_to_dump, ClubShareCreateRequest, ClubShareCreateResponse,
};
use crate::bot::commands::{simple_response, InteractionResult};

pub fn command_definition() -> Command {
    CommandBuilder::new("Restore Message".into(), "".into(), CommandType::Message).build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
) -> InteractionResult {
    let msg_id = Id::new(cmd.data.target_id.unwrap().get());
    let msg = cmd.data.resolved.unwrap().messages.remove(&msg_id).unwrap();

    let msg_dump = message_to_dump(msg);

    let client = awc::ClientBuilder::new().finish();

    let resp: ClubShareCreateResponse = client
        .post("https://api.discord.club/messages/share")
        .send_json(&ClubShareCreateRequest { json: msg_dump })
        .await?
        .json()
        .await?;

    simple_response(
        &http,
        cmd.id,
        &cmd.token,
        format!(
            "You can edit the message here: https://discord.club/share/{}",
            resp.id
        ),
    )
    .await?;

    Ok(())
}
