use std::collections::HashMap;

use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::json;
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
pub struct PartialEmbed {
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
    pub embeds: Vec<PartialEmbed>,
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

impl From<PartialEmbed> for Embed {
    fn from(e: PartialEmbed) -> Self {
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

impl From<Embed> for PartialEmbed {
    fn from(e: Embed) -> Self {
        PartialEmbed {
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

    pub fn integrity_hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(
            &serde_json::to_vec(&json!({
                "content": self.content,
                "components": self.components,
                "embeds": self.embeds,
            }))
            .unwrap(),
        );
        hex::encode(hasher.finalize())
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
