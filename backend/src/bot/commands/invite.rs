use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::component::button::ButtonStyle;
use twilight_model::application::component::{ActionRow, Button, Component};
use twilight_model::application::interaction::application_command::CommandData;
use twilight_model::application::interaction::Interaction;
use twilight_model::channel::message::MessageFlags;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::InteractionResult;
use crate::config::INVITE_URL;

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
    _cmd: Box<CommandData>,
) -> InteractionResult {
    http.create_response(
        interaction.id,
        &interaction.token,
        &InteractionResponse {
            kind: InteractionResponseType::ChannelMessageWithSource,
            data: Some(InteractionResponseData {
                content: Some(format!(
                    "You can invite Embed Generator [here]({}).",
                    INVITE_URL.as_str()
                )),
                flags: Some(MessageFlags::EPHEMERAL),
                components: Some(vec![Component::ActionRow(ActionRow {
                    components: vec![
                        Component::Button(Button {
                            custom_id: None,
                            disabled: false,
                            emoji: None,
                            label: Some("Website".into()),
                            style: ButtonStyle::Link,
                            url: Some("https://message.style".into()),
                        }),
                        Component::Button(Button {
                            custom_id: None,
                            disabled: false,
                            emoji: None,
                            label: Some("Invite Bot".into()),
                            style: ButtonStyle::Link,
                            url: Some(INVITE_URL.clone()),
                        }),
                    ],
                })]),
                ..Default::default()
            }),
        },
    )
    .exec()
    .await?;
    Ok(())
}
