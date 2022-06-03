use std::ops::Add;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use twilight_model::id::Id;
use twilight_model::id::marker::UserMarker;

use crate::CONFIG;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    #[serde(rename = "uid")]
    pub user_id: Id<UserMarker>,
    #[serde(rename = "exp")]
    pub expiration: u64,
}

impl TokenClaims {
    pub fn new(user_id: Id<UserMarker>) -> Self {
        let expiration = SystemTime::now().add(Duration::from_secs(60 * 60 * 24 * 7));

        Self {
            user_id,
            expiration: expiration.duration_since(UNIX_EPOCH).unwrap().as_secs(),
        }
    }
}

pub fn encode_token(claims: &TokenClaims) -> Result<String, jsonwebtoken::errors::Error> {
    let key = EncodingKey::from_secret(CONFIG.jwt_secret.as_bytes());
    jsonwebtoken::encode(&Header::default(), claims, &key)
}

pub fn decode_token(token: &str) -> Result<TokenClaims, jsonwebtoken::errors::Error> {
    let key = DecodingKey::from_secret(CONFIG.jwt_secret.as_bytes());
    let validation = Validation::default();
    let data = jsonwebtoken::decode(token, &key, &validation)?;
    Ok(data.claims)
}
