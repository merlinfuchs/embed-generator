use std::collections::HashMap;

use lazy_static::lazy_static;
use regex::{Captures, Regex};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use twilight_cache_inmemory::model::CachedGuild;
use twilight_model::application::component::Component;
use twilight_model::application::interaction::MessageComponentInteraction;
use twilight_model::channel::embed::{
    Embed, EmbedAuthor, EmbedField, EmbedFooter, EmbedImage, EmbedThumbnail,
};
use twilight_model::channel::{Channel, Message};
use twilight_model::util::Timestamp;

use crate::bot::DISCORD_CACHE;

lazy_static! {
    static ref ACTION_STRING_RE: Regex = Regex::new(r"\{([0-9]+):([a-zA-Z0-9]+)\}$").unwrap();
    static ref MESSAGE_VARIABLE_RE: Regex =
        Regex::new(r"\{\{([a-z_\.]+)(?:\|([^{}|]*))?\}\}").unwrap();
}

#[derive(Serialize, Deserialize, Debug, Clone, Hash)]
pub struct MessagePayloadEmbed {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<EmbedAuthor>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub fields: Vec<EmbedField>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub footer: Option<EmbedFooter>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<EmbedImage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<EmbedThumbnail>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<Timestamp>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Hash)]
pub struct MessagePayload {
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub content: Option<String>,
    #[serde(default)]
    pub components: Vec<Component>, // TODO: seems like select menus break the message integrity atm
    #[serde(default)]
    pub embeds: Vec<MessagePayloadEmbed>,
}

impl From<Message> for MessagePayload {
    fn from(m: Message) -> Self {
        Self {
            username: Some(m.author.name),
            avatar_url: None, // TODO
            content: Some(m.content),
            components: m.components,
            embeds: m.embeds.into_iter().map(|e| e.into()).collect(),
        }
    }
}

impl From<MessagePayloadEmbed> for Embed {
    fn from(e: MessagePayloadEmbed) -> Self {
        Self {
            author: e.author,
            color: e.color,
            description: e.description,
            fields: e.fields,
            footer: e.footer,
            image: e.image,
            kind: "rich".into(),
            provider: None,
            thumbnail: e.thumbnail,
            timestamp: e.timestamp,
            title: e.title,
            url: e.url,
            video: None,
        }
    }
}

impl From<Embed> for MessagePayloadEmbed {
    fn from(e: Embed) -> Self {
        MessagePayloadEmbed {
            author: e.author,
            color: e.color,
            description: e.description,
            fields: e.fields,
            footer: e.footer,
            image: e.image,
            thumbnail: e.thumbnail,
            timestamp: e.timestamp,
            title: e.title,
            url: e.url,
        }
    }
}

pub type MessageVariables<'a> = HashMap<&'a str, String>;

pub trait ToMessageVariables<'r> {
    fn to_message_variables(&'r self, variables: &mut MessageVariables<'_>);
}

impl ToMessageVariables<'_> for MessageComponentInteraction {
    fn to_message_variables(&self, variables: &mut MessageVariables<'_>) {
        let member = self.member.as_ref().unwrap();
        let user = member.user.as_ref().unwrap();

        if let Some(guild_id) = self.guild_id {
            match DISCORD_CACHE.guild(guild_id) {
                Some(guild) => {
                    guild.value().to_message_variables(variables);
                }
                None => {
                    variables.insert("guild.id", guild_id.to_string().into());
                }
            }
        }

        match DISCORD_CACHE.channel(self.channel_id) {
            Some(channel) => {
                channel.value().to_message_variables(variables);
            }
            None => {
                variables.insert("channel.id", self.channel_id.to_string().into());
            }
        }

        variables.extend([
            ("user.id", user.id.to_string()),
            ("user.name", user.name.clone()),
            ("user.discriminator", user.discriminator.to_string()),
            (
                "user.tag",
                format!("{}#{}", user.name, user.discriminator),
            ),
            (
                "user.avatar_url",
                match user.avatar {
                    Some(a) => format!("https://cdn.discordapp.com/avatars/{}/{}.png", user.id, a),
                    None => format!(
                        "https://cdn.discordapp.com/embed/avatars/{}.png",
                        user.discriminator % 5
                    ),
                },
            ),
        ]);
    }
}

