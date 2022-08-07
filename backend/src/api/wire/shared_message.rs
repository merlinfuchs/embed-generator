use crate::db::models::SharedMessageModel;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SharedMessageWire {
    pub id: String,
    pub payload_json: String,
}

impl From<SharedMessageModel> for SharedMessageWire {
    fn from(s: SharedMessageModel) -> Self {
        Self {
            id: s.id,
            payload_json: s.payload_json,
        }
    }
}
