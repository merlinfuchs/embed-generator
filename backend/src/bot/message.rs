use std::collections::HashMap;

use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use twilight_model::application::component::Component;
use twilight_model::channel::embed::{EmbedAuthor, EmbedField, EmbedFooter, EmbedImage, EmbedThumbnail};
use twilight_model::channel::Message;
use twilight_model::util::Timestamp;

lazy_static! {
    static ref ACTION_STRING_RE: Regex = Regex::new(r"{{([a-z]+):([a-zA-Z0-9]+)}}$").unwrap();
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
    pub components: Vec<Component>,
    #[serde(default)]
    pub embeds: Vec<PartialEmbed>,
}

impl From<Message> for MessagePayload {
    fn from(_: Message) -> Self {
        todo!()
    }
}

impl MessagePayload {
    pub fn replace_variables(&mut self, _variables: HashMap<String, String>) {}

    pub fn hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(&serde_json::to_vec(self).unwrap());
        hex::encode(hasher.finalize())
    }
}

pub enum MessageAction {
    ResponseSavedMessage { message_id: String },
}

impl MessageAction {
    pub fn parse(value: &str) -> Vec<Self> {
        ACTION_STRING_RE
            .captures_iter(value)
            .filter_map(|captures| {
                let (action_type, arg) = (
                    captures.get(0).unwrap().as_str(),
                    captures.get(1).unwrap().as_str(),
                );

                match action_type {
                    "response_saved_message" => Some(MessageAction::ResponseSavedMessage {
                        message_id: arg.to_string(),
                    }),
                    _ => None,
                }
            })
            .collect()
    }
}
