use redis::cmd;
use serde::{Deserialize, Serialize};
use twilight_model::id::marker::UserMarker;
use twilight_model::id::Id;

use crate::db::{RedisPoolError, REDIS};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserModel {
    pub id: Id<UserMarker>,
    pub username: String,
    pub discriminator: String,
    pub avatar: Option<String>,
}

impl UserModel {
    pub async fn save(&self) -> Result<(), RedisPoolError> {
        let mut con = REDIS.get().await?;

        let serialized = serde_json::to_string(self).unwrap();
        cmd("SET")
            .arg(&[format!("users:{}", self.id), serialized])
            .query_async::<_, ()>(&mut con)
            .await?;

        Ok(())
    }

    pub async fn find_by_id(user_id: Id<UserMarker>) -> Result<Option<Self>, RedisPoolError> {
        let mut con = REDIS.get().await?;

        let serialized: Option<String> = cmd("GET")
            .arg(&[format!("users:{}", user_id)])
            .query_async(&mut con)
            .await?;

        match serialized {
            Some(serialized) => Ok(Some(serde_json::from_str(&serialized).unwrap())),
            None => Ok(None),
        }
    }
}
