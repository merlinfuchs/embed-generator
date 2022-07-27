use twilight_http::client::InteractionClient;
use twilight_model::application::command::{Command, CommandType};
use twilight_model::application::component::text_input::TextInputStyle;
use twilight_model::application::component::{ActionRow, Component, TextInput};
use twilight_model::application::interaction::modal::ModalSubmitInteraction;
use twilight_model::application::interaction::ApplicationCommand;
use twilight_model::channel::ChannelType;
use twilight_model::guild::Permissions;
use twilight_model::http::interaction::{
    InteractionResponse, InteractionResponseData, InteractionResponseType,
};
use twilight_util::builder::command::CommandBuilder;
use twilight_util::builder::embed::EmbedBuilder;

use crate::bot::commands::image::user_avatar_url;
use crate::bot::commands::webhook::get_webhook_for_channel;
use crate::bot::commands::{simple_response, InteractionError, InteractionResult};
use crate::bot::{get_bot_permissions_in_channel, DISCORD_CACHE, DISCORD_HTTP};

pub fn command_definition() -> Command {
    CommandBuilder::new(
        "embed".into(),
        "Quickly create a simple embed message".into(),
        CommandType::ChatInput,
    )
    .dm_permission(true)
    .default_member_permissions(Permissions::MANAGE_WEBHOOKS)
    .build()
}

pub async fn handle_command(
    http: InteractionClient<'_>,
    cmd: Box<ApplicationCommand>,
) -> InteractionResult {
    let user = cmd.member.unwrap().user.unwrap();
    let avatar_url = user_avatar_url(user.id, user.discriminator, user.avatar, true);

    http.create_response(
        cmd.id,
        &cmd.token,
        &InteractionResponse {
            kind: InteractionResponseType::Modal,
            data: Some(InteractionResponseData {
                title: Some("Create a simple embed".into()),
                custom_id: Some("embed".into()),
                components: Some(vec![
                    Component::ActionRow(ActionRow {
                        components: vec![Component::TextInput(TextInput {
                            custom_id: "username".into(),
                            label: "Username".into(),
                            max_length: Some(80),
                            min_length: None,
                            placeholder: Some("Embed Generator".into()),
                            required: Some(false),
                            style: TextInputStyle::Short,
                            value: Some(user.name),
                        })],
                    }),
                    Component::ActionRow(ActionRow {
                        components: vec![Component::TextInput(TextInput {
                            custom_id: "avatar_url".into(),
                            label: "Avatar URL".into(),
                            max_length: None,
                            min_length: None,
                            placeholder: None,
                            required: Some(false),
                            style: TextInputStyle::Short,
                            value: Some(avatar_url),
                        })],
                    }),
                    Component::ActionRow(ActionRow {
                        components: vec![Component::TextInput(TextInput {
                            custom_id: "title".into(),
                            label: "Embed Title".into(),
                            max_length: Some(256),
                            min_length: None,
                            placeholder: None,
                            required: Some(false),
                            style: TextInputStyle::Short,
                            value: None,
                        })],
                    }),
                    Component::ActionRow(ActionRow {
                        components: vec![Component::TextInput(TextInput {
                            custom_id: "url".into(),
                            label: "Embed URL".into(),
                            max_length: None,
                            min_length: None,
                            placeholder: None,
                            required: Some(false),
                            style: TextInputStyle::Short,
                            value: None,
                        })],
                    }),
                    Component::ActionRow(ActionRow {
                        components: vec![Component::TextInput(TextInput {
                            custom_id: "description".into(),
                            label: "Embed Description".into(),
                            max_length: Some(4000),
                            min_length: None,
                            placeholder: None,
                            required: Some(false),
                            style: TextInputStyle::Paragraph,
                            value: None,
                        })],
                    }),
                ]),
                ..Default::default()
            }),
        },
    )
    .exec()
    .await?;
    Ok(())
}

pub async fn handle_modal(
    http: InteractionClient<'_>,
    modal: Box<ModalSubmitInteraction>,
) -> InteractionResult {
    if !modal
        .member
        .unwrap()
        .permissions
        .unwrap()
        .contains(Permissions::MANAGE_WEBHOOKS)
    {
        simple_response(
            &http,
            modal.id,
            &modal.token,
            "You need **Manage Webhook** permissions to use this command.".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    let bot_perms = get_bot_permissions_in_channel(modal.channel_id);
    if !bot_perms.contains(Permissions::MANAGE_WEBHOOKS) {
        simple_response(
            &http,
            modal.id,
            &modal.token,
            "The bot needs **Manage Webhook** permissions to create webhooks.".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    let mut username = None;
    let mut avatar_url = None;
    let mut title = None;
    let mut url = None;
    let mut description = None;

    for component in modal.data.components {
        for component in component.components {
            match component.custom_id.as_str() {
                "username" if component.value.len() != 0 => username = Some(component.value),
                "avatar_url" if component.value.len() != 0 => avatar_url = Some(component.value),
                "title" if component.value.len() != 0 => title = Some(component.value),
                "url" if component.value.len() != 0 => url = Some(component.value),
                "description" if component.value.len() != 0 => description = Some(component.value),
                _ => {}
            }
        }
    }

    if title.is_none() && description.is_none() {
        simple_response(
            &http,
            modal.id,
            &modal.token,
            "You have to set either the embed title or the embed description.".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    if title.is_none() && url.is_some() {
        simple_response(
            &http,
            modal.id,
            &modal.token,
            "An embed URL without an embed title isn't possible.".into(),
        )
        .await?;
        return Err(InteractionError::NoOp);
    }

    let mut embed = EmbedBuilder::new();
    if let Some(title) = title {
        embed = embed.title(title);
    }
    if let Some(url) = url {
        embed = embed.url(url);
    }
    if let Some(description) = description {
        embed = embed.description(description);
    }

    let channel = DISCORD_CACHE.channel(modal.channel_id).unwrap();
    let (channel_id, thread_id) = match channel.kind {
        ChannelType::GuildPrivateThread
        | ChannelType::GuildPublicThread
        | ChannelType::GuildNewsThread => (channel.parent_id.unwrap(), Some(modal.channel_id)),
        _ => (modal.channel_id, None),
    };

    let (webhook_id, webhook_token) = get_webhook_for_channel(
        &http,
        channel_id,
        modal.id,
        &modal.token,
    )
    .await?;

    let mut exec_req = DISCORD_HTTP.execute_webhook(webhook_id, &webhook_token);
    if let Some(thread_id) = thread_id {
        exec_req = exec_req.thread_id(thread_id);
    }

    exec_req
        .username(username.as_deref().unwrap_or("Embed Generator"))
        .unwrap()
        .avatar_url(
            avatar_url
                .as_deref()
                .unwrap_or("https://message.style/logo128.png"),
        )
        .embeds(&[embed.build()])
        .unwrap()
        .exec()
        .await?;

    simple_response(
        &http,
        modal.id,
        &modal.token,
        "Your embed message has been created!".into(),
    )
    .await?;

    Ok(())
}