impl ToMessageVariables<'_> for CachedGuild {
    fn to_message_variables(&self, variables: &mut MessageVariables<'_>) {
        variables.extend([
            ("server.id", self.id().to_string()),
            ("server.name", self.name().to_string()),
        ]);

        if let Some(icon) = self.icon() {
            variables.insert("server.icon_url", format!("https://cdn.discordapp.com/icons/{}/{}.png", self.id(), icon));
        }
    }
}

impl ToMessageVariables<'_> for Channel {
    fn to_message_variables(&self, variables: &mut MessageVariables<'_>) {
        variables.extend([
            ("channel.id", self.id.to_string()),
            ("channel.name", self.name.clone().unwrap_or_default()),
        ]);
    }
}

pub trait MessageVariablesReplace {
    fn replace_variables(&mut self, variables: &MessageVariables);
}

impl MessageVariablesReplace for String {
    fn replace_variables(&mut self, variables: &MessageVariables) {
        *self = MESSAGE_VARIABLE_RE
            .replace_all(self, |caps: &Captures| {
                if let Some(val) = variables.get(&caps[1]) {
                    val.to_string()
                } else {
                    caps.get(2)
                        .map(|v| v.as_str().to_string())
                        .unwrap_or_else(|| caps[0].to_string())
                }
            })
            .into();
    }
}

impl MessageVariablesReplace for MessagePayload {
    fn replace_variables(&mut self, variables: &MessageVariables) {
        if let Some(content) = &mut self.content {
            content.replace_variables(variables);
        }

        for embed in &mut self.embeds {
            embed.replace_variables(variables);
        }
    }
}

impl MessageVariablesReplace for MessagePayloadEmbed {
    fn replace_variables(&mut self, variables: &MessageVariables) {
        if let Some(title) = &mut self.title {
            title.replace_variables(variables);
        }

        if let Some(description) = &mut self.description {
            description.replace_variables(variables);
        }

        if let Some(author) = &mut self.author {
            author.replace_variables(variables);
        }

        if let Some(footer) = &mut self.footer {
            footer.replace_variables(variables);
        }

        for field in &mut self.fields {
            field.replace_variables(variables);
        }
    }
}

impl MessageVariablesReplace for EmbedAuthor {
    fn replace_variables(&mut self, variables: &MessageVariables) {
        self.name.replace_variables(variables);
    }
}

impl MessageVariablesReplace for EmbedFooter {
    fn replace_variables(&mut self, variables: &MessageVariables) {
        self.text.replace_variables(variables);
    }
}

impl MessageVariablesReplace for EmbedField {
    fn replace_variables(&mut self, variables: &MessageVariables) {
        self.name.replace_variables(variables);
        self.value.replace_variables(variables);
    }
}

pub enum MessageAction {
    Unknown,
    ResponseSavedMessage { message_id: String },
}

impl MessageAction {
    pub fn parse(value: &str) -> Vec<Self> {
        ACTION_STRING_RE
            .captures_iter(value)
            .map(|captures| {
                let (action_type, arg) = (
                    captures.get(1).unwrap().as_str(),
                    captures.get(2).unwrap().as_str(),
                );

                match action_type {
                    "0" => MessageAction::ResponseSavedMessage {
                        message_id: arg.to_string(),
                    },
                    _ => MessageAction::Unknown,
                }
            })
            .collect()
    }
}

/// Outputs a combined hash of all the values that are relevant for the integrity check
pub trait MessageHashIntegrity {
    fn integrity_hash(&self) -> String;
}

fn hash_component_integrity(hasher: &mut Sha256, component: &Component) {
    match component {
        Component::ActionRow(row) => {
            for comp in &row.components {
                hash_component_integrity(hasher, comp);
            }
        }
        Component::Button(button) => {
            if let Some(custom_id) = &button.custom_id {
                hasher.update(custom_id.as_bytes());
            }
        }
        Component::SelectMenu(menu) => {
            hasher.update(menu.custom_id.as_bytes());
            for option in &menu.options {
                hasher.update(option.value.as_bytes());
            }
        }
        Component::TextInput(input) => {
            hasher.update(input.custom_id.as_bytes());
        }
    }
}

impl MessageHashIntegrity for MessagePayload {
    fn integrity_hash(&self) -> String {
        let mut hasher = Sha256::new();
        for component in &self.components {
            hash_component_integrity(&mut hasher, component);
        }
        hex::encode(hasher.finalize())
    }
}

impl MessageHashIntegrity for Message {
    fn integrity_hash(&self) -> String {
        let mut hasher = Sha256::new();
        for component in &self.components {
            hash_component_integrity(&mut hasher, component);
        }
        hex::encode(hasher.finalize())
    }
}
