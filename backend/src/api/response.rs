use std::borrow::Cow;

use actix_web::{HttpResponse, ResponseError};
use actix_web::body::BoxBody;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use awc::error::{JsonPayloadError, SendRequestError};
use log::error;
use mongodb::error::Error as MongoError;
use serde::Serialize;

use crate::db::RedisPoolError;

pub type RouteResult<T> = Result<Json<RouteResponse<T>>, RouteError>;

#[derive(Debug, Serialize)]
pub struct RouteResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<RouteError>,
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

#[derive(Debug, Clone, thiserror::Error, Serialize)]
#[serde(rename_all = "snake_case", tag = "code")]
pub enum RouteError {
    #[error("Not found")]
    NotFound { entity: Cow<'static, str> },
    #[error("Database operation failed")]
    DatabaseError,
    #[error("Validation failed")]
    ValidationError {
        field: Cow<'static, str>,
        details: Cow<'static, str>,
    },
    #[error("No or invalid token provided")]
    InvalidToken,
    #[error("Background fetch request failed")]
    BackgroundRequestFailed,
    #[error("Missing guild access")]
    MissingGuildAccess,
}

impl ResponseError for RouteError {
    fn status_code(&self) -> StatusCode {
        use RouteError::*;

        match self {
            NotFound { .. } => StatusCode::NOT_FOUND,
            DatabaseError => StatusCode::INTERNAL_SERVER_ERROR,
            ValidationError { .. } => StatusCode::BAD_REQUEST,
            InvalidToken => StatusCode::UNAUTHORIZED,
            BackgroundRequestFailed => StatusCode::UNAUTHORIZED,
            MissingGuildAccess => StatusCode::FORBIDDEN,
        }
    }

    fn error_response(&self) -> HttpResponse<BoxBody> {
        HttpResponse::build(self.status_code()).json(&RouteResponse::<()> {
            success: false,
            data: None,
            error: Some(self.clone()),
        })
    }
}

impl From<awc::error::SendRequestError> for RouteError {
    fn from(_: SendRequestError) -> Self {
        Self::BackgroundRequestFailed
    }
}

impl From<awc::error::JsonPayloadError> for RouteError {
    fn from(_: JsonPayloadError) -> Self {
        Self::BackgroundRequestFailed
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
