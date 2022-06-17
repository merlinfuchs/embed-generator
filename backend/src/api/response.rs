use std::borrow::Cow;
use std::fmt::Debug;

use actix_web::body::BoxBody;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{HttpResponse, ResponseError};
use awc::error::{JsonPayloadError, SendRequestError};
use log::error;
use mongodb::error::Error as MongoError;
use serde::Serialize;
use twilight_http::Error;

use crate::db::RedisPoolError;

pub type RouteResult<T> = Result<Json<RouteResponse<T>>, RouteError>;

#[derive(Debug, Serialize)]
pub struct RouteResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorResponseWrapper>,
}

impl<T: Serialize> RouteResponse<T> {
    pub fn success(data: Option<T>) -> Self {
        Self {
            success: true,
            data,
            error: None,
        }
    }
}

impl<T: Serialize> From<T> for RouteResponse<T> {
    fn from(d: T) -> Self {
        Self::success(Some(d))
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorResponseWrapper {
    #[serde(flatten)]
    pub inner: RouteError,
    pub details: Option<String>
}

#[derive(Debug, Clone, thiserror::Error, Serialize)]
#[serde(rename_all = "snake_case", tag = "code")]
pub enum RouteError {
    #[error("Not found")]
    NotFound { entity: Cow<'static, str> },
    #[error("A database operation has failed")]
    DatabaseError,
    #[error("Field validation failed")]
    ValidationError {
        field: Cow<'static, str>,
        details: Cow<'static, str>,
    },
    #[error("No or invalid token provided")]
    InvalidToken,
    #[error("A background request has failed")]
    BackgroundRequestFailed { details: String },
    #[error("You don't have access to the discord server")]
    MissingGuildAccess,
    #[error("You don't have access to the discord channel")]
    MissingChannelAccess,
    #[error("The provided channel doesn't belong to the provided server")]
    GuildChannelMismatch,
    #[error("The bot can't create a new webhook because there are already 10 for the channel")]
    ChannelWebhookLimitReached,
    #[error("The type of the channel is not supported")]
    UnsupportedChannelType,
    #[error("A request to the Discord API has failed")]
    DiscordApi,
    #[error("You have reached the maximum count of messages")]
    MessageLimitReached,
}

impl ResponseError for RouteError {
    fn status_code(&self) -> StatusCode {
        use RouteError::*;

        match self {
            NotFound { .. } => StatusCode::NOT_FOUND,
            DatabaseError => StatusCode::INTERNAL_SERVER_ERROR,
            ValidationError { .. } => StatusCode::BAD_REQUEST,
            InvalidToken => StatusCode::UNAUTHORIZED,
            BackgroundRequestFailed { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            MissingGuildAccess => StatusCode::FORBIDDEN,
            MissingChannelAccess => StatusCode::FORBIDDEN,
            GuildChannelMismatch => StatusCode::BAD_REQUEST,
            ChannelWebhookLimitReached => StatusCode::BAD_REQUEST,
            UnsupportedChannelType => StatusCode::BAD_REQUEST,
            DiscordApi => StatusCode::BAD_REQUEST,
            MessageLimitReached => StatusCode::FORBIDDEN
        }
    }

    fn error_response(&self) -> HttpResponse<BoxBody> {
        HttpResponse::build(self.status_code()).json(&RouteResponse::<()> {
            success: false,
            data: None,
            error: Some(ErrorResponseWrapper {
                inner: self.clone(),
                details: Some(format!("{}", self))
            }),
        })
    }
}

impl From<awc::error::SendRequestError> for RouteError {
    fn from(e: SendRequestError) -> Self {
        Self::BackgroundRequestFailed {
            details: format!("{:?}", e),
        }
    }
}

impl From<awc::error::JsonPayloadError> for RouteError {
    fn from(e: JsonPayloadError) -> Self {
        Self::BackgroundRequestFailed {
            details: format!("{:?}", e),
        }
    }
}

impl From<jsonwebtoken::errors::Error> for RouteError {
    fn from(_: jsonwebtoken::errors::Error) -> Self {
        todo!()
    }
}

impl From<RedisPoolError> for RouteError {
    fn from(e: RedisPoolError) -> Self {
        error!("Redis operation failed: {:}", e);
        Self::DatabaseError
    }
}

impl From<MongoError> for RouteError {
    fn from(e: MongoError) -> Self {
        error!("Database operation failed: {:?}", e);
        Self::DatabaseError
    }
}

impl From<twilight_http::Error> for RouteError {
    fn from(e: Error) -> Self {
        error!("Discord API error: {}", e);
        Self::DiscordApi
    }
}
