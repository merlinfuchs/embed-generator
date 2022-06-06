use redis::cmd;
use twilight_model::id::marker::{ChannelMarker, MessageMarker};
use twilight_model::id::Id;

use crate::db::{RedisPoolError, REDIS};

pub struct ChannelMessagesModel {
    pub channel_id: Id<ChannelMarker>,
    pub message_ids: Vec<Id<MessageMarker>>,
}

impl ChannelMessagesModel {
    pub async fn save(&self) -> Result<(), RedisPoolError> {
        let mut con = REDIS.get().await?;

        let mut args = vec![format!("channels:{}:messages", self.channel_id)];

        for message_id in &self.message_ids {
            args.push(message_id.to_string());
        }

        cmd("SADD")
            .arg(&args)
            .query_async::<_, ()>(&mut con)
            .await?;

        Ok(())
    }

    pub async fn find_by_channel_id(channel_id: Id<ChannelMarker>) -> Result<Self, RedisPoolError> {
        let mut con = REDIS.get().await?;

        let members: Vec<String> = cmd("SMEMBERS")
            .arg(&[format!("channels:{}:messages", channel_id)])
            .query_async(&mut con)
            .await?;

        Ok(Self {
            channel_id,
            message_ids: members
                .into_iter()
                .filter_map(|gid| gid.parse().ok())
                .collect(),
        })
    }
}
