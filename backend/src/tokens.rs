use serde::{Deserialize, Serialize};
use twilight_model::id::Id;
use twilight_model::id::marker::UserMarker;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    #[serde(rename = "uid")]
    pub user_id: Id<UserMarker>,
    #[serde(rename = "exp")]
    pub expiration: u64,
}

impl TokenClaims {
    pub fn new(user_id: Id<UserMarker>,) -> Self {
        Self {
            user_id,
            expiration: 0,
        }
    }
}

pub fn encode_token(_claims: &TokenClaims) -> Result<String, jsonwebtoken::errors::Error> {
    unimplemented!()
}

pub fn decode_token(_token: &str) -> Result<TokenClaims, jsonwebtoken::errors::Error> {
    unimplemented!()
}
