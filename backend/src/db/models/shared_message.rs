use std::time::Duration;

use redis::cmd;
use serde::{Deserialize, Serialize};

use crate::db::{RedisPoolError, REDIS};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SharedMessageModel {
    pub id: String,
    pub payload_json: String,
}

impl SharedMessageModel {
    pub async fn save(&self, expiry: Duration) -> Result<(), RedisPoolError> {
        let mut con = REDIS.get().await?;
        let raw = serde_json::to_string(&self).unwrap();

        cmd("SETEX")
            .arg(&[
                format!("messages:shared:{}", self.id),
                expiry.as_secs().to_string(),
                raw,
            ])
            .query_async::<_, ()>(&mut con)
            .await?;

        Ok(())
    }

    pub async fn find_by_id(id: &str) -> Result<Option<Self>, RedisPoolError> {
        let mut con = REDIS.get().await?;

        let raw: Option<String> = cmd("GET")
            .arg(&[format!("messages:shared:{}", id)])
            .query_async(&mut con)
            .await?;

        Ok(raw.map(|r| serde_json::from_str(&r).unwrap()))
    }
}
