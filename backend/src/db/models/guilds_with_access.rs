use redis::cmd;
use twilight_model::id::Id;
use twilight_model::id::marker::{GuildMarker, UserMarker};

use crate::db::{REDIS, RedisPoolError};

pub struct GuildsWithAccessModel {
    pub user_id: Id<UserMarker>,
    pub guild_ids: Vec<Id<GuildMarker>>,
}

impl GuildsWithAccessModel {
    pub async fn save(&self) -> Result<(), RedisPoolError> {
        let mut con = REDIS.get().await?;

        let mut args = vec![format!("users:{}:guilds", self.user_id)];
        for guild_id in &self.guild_ids {
            args.push(guild_id.to_string());
        }

        cmd("SADD")
            .arg(&args)
            .query_async::<_, ()>(&mut con)
            .await?;

        Ok(())
    }

    pub async fn check_user_access_to_guild(
        user_id: Id<UserMarker>,
        guild_id: Id<GuildMarker>,
    ) -> Result<bool, RedisPoolError> {
        let mut con = REDIS.get().await?;

        cmd("SISMEMBER")
            .arg(&[format!("users:{}:guilds", user_id), guild_id.to_string()])
            .query_async(&mut con)
            .await
            .map_err(|e| e.into())
    }

    pub async fn find_by_user_id(user_id: Id<UserMarker>) -> Result<Self, RedisPoolError> {
        let mut con = REDIS.get().await?;

        let members: Vec<String> = cmd("SMEMBERS")
            .arg(&[format!("users:{}:guilds", user_id)])
            .query_async(&mut con)
            .await?;

        Ok(Self {
            user_id,
            guild_ids: members.into_iter().filter_map(|gid| gid.parse().ok()).collect()
        })
    }
}
