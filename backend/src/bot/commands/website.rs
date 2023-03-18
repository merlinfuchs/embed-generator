use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::interaction::application_command::CommandData;
use twilight_model::application::interaction::Interaction;
use twilight_model::channel::message::component::ButtonStyle;
use twilight_model::channel::message::component::{ActionRow, Button, Component};
use twilight_model::channel::message::MessageFlags;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_util::builder::command::CommandBuilder;

use crate::bot::commands::InteractionResult;

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
    http.create_response(
        interaction.id,
        &interaction.token,
        &InteractionResponse {
            kind: InteractionResponseType::ChannelMessageWithSource,
            data: Some(InteractionResponseData {
                content: Some("You can find the website at https://message.style".into()),
                flags: Some(MessageFlags::EPHEMERAL),
                components: Some(vec![Component::ActionRow(ActionRow {
                    components: vec![Component::Button(Button {
                        custom_id: None,
                        disabled: false,
                        emoji: None,
                        label: Some("Website".into()),
                        style: ButtonStyle::Link,
                        url: Some("https://message.style".into()),
                    })],
                })]),
                ..Default::default()
            }),
        },
    )
    .await?;
    Ok(())
}
