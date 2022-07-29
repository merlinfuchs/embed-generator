use std::collections::HashMap;

use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use twilight_model::application::component::Component;
use twilight_model::channel::embed::Embed;
use twilight_model::channel::Message;

lazy_static! {
    static ref ACTION_STRING_RE: Regex = Regex::new(r"{{([a-z]+):([a-zA-Z0-9]+)}}$").unwrap();
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
    pub embeds: Vec<Embed>,
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
