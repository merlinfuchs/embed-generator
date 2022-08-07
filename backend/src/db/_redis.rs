use deadpool_redis::{Config, Pool, PoolError, Runtime};
use lazy_static::lazy_static;
use redis::RedisError;
use std::fmt::{Debug, Display, Formatter};

lazy_static! {
    pub static ref REDIS: Pool = Config::from_url("redis://127.0.0.1/")
        .create_pool(Some(Runtime::Tokio1))
        .unwrap();
}

#[derive(Debug)]
pub enum RedisPoolError {
    PoolError(PoolError),
    RedisError(RedisError),
}

impl Display for RedisPoolError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            RedisPoolError::PoolError(e) => Display::fmt(e, f),
            RedisPoolError::RedisError(e) => Display::fmt(e, f),
        }
    }
}

impl From<PoolError> for RedisPoolError {
    fn from(e: PoolError) -> Self {
        Self::PoolError(e)
    }
}

impl From<RedisError> for RedisPoolError {
    fn from(e: RedisError) -> Self {
        Self::RedisError(e)
    }
}
