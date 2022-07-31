use std::collections::HashMap;

use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use twilight_model::application::component::Component;
use twilight_model::channel::embed::{
    Embed, EmbedAuthor, EmbedField, EmbedFooter, EmbedImage, EmbedThumbnail,
};
use twilight_model::channel::Message;
use twilight_model::util::Timestamp;

lazy_static! {
    static ref ACTION_STRING_RE: Regex = Regex::new(r"\{([0-9]+):([a-zA-Z0-9]+)\}$").unwrap();
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

impl MessagePayload {
    pub fn replace_variables(&mut self, _variables: &HashMap<String, String>) {}
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
pub trait MessageIntegrityHash {
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
        },
        Component::SelectMenu(menu) => {
            hasher.update(menu.custom_id.as_bytes());
            for option in &menu.options {
                hasher.update(option.value.as_bytes());
            }
        },
        Component::TextInput(input) => {
            hasher.update(input.custom_id.as_bytes());
        }
    }
}

impl MessageIntegrityHash for MessagePayload {
    fn integrity_hash(&self) -> String {
        let mut hasher = Sha256::new();
        for component in &self.components {
            hash_component_integrity(&mut hasher, component);
        }
        hex::encode(hasher.finalize())
    }
}

impl MessageIntegrityHash for Message {
    fn integrity_hash(&self) -> String {
        let mut hasher = Sha256::new();
        for component in &self.components {
            hash_component_integrity(&mut hasher, component);
        }
        hex::encode(hasher.finalize())
    }
}
