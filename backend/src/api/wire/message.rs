use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use twilight_model::id::marker::{
    ChannelMarker, GuildMarker, MessageMarker, UserMarker, WebhookMarker,
};
use twilight_model::id::Id;

use crate::api::response::RouteError;
use crate::api::wire::NormalizeValidate;
use crate::db::models::MessageModel;
use crate::CONFIG;

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageWire {
    pub id: String,
    pub user_id: Id<UserMarker>,
    pub name: String,
    pub description: String,
    pub payload_json: String,
}

impl From<MessageModel> for MessageWire {
    fn from(m: MessageModel) -> Self {
        Self {
            id: m.id,
            user_id: m.user_id,
            name: m.name,
            description: m.description,
            payload_json: m.payload_json,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageCreateRequestWire {
    pub name: String,
    pub description: String,
    pub payload_json: String,
}

impl NormalizeValidate for MessageCreateRequestWire {
    fn validate(&self) -> Result<(), RouteError> {
        if self.name.len() < 3 || self.name.len() > 25 {
            return Err(RouteError::ValidationError {
                field: "name".into(),
                details: "The message name must be between 3 and 25 characters in length".into(),
            });
        }
        if self.description.len() > 100 {
            return Err(RouteError::ValidationError {
                field: "description".into(),
                details: "The message description can't be longer than 100 characters".into(),
            });
        }

        if self.payload_json.len() > CONFIG.limits.max_message_size {
            return Err(RouteError::ValidationError {
                field: "data".into(),
                details: "The message data is too big".into(),
            });
        }

        Ok(())
    }

    fn normalize(self) -> Self {
        Self {
            name: self.name.trim().to_string(),
            description: self.description.trim().to_string(),
            payload_json: self.payload_json,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageUpdateRequestWire {
    pub name: String,
    pub description: String,
    pub payload_json: String,
}

impl NormalizeValidate for MessageUpdateRequestWire {
    fn validate(&self) -> Result<(), RouteError> {
        if self.name.len() < 3 || self.name.len() > 25 {
            return Err(RouteError::ValidationError {
                field: "name".into(),
                details: "The message name must be between 3 and 25 characters in length".into(),
            });
        }
        if self.description.len() > 100 {
            return Err(RouteError::ValidationError {
                field: "description".into(),
                details: "The message description can't be longer than 100 characters".into(),
            });
        }

        if self.payload_json.len() > CONFIG.limits.max_message_size {
            return Err(RouteError::ValidationError {
                field: "data".into(),
                details: "The message data is too big".into(),
            });
        }

        Ok(())
    }

    fn normalize(self) -> Self {
        Self {
            name: self.name.trim().to_string(),
            description: self.description.trim().to_string(),
            payload_json: self.payload_json,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum MessageSendTargetWire {
    Webhook {
        webhook_id: Id<WebhookMarker>,
        webhook_token: String,
        #[serde(default)]
        thread_id: Option<Id<ChannelMarker>>,
        #[serde(default)]
        message_id: Option<Id<MessageMarker>>,
    },
    Channel {
        guild_id: Id<GuildMarker>,
        channel_id: Id<ChannelMarker>,
        #[serde(default)]
        message_id: Option<Id<MessageMarker>>,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub enum MessageSendActionsWire {

}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageSendRequestWire {
    pub target: MessageSendTargetWire,
    pub payload_json: String,
    #[serde(default)]
    pub attachments: HashMap<String, Vec<u8>>,
    pub actions: HashMap<String, MessageSendActionsWire>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageSendResponseWire {
    pub message_id: Id<MessageMarker>,
}
